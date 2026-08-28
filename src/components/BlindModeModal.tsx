import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, CheckCircle2, Utensils, ExternalLink, Sparkles, ChefHat } from 'lucide-react';
import { MealCardItem, MealHistoryItem, UserFavoriteMeal } from '../types';
import { pickBlindDecisionMeal, triggerHaptic, triggerVictoryConfetti } from '../utils/storage';

interface BlindModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  exclusions: string[];
  history: MealHistoryItem[];
  favorites: UserFavoriteMeal[];
  onAcceptMeal: (mealName: string, type: 'delivery' | 'cooking', emoji: string, details?: string) => void;
  onOpenRecipeModal?: (item: MealCardItem) => void;
}

export const BlindModeModal: React.FC<BlindModeModalProps> = ({
  isOpen,
  onClose,
  exclusions,
  history,
  favorites,
  onAcceptMeal,
  onOpenRecipeModal,
}) => {
  const [stage, setStage] = useState<'suspense' | 'revealed'>('suspense');
  const [chosenMeal, setChosenMeal] = useState<MealCardItem | null>(null);
  const [counter, setCounter] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setStage('suspense');
      setCounter(3);
      const picked = pickBlindDecisionMeal(exclusions, history, favorites);
      setChosenMeal(picked);

      triggerHaptic('medium');

      // Countdown countdown suspense
      const t1 = setTimeout(() => {
        setCounter(2);
        triggerHaptic('light');
      }, 400);

      const t2 = setTimeout(() => {
        setCounter(1);
        triggerHaptic('light');
      }, 800);

      const t3 = setTimeout(() => {
        setStage('revealed');
        triggerHaptic('success');
        triggerVictoryConfetti();
      }, 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen, exclusions, history, favorites]);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (!chosenMeal) return;
    triggerHaptic('success');
    onAcceptMeal(
      chosenMeal.name,
      chosenMeal.type,
      chosenMeal.imageEmoji,
      `Modo A Ciegas • ${chosenMeal.timeEstimate}`
    );
    onClose();
  };

  const handleOpenDelivery = () => {
    if (!chosenMeal) return;
    const query = encodeURIComponent(chosenMeal.name);
    window.open(`https://www.google.com/search?q=${query}+delivery+cerca+de+mi`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-amber-500/40 p-6 sm:p-8 shadow-2xl overflow-hidden text-center space-y-6"
        >
          {/* Subtle glowing ambient background effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span>Decisión Inmediata Forzada</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light text-zinc-100 tracking-tight pt-1">
              Modo A Ciegas
            </h2>
            <p className="text-xs text-zinc-400">
              Cero dudas. Sin derecho a reintentos para eliminar la fatiga mental.
            </p>
          </div>

          {/* SUSPENSE STAGE */}
          {stage === 'suspense' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-zinc-900 border-2 border-amber-500/50 flex items-center justify-center text-3xl font-mono font-bold text-amber-400 animate-bounce">
                {counter}
              </div>
              <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
                Eligiendo la orden definitiva...
              </p>
            </div>
          )}

          {/* REVEALED STAGE */}
          {stage === 'revealed' && chosenMeal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="space-y-6"
            >
              {/* Decree Badge */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 relative overflow-hidden">
                <div className="text-5xl sm:text-6xl animate-pulse">
                  {chosenMeal.imageEmoji}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold block">
                    ⚡ HOY COMÉS:
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-zinc-50 leading-tight">
                    {chosenMeal.name}
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                    {chosenMeal.categoryLabel}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                    ⏱️ {chosenMeal.timeEstimate}
                  </span>
                  {chosenMeal.caloriesApprox && (
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                      🔥 {chosenMeal.caloriesApprox}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 italic pt-1 border-t border-zinc-800/80 font-serif">
                  "{chosenMeal.vibe}"
                </p>
              </div>

              {/* Contextual Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {chosenMeal.type === 'delivery' ? (
                  <button
                    id="btn-blind-delivery"
                    onClick={handleOpenDelivery}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer shadow-lg"
                  >
                    <span>🛵 Abrir en app de delivery / Buscar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  chosenMeal.recipe && onOpenRecipeModal && (
                    <button
                      id="btn-blind-view-recipe"
                      onClick={() => {
                        onClose();
                        onOpenRecipeModal(chosenMeal);
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-700"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Receta en 3 Pasos</span>
                    </button>
                  )
                )}

                <button
                  id="btn-blind-accept"
                  onClick={handleAccept}
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Acepto la orden! Guardar en historial</span>
                </button>
              </div>

              <p className="text-[10px] text-zinc-500 font-mono text-center">
                * El botón de reintentar fue deshabilitado para evitar la parálisis de decisión.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
