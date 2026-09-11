import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Dices, 
  RotateCcw, 
  Check, 
  ChefHat,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import { WeeklyPlan, MealPlanSlot, MealHistoryItem, Recipe, MealCardItem, DayPlan } from '../types';
import { 
  loadWeeklyPlan, 
  saveWeeklyPlan, 
  generateFullWeeklyPlan, 
  rerollSingleSlot, 
  triggerHaptic, 
  triggerVictoryConfetti,
  getMergedRecipes,
  isSlotEmpty,
  isWeeklyPlanEmpty,
  clearWeeklyPlan
} from '../utils/storage';
import { RECIPES_DATASET } from '../data/mealsData';
import { sound } from '../utils/audio';

interface WeeklyPlanViewProps {
  exclusions: string[];
  history: MealHistoryItem[];
  weeklyPlan?: WeeklyPlan | null;
  onUpdatePlan?: (plan: WeeklyPlan) => void;
  onClearPlan?: () => void;
  onGeneratePlan?: () => void;
  onRerollSlot?: (dayIndex: number, slotType: 'lunch' | 'dinner') => void;
  onAcceptMeal: (mealName: string, type: 'delivery' | 'cooking', emoji: string, details?: string) => void;
  onOpenRecipeModal?: (recipe: Recipe | MealCardItem) => void;
  onNavigateDecide?: () => void;
  onAddEmptySlot?: (dayId: DayPlan['dayId'], slotType: 'lunch' | 'dinner') => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 26,
    },
  },
};

