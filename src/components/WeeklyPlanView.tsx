import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Dices, 
  RotateCcw, 
  Check, 
  ChefHat,
  ExternalLink
} from 'lucide-react';
import { WeeklyPlan, MealPlanSlot, MealHistoryItem, Recipe, MealCardItem } from '../types';
import { 
  loadWeeklyPlan, 
  saveWeeklyPlan, 
  generateFullWeeklyPlan, 
  rerollSingleSlot, 
  triggerHaptic, 
  triggerVictoryConfetti,
  getAllCatalogMeals
} from '../utils/storage';
import { RECIPES_DATASET } from '../data/mealsData';
import { sound } from '../utils/audio';

interface WeeklyPlanViewProps {
  exclusions: string[];
  history: MealHistoryItem[];
  onAcceptMeal: (mealName: string, type: 'delivery' | 'cooking', emoji: string, details?: string) => void;
  onOpenRecipeModal?: (recipe: Recipe | MealCardItem) => void;
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
  onAcceptMeal,
  onOpenRecipeModal,
}) => {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    const saved = loadWeeklyPlan();
    if (saved && saved.length > 0) {
      setWeeklyPlan(saved);
    } else {
      const generated = generateFullWeeklyPlan(exclusions, history);
      setWeeklyPlan(generated);
    }
  }, [exclusions]);

  const handleGeneratePlan = () => {
    sound.playClick(900);
    setIsGenerating(true);
    triggerHaptic('medium');

    setTimeout(() => {
      const generated = generateFullWeeklyPlan(exclusions, history);
      setWeeklyPlan(generated);
      setIsGenerating(false);
      sound.playSuccess();
      triggerHaptic('success');
      triggerVictoryConfetti();
    }, 350);
  };

  const handleRerollSlot = (dayIndex: number, slotType: 'lunch' | 'dinner') => {
    if (!weeklyPlan) return;
    sound.playTick(700);
    triggerHaptic('light');

    const updated = [...weeklyPlan];
    const currentSlot = updated[dayIndex][slotType];
    const newSlot = rerollSingleSlot(currentSlot.type, exclusions, currentSlot.mealName);

    updated[dayIndex] = {
      ...updated[dayIndex],
      [slotType]: newSlot,
    };

    setWeeklyPlan(updated);
    saveWeeklyPlan(updated);
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

    if (!weeklyPlan) return;
    const updated = weeklyPlan.map(d => {
      return {
        ...d,
        lunch: d.lunch.id === slot.id ? { ...d.lunch, isEaten: true } : d.lunch,
        dinner: d.dinner.id === slot.id ? { ...d.dinner, isEaten: true } : d.dinner,
      };
    });
    setWeeklyPlan(updated);
    saveWeeklyPlan(updated);
  };

  const handleCardClick = (slot: MealPlanSlot) => {
    sound.playClick(800);
    triggerHaptic('light');
    if (slot.type === 'cooking') {
      const allCatalog = getAllCatalogMeals().filter(m => m.type === 'cooking');
      const match = allCatalog.find(r => r.id === slot.recipeId || r.name.toLowerCase().trim() === slot.mealName.toLowerCase().trim());
      if (match && match.recipe && onOpenRecipeModal) {
        onOpenRecipeModal(match.recipe);
      } else if (onOpenRecipeModal) {
        const found = RECIPES_DATASET.find(r => r.id === slot.recipeId || r.name.toLowerCase().trim() === slot.mealName.toLowerCase().trim());
        if (found) {
          onOpenRecipeModal(found);
        }
      }
    } else if (slot.type === 'delivery') {
      const query = encodeURIComponent(slot.mealName);
      window.open(`https://www.google.com/search?q=${query}+delivery+pedir`, '_blank');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-16 select-none">
      {/* Top Banner & Generator CTA */}
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

        <motion.button
          whileTap={{ scale: 0.94 }}
          id="btn-generate-weekly-plan"
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-xs flex items-center justify-center gap-2 btn-press cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
        >
          <Dices className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-amber-400' : ''}`} />
          <span>{isGenerating ? 'Generando...' : 'Generar Menú Semanal'}</span>
        </motion.button>
      </div>

      {/* DAYS GRID WITH STAGGERED MOTION */}
      {weeklyPlan && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
        >
          {weeklyPlan.map((day, dayIdx) => (
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
                  <motion.button
                    whileTap={{ scale: 0.85, rotate: -45 }}
                    onClick={() => handleRerollSlot(dayIdx, 'lunch')}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Cambiar este almuerzo"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </motion.button>
                </div>

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
              </div>

              {/* DINNER SLOT */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] space-y-2 relative group">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Cena
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85, rotate: -45 }}
                    onClick={() => handleRerollSlot(dayIdx, 'dinner')}
                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Cambiar esta cena"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </motion.button>
                </div>

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
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
