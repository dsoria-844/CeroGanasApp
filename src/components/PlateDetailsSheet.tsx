import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ChefHat, Bike, Sparkles, CheckCircle2, Trash2, Heart, Lightbulb, Flame, Tag } from 'lucide-react';
import { MealCardItem } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';

interface PlateDetailsSheetProps {
  isOpen: boolean;
  plate: MealCardItem | null;
  isCandidate: boolean;
  canAddCandidate: boolean;
  isLocked?: boolean;
  onClose: () => void;
  onLike: () => void;
  onRemoveCandidate: (id: string) => void;
}

export const PlateDetailsSheet: React.FC<PlateDetailsSheetProps> = ({
  isOpen,
  plate,
  isCandidate,
  canAddCandidate,
  isLocked = false,
  onClose,
  onLike,
  onRemoveCandidate,
}) => {
  // Close on Escape key in desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plate) return null;

  // Extract ingredients from existing data only
  const ingredients: { name: string; amount?: string }[] =
    plate.recipe?.allIngredientsFormatted && plate.recipe.allIngredientsFormatted.length > 0
      ? plate.recipe.allIngredientsFormatted
      : (plate.ingredientsSummary || []).map((name) => ({ name }));

  // Extract difficulty or secondary attribute
  const secondaryAttribute =
    plate.recipe?.difficulty
      ? `Dificultad ${plate.recipe.difficulty}`
      : plate.deliveryOption?.priceLevel
      ? `Precio ${plate.deliveryOption.priceLevel}`
      : plate.categoryLabel;

  const handleLikeClick = () => {
    if (isLocked || !canAddCandidate) return;
    sound.playClick(800);
    triggerHaptic('success');
    onClose();
    onLike();
  };

  const handleRemoveClick = () => {
    if (isLocked) return;
    sound.playTick(400);
    triggerHaptic('light');
    onRemoveCandidate(plate.id);
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plate-details-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm select-none"
      >
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full sm:max-w-md max-h-[90vh] sm:max-h-[82vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden"
        >
          {/* Mobile Handle Indicator */}
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                  plate.type === 'cooking'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                }`}
              >
                {plate.type === 'cooking' ? (
                  <ChefHat className="w-3 h-3" />
                ) : (
                  <Bike className="w-3 h-3" />
                )}
                <span>{plate.type === 'cooking' ? 'Cocina Casera' : 'Delivery'}</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer"
              title="Cerrar detalles"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Title & Emoji Hero */}
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-3xl shrink-0 shadow-sm">
                {plate.imageEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  id="plate-details-title"
                  className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight"
                >
                  {plate.name}
                </h3>
                {plate.description && (
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                    {plate.description}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.05] flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-400 block font-medium">Tiempo</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                    {plate.timeEstimate}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.05] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-400 block font-medium">Estilo</span>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                    {secondaryAttribute}
                  </span>
                </div>
              </div>

              {plate.caloriesApprox && (
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.05] flex items-center gap-2 col-span-2 sm:col-span-1">
                  <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block font-medium">Calorías</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                      {plate.caloriesApprox}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Ingredients Section (Only if they exist) */}
            {ingredients.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-black/[0.05] dark:border-white/[0.05]">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Ingredientes principales
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-black/[0.03] dark:border-white/[0.04]"
                    >
                      <span>•</span>
                      <span>{ing.name}</span>
                      {ing.amount && (
                        <span className="text-zinc-400 text-[10px]">({ing.amount})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Chef Tip / Vibe Highlight (Only if exists) */}
            {(plate.recipe?.chefTip || (plate.vibe && !plate.vibe.includes('Tip del Chef'))) && (
              <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{plate.recipe?.chefTip ? 'Tip del Chef' : 'Detalle'}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-95">
                  {plate.recipe?.chefTip || plate.vibe}
                </p>
              </div>
            )}

            {/* Tags (Only if exist) */}
            {plate.tags && plate.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                {plate.tags.slice(0, 5).map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Decision Bar */}
          <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.05] bg-zinc-50/80 dark:bg-zinc-800/40 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {isCandidate ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>✓ Está entre tus candidatos para la ruleta</span>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveClick}
                  disabled={isLocked}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-500/20 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar de candidatos</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleLikeClick}
                  disabled={isLocked || !canAddCandidate}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    canAddCandidate && !isLocked
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25 active:scale-[0.99]'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Me tienta (agregar a candidatos)</span>
                </button>

                {!canAddCandidate && (
                  <p className="text-[11px] text-center text-zinc-500 dark:text-zinc-400">
                    Ya completaste los 5 candidatos para la ruleta.
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