export const WeeklyPlanView: React.FC<WeeklyPlanViewProps> = ({
  exclusions,
  history,
  weeklyPlan: propWeeklyPlan,
  onUpdatePlan,
  onClearPlan: propOnClearPlan,
  onGeneratePlan: propOnGeneratePlan,
  onRerollSlot: propOnRerollSlot,
  onAcceptMeal,
  onOpenRecipeModal,
  onNavigateDecide,
  onAddEmptySlot,
}) => {
  const [localPlan, setLocalPlan] = useState<WeeklyPlan | null>(() => loadWeeklyPlan());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const currentPlan = propWeeklyPlan !== undefined ? propWeeklyPlan : localPlan;
  const isPlanEmpty = isWeeklyPlanEmpty(currentPlan);

  useEffect(() => {
    if (propWeeklyPlan === undefined) {
      const saved = loadWeeklyPlan();
      setLocalPlan(saved);
    }
  }, [propWeeklyPlan]);

  const handleGeneratePlan = () => {
    sound.playClick(900);
    setIsGenerating(true);
    triggerHaptic('medium');

    setTimeout(() => {
      if (propOnGeneratePlan) {
        propOnGeneratePlan();
      } else {
        const generated = generateFullWeeklyPlan(exclusions, history);
        setLocalPlan(generated);
        if (onUpdatePlan) onUpdatePlan(generated);
      }
      setIsGenerating(false);
      sound.playSuccess();
      triggerHaptic('success');
      triggerVictoryConfetti();
    }, 350);
  };

  const handleClearPlan = () => {
    sound.playClick(500);
    triggerHaptic('medium');
    if (propOnClearPlan) {
      propOnClearPlan();
    } else {
      const empty = clearWeeklyPlan();
      setLocalPlan(empty);
      if (onUpdatePlan) onUpdatePlan(empty);
    }
  };

  const handleRerollSlot = (dayIndex: number, slotType: 'lunch' | 'dinner') => {
    if (propOnRerollSlot) {
      propOnRerollSlot(dayIndex, slotType);
      return;
    }

    if (!currentPlan) return;
    sound.playTick(700);
    triggerHaptic('light');

    const updated = [...currentPlan];
    const currentSlot = updated[dayIndex][slotType];
    const newSlot = rerollSingleSlot(currentSlot.type, exclusions, currentSlot.mealName);

    updated[dayIndex] = {
      ...updated[dayIndex],
      [slotType]: newSlot,
    };

    setLocalPlan(updated);
    saveWeeklyPlan(updated);
    if (onUpdatePlan) onUpdatePlan(updated);
  };

  const handleMarkEaten = (slot: MealPlanSlot, dayName: string, slotLabel: string) => {
    sound.playSuccess();
    triggerHaptic('success');
    onAcceptMeal(
      slot.mealName,
      slot.type,
      slot.emoji,
      `Menú Semanal • ${dayName} (${slotLabel})`
    );

    if (!currentPlan) return;
    const updated = currentPlan.map(d => {
      return {
        ...d,
        lunch: d.lunch.id === slot.id ? { ...d.lunch, isEaten: true } : d.lunch,
        dinner: d.dinner.id === slot.id ? { ...d.dinner, isEaten: true } : d.dinner,
      };
    });
    setLocalPlan(updated);
    saveWeeklyPlan(updated);
    if (onUpdatePlan) onUpdatePlan(updated);
  };

  const handleCardClick = (slot: MealPlanSlot) => {
    sound.playClick(800);
    triggerHaptic('light');
    if (slot.type === 'cooking') {
      const allRecipes = getMergedRecipes();
      const slotNameLower = (slot.mealName || '').toLowerCase().trim();
      const match = allRecipes.find(r => (slot.recipeId && r.id === slot.recipeId) || (r.name || '').toLowerCase().trim() === slotNameLower);
      if (match && onOpenRecipeModal) {
        onOpenRecipeModal(match);
      } else if (onOpenRecipeModal) {
        const found = RECIPES_DATASET.find(r => (slot.recipeId && r.id === slot.recipeId) || (r.name || '').toLowerCase().trim() === slotNameLower);
        if (found) {
          onOpenRecipeModal(found);
        } else {
          onOpenRecipeModal({
            id: slot.recipeId || slot.id,
            name: slot.mealName,
            imageEmoji: slot.emoji,
            type: 'cooking',
            categoryLabel: slot.category,
            timeEstimate: slot.timeEstimate,
            caloriesApprox: slot.caloriesApprox,
          } as any);
        }
      }
    } else if (slot.type === 'delivery') {
      const query = encodeURIComponent(slot.mealName);
      window.open(`https://www.google.com/search?q=${query}+delivery+pedir`, '_blank');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-16 select-none">
      {/* Top Banner & Actions */}
      <div className="apple-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Plan Semanal de Comidas
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Almuerzos y cenas variados para toda la semana.
          </p>
        </div>

        {!isPlanEmpty && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleClearPlan}
              className="px-3.5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="Vaciar todo el plan semanal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar plan</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              id="btn-generate-weekly-plan"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-xs flex items-center justify-center gap-2 btn-press cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
            >
              <Dices className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isGenerating ? 'Generando...' : 'Regenerar Todo'}</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {isPlanEmpty ? (
        <div className="apple-card p-10 sm:p-14 text-center space-y-4 text-zinc-400">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl">
            📅
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-zinc-800 dark:text-zinc-100">
              Tu semana todavía está vacía
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Podés generar un menú completo automáticamente o ir agregando platos individuales desde la pantalla principal, la despensa o tu historial.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              id="btn-generate-weekly-plan-empty"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-amber-500/25 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Dices className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generando...' : 'Generar Menú Semanal'}</span>
            </motion.button>
            {onNavigateDecide && (
              <button
                onClick={() => {
                  sound.playClick(750);
                  onNavigateDecide();
                }}
                className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold cursor-pointer transition-colors"
              >
                Explorar 20 platos
              </button>
            )}
          </div>
        </div>
      ) : (
        /* DAYS GRID WITH STAGGERED MOTION */
        currentPlan && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
          >
            {currentPlan.map((day, dayIdx) => (
              <motion.div
                key={day.dayId}
                variants={cardVariants}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="apple-card p-4 space-y-3 flex flex-col justify-between"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-2 px-0.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {day.dayName}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    Día {dayIdx + 1}
                  </span>
                </div>

                {/* LUNCH SLOT */}
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] space-y-2 relative group">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Almuerzo
                    </span>
                    {!isSlotEmpty(day.lunch) && (
                      <motion.button
                        whileTap={{ scale: 0.85, rotate: -45 }}
                        onClick={() => handleRerollSlot(dayIdx, 'lunch')}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Cambiar este almuerzo"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </motion.button>
                    )}
                  </div>

                  {isSlotEmpty(day.lunch) ? (
                    <div 
                      onClick={() => onAddEmptySlot ? onAddEmptySlot(day.dayId, 'lunch') : onNavigateDecide?.()}
                      className="p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 text-center text-zinc-400 hover:text-amber-500 hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[64px]"
                      title="Sumar plato al almuerzo"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[11px]">+ Sumar plato</span>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div 
                          key={day.lunch.id}
                          initial={{ opacity: 0, scale: 0.92, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -6 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                          onClick={() => handleCardClick(day.lunch)}
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.92 }}
                            className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-lg shadow-xs shrink-0"
                          >
                            {day.lunch.emoji}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-semibold truncate transition-colors ${
                              day.lunch.isEaten ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-900 dark:text-zinc-100'
                            }`}>
                              {day.lunch.mealName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                              <span>{day.lunch.timeEstimate}</span>
                              <span>•</span>
                              <span className="truncate">{day.lunch.category}</span>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          {day.lunch.type === 'cooking' ? (
                            <>
                              <ChefHat className="w-2.5 h-2.5 text-amber-500" />
                              <span>Casero</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                              <span>Delivery</span>
                            </>
                          )}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleMarkEaten(day.lunch, day.dayName, 'Almuerzo')}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                            day.lunch.isEaten
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-xs'
                              : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <Check className={`w-2.5 h-2.5 stroke-[3] ${day.lunch.isEaten ? 'text-amber-400 dark:text-amber-500' : ''}`} />
                          <span>{day.lunch.isEaten ? 'Listo' : 'Comí'}</span>
                        </motion.button>
                      </div>
                    </>
                  )}
                </div>

                {/* DINNER SLOT */}
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] space-y-2 relative group">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Cena
                    </span>
                    {!isSlotEmpty(day.dinner) && (
                      <motion.button
                        whileTap={{ scale: 0.85, rotate: -45 }}
                        onClick={() => handleRerollSlot(dayIdx, 'dinner')}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Cambiar esta cena"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </motion.button>
                    )}
                  </div>

                  {isSlotEmpty(day.dinner) ? (
                    <div 
                      onClick={() => onAddEmptySlot ? onAddEmptySlot(day.dayId, 'dinner') : onNavigateDecide?.()}
                      className="p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/40 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 text-center text-zinc-400 hover:text-amber-500 hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[64px]"
                      title="Sumar plato a la cena"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="font-semibold text-[11px]">+ Sumar plato</span>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div 
                          key={day.dinner.id}
                          initial={{ opacity: 0, scale: 0.92, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -6 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                          onClick={() => handleCardClick(day.dinner)}
                          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.92 }}
                            className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-lg shadow-xs shrink-0"
                          >
                            {day.dinner.emoji}
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-semibold truncate transition-colors ${
                              day.dinner.isEaten ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-900 dark:text-zinc-100'
                            }`}>
                              {day.dinner.mealName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                              <span>{day.dinner.timeEstimate}</span>
                              <span>•</span>
                              <span className="truncate">{day.dinner.category}</span>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          {day.dinner.type === 'cooking' ? (
                            <>
                              <ChefHat className="w-2.5 h-2.5 text-amber-500" />
                              <span>Casero</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                              <span>Delivery</span>
                            </>
                          )}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={() => handleMarkEaten(day.dinner, day.dayName, 'Cena')}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                            day.dinner.isEaten
                              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-xs'
                              : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <Check className={`w-2.5 h-2.5 stroke-[3] ${day.dinner.isEaten ? 'text-amber-400 dark:text-amber-500' : ''}`} />
                          <span>{day.dinner.isEaten ? 'Listo' : 'Comí'}</span>
                        </motion.button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  );
};
