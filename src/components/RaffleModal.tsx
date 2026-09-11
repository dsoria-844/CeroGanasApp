import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, ChefHat, ExternalLink, Check, Sparkles, RefreshCw, RotateCw, Dices, CheckCircle2 } from 'lucide-react';
import { MealCardItem } from '../types';

interface RaffleModalProps {
  isOpen: boolean;
  winner: MealCardItem | null;
  isPreparing?: boolean;
  isSpinning: boolean;
  candidates?: MealCardItem[];
  activeCandidate?: MealCardItem | null;
  activeCandidateIndex?: number;
  shownWinnerIds?: string[];
  remainingCandidateCount?: number;
  canReroll?: boolean;
  candidateCount: number;
  onClose: () => void;
  onAcceptMeal: (meal: MealCardItem) => void;
  onOpenRecipeModal?: (meal: MealCardItem) => void;
  onOpenDelivery?: (meal: MealCardItem) => void;
  onReroll?: () => void;
  onResetRerolls?: () => void;
}

const formatCalories = (rawCal?: string): string => {
  if (!rawCal) return '';
  const numOnly = rawCal.replace(/[^0-9]/g, '').trim();
  if (!numOnly) return '';
  return `~${numOnly} kcal`;
};

export const RaffleModal: React.FC<RaffleModalProps> = ({
  isOpen,
  winner,
  isPreparing = false,
  isSpinning,
  candidates,
  activeCandidate,
  activeCandidateIndex = -1,
  shownWinnerIds = [],
  remainingCandidateCount,
  canReroll = true,
  candidateCount,
  onClose,
  onAcceptMeal,
  onOpenRecipeModal,
  onOpenDelivery,
  onReroll,
  onResetRerolls,
}) => {
  const isSubmittingRef = useRef<boolean>(false);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  const isDrawing = isSpinning || isPreparing;
  const currentCandidate = activeCandidate || winner;
  const candidatesList = candidates && candidates.length > 0 ? candidates : (currentCandidate ? [currentCandidate] : []);

  // Keyboard navigation: Escape closes only when WINNER is ready (blocked during DRAWING)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDrawing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDrawing, onClose]);

  // Autofocus primary action when winner appears
  useEffect(() => {
    if (isOpen && !isDrawing && winner && primaryButtonRef.current) {
      primaryButtonRef.current.focus();
    }
  }, [isOpen, isDrawing, winner]);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (isDrawing || isSubmittingRef.current || !winner) return;
    isSubmittingRef.current = true;
    onAcceptMeal(winner);
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 400);
  };

  const handleRerollClick = () => {
    if (isDrawing || !canReroll || remainingCandidateCount === 0) return;
    if (onReroll) onReroll();
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget && !isDrawing) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md select-none touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={isDrawing ? "drawing-title" : "winner-title"}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto overflow-x-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-4 sm:p-6 shadow-2xl text-center space-y-3 sm:space-y-4 select-none"
          style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        >
          {/* Subtle glowing ambient background effect - safely clipped within modal boundaries */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Close button - only visible once WINNER is revealed */}
          {!isDrawing && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer z-10 shadow-2xs"
              title="Cerrar sorteo"
              aria-label="Cerrar modal de sorteo"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}

          {/* STAGE: DRAWING (EL CHEF ESTÁ DECIDIENDO ENTRE TUS CANDIDATOS) */}
          {isDrawing && (
            <div className="space-y-3 sm:space-y-4 py-1">
              {/* Header */}
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider animate-pulse">
                  <Dices className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-spin" />
                  <span>El chef está decidiendo</span>
                </div>
                <h2 id="drawing-title" className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight pt-0.5">
                  {shownWinnerIds.length > 0 ? '¿Quién gana ahora?' : '¿Quién gana hoy?'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {shownWinnerIds.length > 0
                    ? `Quedan ${remainingCandidateCount ?? (candidatesList.length - shownWinnerIds.length)} opciones...`
                    : `Entre tus ${candidatesList.length || candidateCount} candidatos...`}
                </p>
              </div>

              {/* Mascot: Subtle sway animation */}
              <motion.div
                animate={{ rotate: [-2, 2, -2], scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-amber-500/30 bg-zinc-100 dark:bg-zinc-800 shrink-0"
              >
                <img
                  src="./sloth-thinking.jpg"
                  alt="El chef está decidiendo..."
                  className="w-full h-full object-cover select-none"
                />
              </motion.div>

              {/* Strip of all 5 candidate options */}
              {candidatesList.length > 1 && (
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-0.5">
                  {candidatesList.map((c, idx) => {
                    const isHighlighted = currentCandidate 
                      ? c.id === currentCandidate.id 
                      : idx === activeCandidateIndex;
                    const isAlreadyShown = shownWinnerIds.includes(c.id) && !isHighlighted;
                    return (
                      <motion.div
                        key={c.id || idx}
                        animate={{
                          scale: isHighlighted ? 1.25 : isAlreadyShown ? 0.85 : 0.92,
                          opacity: isHighlighted ? 1 : isAlreadyShown ? 0.25 : 0.5,
                          y: isHighlighted ? -3 : 0,
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-colors ${
                          isHighlighted
                            ? 'bg-amber-500/20 border-2 border-amber-500 shadow-md shadow-amber-500/30'
                            : isAlreadyShown
                              ? 'bg-zinc-100/50 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700'
                              : 'bg-zinc-100 dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08]'
                        }`}
                      >
                        {c.imageEmoji}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Highlighted active candidate passing through */}
              {currentCandidate && (
                <motion.div
                  key={currentCandidate.id}
                  initial={{ scale: 0.94, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                  className="p-4 sm:p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border-2 border-amber-500 shadow-xl shadow-amber-500/20 space-y-2 relative overflow-hidden"
                >
                  <div className="text-5xl sm:text-6xl inline-block filter drop-shadow-md">
                    {currentCandidate.imageEmoji}
                  </div>

                  <div className="space-y-0.5 px-1">
                    <span className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-extrabold block animate-pulse">
                      Pasando candidato...
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-tight break-words">
                      {currentCandidate.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-center gap-2 flex-wrap pt-0.5">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] shrink-0">
                      ⏱️ {currentCandidate.timeEstimate}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] max-w-full truncate">
                      {currentCandidate.categoryLabel}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* STAGE 3: REVEALED WINNER — EL MOMENTO EMOCIONAL MÁS FUERTE */}
          {!isPreparing && !isSpinning && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 320 }}
              className="space-y-3 sm:space-y-3.5"
            >
              {/* Header: Celebración y Veredicto */}
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
                  <span>¡PROBLEMA RESUELTO!</span>
                </div>
                <h2 id="winner-title" className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight pt-0.5">
                  Hoy comemos esto.
                </h2>
              </div>

              {/* Winner Solution Hero Card */}
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="p-4 sm:p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] space-y-2.5 sm:space-y-3 relative overflow-hidden shadow-sm"
              >
                {/* Chef Satisfecho + Winner Dish Emoji Composition */}
                <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-md bg-amber-500/10 shrink-0">
                  <img
                    src="./sloth-cooking-happy.jpg"
                    alt="Chef victorioso"
                    className="w-full h-full object-cover select-none"
                  />
                  <motion.span 
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 18, delay: 0.12 }}
                    className="absolute -bottom-1 -right-1 text-2xl sm:text-3xl filter drop-shadow-md bg-white/90 dark:bg-zinc-900/90 rounded-full p-1 border border-amber-500/20"
                  >
                    {winner.imageEmoji}
                  </motion.span>
                </div>

                {/* Dish Name: Protagonista Absoluto */}
                <div className="space-y-0.5 pt-0.5 px-1">
                  <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight break-words">
                    {winner.name}
                  </h3>
                </div>

                {/* Priority Badges: Tiempo · Modalidad · Dificultad/Vibe */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] shrink-0">
                      ⏱️ {winner.timeEstimate}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                      winner.type === 'delivery' 
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    }`}>
                      {winner.type === 'delivery' ? '🛵 Delivery' : '🍳 Cocinar'}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08] max-w-full truncate">
                      {winner.recipe?.difficulty || winner.vibe || winner.categoryLabel}
                    </span>
                  </div>

                  {/* Calories with lower visual weight (secundarias) */}
                  {winner.caloriesApprox && formatCalories(winner.caloriesApprox) && (
                    <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium block">
                      {formatCalories(winner.caloriesApprox)}
                    </span>
                  )}
                </div>

                {/* Cognitive reassurance */}
                <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-0.5 max-w-full">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="break-words">Queda guardado en tu historial al salir</span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
                {/* Primary CTA: Listo. Comemos esto. */}
                <motion.button
                  ref={primaryButtonRef}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  id="btn-raffle-done"
                  onClick={handleAccept}
                  disabled={isDrawing}
                  className="w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-colors btn-press disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Check className="w-5 h-5 stroke-[3] shrink-0" />
                  <span>Listo. Comemos esto.</span>
                </motion.button>

                {/* Direct execution shortcut if delivery */}
                {winner.type === 'delivery' && onOpenDelivery && (
                  <button
                    onClick={() => onOpenDelivery(winner)}
                    disabled={isDrawing}
                    className="w-full min-h-[40px] py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-black/[0.06] dark:border-white/[0.08] btn-press disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="break-words leading-tight text-center">Pedir {winner.name} por delivery</span>
                  </button>
                )}

                {/* Alternative Reroll */}
                {onReroll && (canReroll !== false && (remainingCandidateCount === undefined || remainingCandidateCount > 0)) ? (
                  <button
                    id="btn-raffle-reroll"
                    onClick={handleRerollClick}
                    disabled={isDrawing || !canReroll || remainingCandidateCount === 0}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer mx-auto active:scale-95 btn-press disabled:opacity-40 disabled:pointer-events-none"
                    aria-label={
                      remainingCandidateCount !== undefined 
                        ? `Dame otra opción (${remainingCandidateCount} restante${remainingCandidateCount === 1 ? '' : 's'})` 
                        : 'Dame otra opción'
                    }
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>
                      {remainingCandidateCount !== undefined
                        ? `Dame otra opción (${remainingCandidateCount} restante${remainingCandidateCount === 1 ? '' : 's'})`
                        : 'Dame otra opción'}
                    </span>
                  </button>
                ) : onReroll && remainingCandidateCount === 0 ? (
                  <div className="py-2.5 px-3 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.04] text-zinc-500 dark:text-zinc-400 text-xs font-semibold flex flex-col items-center justify-center gap-1 select-none">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>Ya vimos todas las opciones</span>
                    </div>
                    {onResetRerolls && (
                      <button
                        id="btn-raffle-restart-round"
                        onClick={onResetRerolls}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer pt-0.5"
                        aria-label="Volver a mezclar los candidatos de esta ronda"
                      >
                        <RotateCw className="w-3 h-3 text-amber-500" />
                        <span>Volver a mezclar los candidatos</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
