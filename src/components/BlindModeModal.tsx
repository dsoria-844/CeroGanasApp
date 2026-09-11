import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Sparkles, RefreshCw, ChefHat, Bike } from 'lucide-react';
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

const COUNTDOWN_MESSAGES: Record<number, string> = {
  3: 'Estoy pensando...',
  2: 'No le des más vueltas...',
  1: 'Listo.',
};

export const BlindModeModal: React.FC<BlindModeModalProps> = ({
  isOpen,
  onClose,
  exclusions,
  history,
  favorites,
  onAcceptMeal,
  onOpenRecipeModal,
}) => {
  const [stage, setStage] = useState<'countdown' | 'revealed'>('countdown');
  const [chosenMeal, setChosenMeal] = useState<MealCardItem | null>(null);
  const [counter, setCounter] = useState(3);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const isSubmittingRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  const startCountdown = useCallback(() => {
    clearTimers();
    setStage('countdown');
    setCounter(3);

    const picked = pickBlindDecisionMeal(exclusions, history, favorites);
    setChosenMeal(picked);

    sound.playTick(600);
    triggerHaptic('medium');

    const t2 = setTimeout(() => {
      setCounter(2);
      sound.playTick(700);
      triggerHaptic('light');
    }, 1000);

    const t1 = setTimeout(() => {
      setCounter(1);
      sound.playTick(800);
      triggerHaptic('light');
    }, 2000);

    const tReveal = setTimeout(() => {
      setStage('revealed');
      sound.playSuccess();
      triggerHaptic('success');
      triggerVictoryConfetti();
    }, 3000);

    timersRef.current = [t2, t1, tReveal];
  }, [clearTimers, exclusions, history, favorites]);

  useEffect(() => {
    if (isOpen) {
      startCountdown();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isOpen, startCountdown, clearTimers]);

  if (!isOpen || !chosenMeal) return null;

  const handleClose = useCallback(() => {
    sound.playClick(600);
    clearTimers();
    onClose();
  }, [clearTimers, onClose]);

  // Keyboard navigation: Escape closes modal only once revealed
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleOpenDelivery = () => {
    if (!chosenMeal || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    sound.playSuccess();
    triggerHaptic('success');
    onAcceptMeal(
      chosenMeal.name,
      chosenMeal.type,
      chosenMeal.imageEmoji,
      `¡Tengo Hambre! • Delivery`
    );
    const url = getDeliverySearchUrl(chosenMeal.name);
    window.open(url, '_blank');
    onClose();
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 500);
  };

  const handleOpenRecipe = () => {
    if (!chosenMeal || !onOpenRecipeModal || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    sound.playClick(800);
    onAcceptMeal(
      chosenMeal.name,
      chosenMeal.type,
      chosenMeal.imageEmoji,
      `¡Tengo Hambre! • ${chosenMeal.timeEstimate}`
    );
    onClose();
    onOpenRecipeModal(chosenMeal);
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 500);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (stage === 'revealed' && e.target === e.currentTarget) {
            handleClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="blind-modal-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden touch-none select-none"
          style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        >
          {/* Ambient background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button only accessible once decision is revealed */}
          {stage === 'revealed' && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer z-10 shadow-2xs"
              aria-label="Cerrar decisión rápida"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}

          {/* 1. COUNTDOWN STAGE: 3... 2... 1... (Sin botones ni interacción) */}
          {stage === 'countdown' && (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                  <span>Decisión Inmediata</span>
                </div>
                <h2 id="blind-modal-title" className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight pt-1">
                  ¡Tengo Hambre!
                </h2>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-2 space-y-4 flex flex-col items-center justify-center"
              >
                {/* Sloth Thinking Avatar + Animated Countdown Circle */}
                <div className="relative w-44 h-44 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src="./sloth-thinking.jpg"
                    alt="Chef perezoso pensando..."
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <AnimatePresence mode="popLayout">
                      <motion.div 
                        key={counter}
                        initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
                        animate={{ scale: [0.3, 1.25, 1], opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.3, opacity: 0, rotate: 10 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-20 h-20 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-4xl font-black shadow-lg shadow-amber-500/60 border-2 border-amber-300">
                          {counter}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Per-second Chef accompaniment message */}
                <div className="h-6 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={counter}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-bold tracking-wide"
                    >
                      "{COUNTDOWN_MESSAGES[counter] || 'Estoy pensando...'}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}

          {/* 2. REVEALED STAGE: YA ESTÁ DECIDIDO / ACCIONES POSTERIORES */}
          {stage === 'revealed' && chosenMeal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="space-y-4"
            >
              {/* Header: Veredicto / Certeza absoluta */}
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                  <span>Problema resuelto</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight pt-0.5">
                  Hoy comemos esto.
                </h2>
              </div>

              {/* Dish Solution Hero Card — El plato como protagonista absoluto */}
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] space-y-3 relative overflow-hidden shadow-sm"
              >
                {/* Protagonist Dish Card */}
                <div className="mx-auto flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10"
                  >
                    <span className="text-6xl sm:text-7xl filter drop-shadow-md select-none" role="img" aria-label={chosenMeal.name}>
                      {chosenMeal.imageEmoji}
                    </span>
                  </motion.div>
                </div>

                {/* Dish Name: Muy Protagonista */}
                <div className="space-y-1 pt-0.5">
                  <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                    {chosenMeal.name}
                  </h3>
                </div>

                {/* Badges: tiempo, kcal, modalidad */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                    ⏱️ {chosenMeal.timeEstimate}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                    🔥 {chosenMeal.caloriesApprox || '~520 kcal'}
                  </span>
                  {chosenMeal.type === 'delivery' ? (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      🛵 Delivery
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      🍳 Casero
                    </span>
                  )}
                </div>

                {/* Chef short quote (máximo una línea) */}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic pt-0.5 border-t border-black/[0.04] dark:border-white/[0.06]">
                  "Tranqui, yo elijo. Problema resuelto."
                </p>
              </motion.div>

              {/* 3. ACCIONES POSTERIORES: ACCIÓN PRINCIPAL SEGÚN MODALIDAD + DAME OTRA OPCIÓN */}
              <div className="space-y-2 pt-1">
                {/* CTA Principal según modalidad */}
                {chosenMeal.type === 'cooking' ? (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    id="btn-blind-action-cook"
                    onClick={handleOpenRecipe}
                    className="w-full py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-colors"
                  >
                    <ChefHat className="w-5 h-5 stroke-[2.5]" />
                    <span>Ver receta</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    id="btn-blind-action-delivery"
                    onClick={handleOpenDelivery}
                    className="w-full py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-colors"
                  >
                    <Bike className="w-5 h-5 stroke-[2.5]" />
                    <span>Pedir ahora</span>
                  </motion.button>
                )}

                {/* Acción Secundaria única: Dame otra opción */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(650);
                    startCountdown();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Dame otra opción</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
