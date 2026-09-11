import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Check, AlertCircle, ChefHat, Bike } from 'lucide-react';
import { DayPlan, WeeklyPlan } from '../types';
import { DAYS_OF_WEEK, isSlotEmpty } from '../utils/storage';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';

export interface AddToPlanMeal {
  name: string;
  type: 'cooking' | 'delivery';
  emoji: string;
  category?: string;
  timeEstimate?: string;
  caloriesApprox?: string;
  recipeId?: string;
  deliveryId?: string;
}

interface AddToPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: AddToPlanMeal | null;
  weeklyPlan: WeeklyPlan | null;
  onConfirmAdd: (dayId: DayPlan['dayId'], slotType: 'lunch' | 'dinner', meal: AddToPlanMeal) => void;
  onNavigatePlan?: () => void;
}

export const AddToPlanModal: React.FC<AddToPlanModalProps> = ({
  isOpen,
  onClose,
  meal,
  weeklyPlan,
  onConfirmAdd,
  onNavigatePlan,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayPlan['dayId']>('lunes');
  const [selectedSlot, setSelectedSlot] = useState<'lunch' | 'dinner'>('lunch');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state on open and cleanup timers on unmount
  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
      // Default to current day of week if possible
      const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
      const dayMap: DayPlan['dayId'][] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      setSelectedDay(dayMap[dayIndex] || 'lunes');
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  // Keyboard close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !meal) return null;

  // Check current occupancy and conflicts for selected day & slot
  const currentDayPlan = weeklyPlan ? weeklyPlan.find(d => d.dayId === selectedDay) : null;
  const targetSlot = currentDayPlan ? currentDayPlan[selectedSlot] : null;
  const isOccupied = !isSlotEmpty(targetSlot);
  const otherSlotType = selectedSlot === 'lunch' ? 'dinner' : 'lunch';
  const otherSlot = currentDayPlan ? currentDayPlan[otherSlotType] : null;
  const isDuplicateDay = !isSlotEmpty(otherSlot) && otherSlot?.mealName.toLowerCase().trim() === meal.name.toLowerCase().trim();

  const handleSave = () => {
    sound.playSuccess();
    triggerHaptic('success');
    onConfirmAdd(selectedDay, selectedSlot, meal);
    setIsSaved(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onClose();
      setIsSaved(false);
      saveTimeoutRef.current = null;
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-plan-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-center space-y-4 overflow-hidden select-none"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer z-10"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-1 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Plan Semanal</span>
            </div>
            <h3 id="add-to-plan-title" className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              ¿Cuándo querés comerlo?
            </h3>
          </div>

          {/* Dish Summary Badge */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.05] dark:border-white/[0.06] flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-2xl shadow-xs shrink-0">
              {meal.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {meal.name}
              </h4>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                meal.type === 'cooking'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
              }`}>
                {meal.type === 'cooking' ? <ChefHat className="w-2.5 h-2.5" /> : <Bike className="w-2.5 h-2.5" />}
                <span>{meal.type === 'cooking' ? 'Casero' : 'Delivery'}</span>
              </span>
            </div>
          </div>

          {/* Day of Week Selector */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Día de la semana:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDay === day.id;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      sound.playClick(750);
                      setSelectedDay(day.id);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                    }`}
                  >
                    {day.name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot Selector: Almuerzo vs Cena */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Momento del día:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick(800);
                  setSelectedSlot('lunch');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedSlot === 'lunch'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                }`}
              >
                <span>☀️ Almuerzo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick(800);
                  setSelectedSlot('dinner');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedSlot === 'dinner'
                    ? 'bg-amber-500 text-zinc-950 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750'
                }`}
              >
                <span>🌙 Cena</span>
              </button>
            </div>
          </div>

          {/* Occupancy & Conflict Feedback */}
          <div className="text-left text-xs space-y-1 pt-1">
            {isOccupied && (
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/25 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span className="truncate">
                  Reemplazará a: <strong>{targetSlot?.mealName}</strong>
                </span>
              </div>
            )}

            {isDuplicateDay && (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pl-1">
                ℹ️ Ya planificaste este plato para la otra comida de ese día.
              </p>
            )}

            {!isOccupied && !isDuplicateDay && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 pl-1 font-medium">
                ✓ El turno está libre para planificar.
              </p>
            )}
          </div>

          {/* Action CTA Buttons */}
          <div className="pt-2 space-y-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              disabled={isSaved}
              className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/25'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Agregado al plan!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Guardar en el plan semanal</span>
                </>
              )}
            </motion.button>

            {onNavigatePlan && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigatePlan();
                }}
                className="w-full py-1.5 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                Ver plan semanal completo →
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
