import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Dices, 
  RotateCcw, 
  Check, 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Utensils, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { WeeklyPlan, DayPlan, MealPlanSlot, MealHistoryItem, Recipe } from '../types';
import { 
  loadWeeklyPlan, 
  saveWeeklyPlan, 
  generateFullWeeklyPlan, 
  rerollSingleSlot, 
  triggerHaptic, 
  triggerVictoryConfetti 
} from '../utils/storage';
import { RECIPES_DATASET } from '../data/mealsData';

interface WeeklyPlanViewProps {
  exclusions: string[];
  history: MealHistoryItem[];
  onAcceptMeal: (mealName: string, type: 'delivery' | 'cooking', emoji: string, details?: string) => void;
  onOpenRecipeModal: (recipe: Recipe) => void;
}

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
      // Auto-generate initial plan if none exists
      const generated = generateFullWeeklyPlan(exclusions, history);
      setWeeklyPlan(generated);
    }
  }, [exclusions]);

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    triggerHaptic('medium');

    setTimeout(() => {
      const generated = generateFullWeeklyPlan(exclusions, history);
      setWeeklyPlan(generated);
      setIsGenerating(false);
      triggerHaptic('success');
      triggerVictoryConfetti();
    }, 400);
  };

  const handleRerollSlot = (dayIndex: number, slotType: 'lunch' | 'dinner') => {
    if (!weeklyPlan) return;
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
    triggerHaptic('success');
    onAcceptMeal(
      slot.mealName,
      slot.type,
      slot.emoji,
      `Menú Semanal • ${dayName} (${slotLabel})`
    );

    // Mark as eaten in plan
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
    if (slot.type === 'cooking' && slot.recipeId) {
      const recipe = RECIPES_DATASET.find(r => r.id === slot.recipeId);
      if (recipe) {
        onOpenRecipeModal(recipe);
      }
    } else if (slot.type === 'delivery') {
      const query = encodeURIComponent(slot.mealName);
      window.open(`https://www.google.com/search?q=${query}+delivery+pedir`, '_blank');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Main Generator Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-medium text-zinc-100">
              Plan Semanal de Comidas
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Menú equilibrado de Lunes a Domingo (almuerzos caseros rápidos y cenas balanceadas).
          </p>
        </div>

        <button
          id="btn-generate-weekly-plan"
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg shrink-0 disabled:opacity-50"
        >
          <Dices className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generando Menú...' : '🎲 Generar Menú de la Semana'}</span>
        </button>
      </div>

      {/* DAYS GRID */}
      {weeklyPlan && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weeklyPlan.map((day, dayIdx) => (
            <div
              key={day.dayId}
              className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-3 flex flex-col justify-between"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 px-1">
                <span className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
                  {day.dayName}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Día {dayIdx + 1}
                </span>
              </div>

              {/* LUNCH SLOT */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-2 relative group">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">
                    ☀️ <strong>Almuerzo</strong>
                  </span>
                  <button
                    onClick={() => handleRerollSlot(dayIdx, 'lunch')}
                    className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Re-sortear solo este almuerzo"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                <div 
                  onClick={() => handleCardClick(day.lunch)}
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                    {day.lunch.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-zinc-200 truncate">
                      {day.lunch.mealName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                      <span>⏱️ {day.lunch.timeEstimate}</span>
                      <span>•</span>
                      <span className="truncate">{day.lunch.category}</span>
                    </div>
                  </div>
                </div>

                {/* Mark as eaten action */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-500">
                    {day.lunch.type === 'cooking' ? '👨‍🍳 Casero' : '🛵 Delivery'}
                  </span>
                  <button
                    onClick={() => handleMarkEaten(day.lunch, day.dayName, 'Almuerzo')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                      day.lunch.isEaten
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                    <span>{day.lunch.isEaten ? 'Comido' : 'Comer'}</span>
                  </button>
                </div>
              </div>

              {/* DINNER SLOT */}
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-2 relative group">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1">
                    🌙 <strong>Cena</strong>
                  </span>
                  <button
                    onClick={() => handleRerollSlot(dayIdx, 'dinner')}
                    className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Re-sortear solo esta cena"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>

                <div 
                  onClick={() => handleCardClick(day.dinner)}
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                    {day.dinner.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-zinc-200 truncate">
                      {day.dinner.mealName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                      <span>⏱️ {day.dinner.timeEstimate}</span>
                      <span>•</span>
                      <span className="truncate">{day.dinner.category}</span>
                    </div>
                  </div>
                </div>

                {/* Mark as eaten action */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-500">
                    {day.dinner.type === 'cooking' ? '👨‍🍳 Casero' : '🛵 Delivery'}
                  </span>
                  <button
                    onClick={() => handleMarkEaten(day.dinner, day.dayName, 'Cena')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                      day.dinner.isEaten
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                    <span>{day.dinner.isEaten ? 'Comido' : 'Comer'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
