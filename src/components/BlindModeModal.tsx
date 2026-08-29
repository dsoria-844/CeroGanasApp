import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, CheckCircle2, ExternalLink, ChefHat, Sparkles } from 'lucide-react';
import { MealCardItem, MealHistoryItem, UserFavoriteMeal } from '../types';
import { pickBlindDecisionMeal, triggerHaptic, triggerVictoryConfetti, getDeliverySearchUrl } from '../utils/storage';
import { sound } from '../utils/audio';

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
  const [stage, setStage] = useState<'thinking' | 'countdown' | 'revealed'>('thinking');
  const [chosenMeal, setChosenMeal] = useState<MealCardItem | null>(null);
  const [counter, setCounter] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setStage('thinking');
      setCounter(3);
      const picked = pickBlindDecisionMeal(exclusions, history, favorites);
      setChosenMeal(picked);

      sound.playClick(900);
      triggerHaptic('medium');

      // 0s to 1.0s: Initial 1-second thinking
      // At 1.0s: Start 3-second countdown (showing image + countdown together)
      const tCountdownStart = setTimeout(() => {
        setStage('countdown');
        setCounter(3);
        sound.playTick(600);
        triggerHaptic('light');
      }, 1000);

      const tCount2 = setTimeout(() => {
        setCounter(2);
        sound.playTick(700);
        triggerHaptic('light');
      }, 2000);

      const tCount1 = setTimeout(() => {
        setCounter(1);
        sound.playTick(800);
        triggerHaptic('light');
      }, 3000);

      // At 4.0s: Reveal final meal
      const tReveal = setTimeout(() => {
        setStage('revealed');
        sound.playSuccess();
        triggerHaptic('success');
        triggerVictoryConfetti();
      }, 4000);

      return () => {
        clearTimeout(tCountdownStart);
        clearTimeout(tCount2);
        clearTimeout(tCount1);
        clearTimeout(tReveal);
      };
    }
  }, [isOpen, exclusions, history, favorites]);

  if (!isOpen || !chosenMeal) return null;

  const handleAccept = () => {
    sound.playSuccess();
    triggerHaptic('success');
    onAcceptMeal(
      chosenMeal.name,
      chosenMeal.type,
      chosenMeal.imageEmoji,
      `¡Tengo Hambre! • ${chosenMeal.timeEstimate}`
    );
    onClose();
  };

  const handleOpenDelivery = () => {
    if (!chosenMeal) return;
    sound.playClick(850);
    const url = getDeliverySearchUrl(chosenMeal.name);
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden touch-none select-none"
          style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        >
          {/* Subtle glowing ambient background effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors btn-press cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>Decisión Inmediata</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight pt-1">
              ¡Tengo Hambre!
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Decisión instantánea definitiva sin fatiga mental.
            </p>
          </div>

          {/* COMBINED SKELETON + COUNTDOWN STAGE (0s to 4s) */}
          {(stage === 'thinking' || stage === 'countdown') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-4 space-y-4 flex flex-col items-center justify-center"
            >
              {/* Sloth Chef Card with simultaneous Animated Countdown */}
              <div className="relative w-44 h-44 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-zinc-100 dark:bg-zinc-800">
                <img
                  src="./sloth-thinking.jpg"
                  alt="Pensando..."
                  className="w-full h-full object-cover"
                />

                {/* Overlay backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1">
                  {stage === 'thinking' ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center animate-spin">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Pensando...
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key={counter}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-amber-500/50">
                        {counter}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Status subtext */}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide animate-pulse">
                {stage === 'thinking' ? 'Revisando opciones con cero ganas...' : '¡Elegida en 3 segundos!'}
              </p>
            </motion.div>
          )}

          {/* STAGE 3: REVEALED STAGE */}
          {stage === 'revealed' && chosenMeal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 280 }}
              className="space-y-5"
            >
              {/* Decree Card */}
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] space-y-3 relative overflow-hidden">
                <div className="text-5xl sm:text-6xl">
                  {chosenMeal.imageEmoji}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold block">
                    Salio sorteado:
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                    {chosenMeal.name}
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                    {chosenMeal.categoryLabel}
                  </span>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                    ⏱️ {chosenMeal.timeEstimate}
                  </span>
                  {chosenMeal.caloriesApprox && (
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                      🔥 {chosenMeal.caloriesApprox}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                  "{chosenMeal.vibe}"
                </p>
              </div>

              {/* Contextual Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {chosenMeal.type === 'delivery' ? (
                  <button
                    id="btn-blind-delivery"
                    onClick={handleOpenDelivery}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 btn-press cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <span>🛵 Abrir en app de delivery / Buscar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  chosenMeal.recipe && onOpenRecipeModal && (
                    <button
                      id="btn-blind-view-recipe"
                      onClick={() => {
                        sound.playClick(800);
                        onClose();
                        onOpenRecipeModal(chosenMeal);
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 border border-black/[0.08] dark:border-white/[0.08] btn-press cursor-pointer"
                    >
                      <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ver Receta en 3 Pasos</span>
                    </button>
                  )
                )}

                <button
                  id="btn-blind-accept"
                  onClick={handleAccept}
                  className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 shadow-md btn-press cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Acepto la orden! Guardar en historial</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
