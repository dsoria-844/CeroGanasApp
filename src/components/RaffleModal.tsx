import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, ChefHat, ExternalLink, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { MealCardItem } from '../types';
import { sound } from '../utils/audio';

interface RaffleModalProps {
  isOpen: boolean;
  winner: MealCardItem | null;
  isPreparing: boolean;
  isSpinning: boolean;
  candidateCount: number;
  onClose: () => void;
  onAcceptMeal: (meal: MealCardItem) => void;
  onOpenRecipeModal?: (meal: MealCardItem) => void;
  onOpenDelivery?: (meal: MealCardItem) => void;
  onReroll?: () => void;
}

export const RaffleModal: React.FC<RaffleModalProps> = ({
  isOpen,
  winner,
  isPreparing,
  isSpinning,
  candidateCount,
  onClose,
  onAcceptMeal,
  onOpenRecipeModal,
  onOpenDelivery,
  onReroll,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSpinning) {
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden touch-none select-none"
          style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        >
          {/* Subtle glowing ambient background effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          {!isSpinning && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer z-10 shadow-2xs"
              title="Cerrar sorteo"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}

          {/* Header */}
          <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>Sorteo de Platos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight pt-1">
              {isPreparing ? 'Reuniendo candidatos...' : isSpinning ? '¡Sorteando al azar!' : '¡Plato Ganador!'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isPreparing
                ? `Preparando sorteo entre tus ${candidateCount} opciones...`
                : isSpinning
                ? 'El chef perezoso está girando la ruleta...'
                : 'La suerte ha decidido tu menú de hoy.'}
            </p>
          </div>

          {/* PREPARING STAGE SKELETON */}
          {isPreparing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-4 space-y-4 flex flex-col items-center justify-center"
            >
              <div className="relative w-44 h-44 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-zinc-100 dark:bg-zinc-800">
                <img
                  src="./sloth-thinking.jpg"
                  alt="Preparando sorteo..."
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center animate-spin">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Mezclando platos...
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide animate-pulse">
                Reuniendo tus {candidateCount} recetas posibles...
              </p>
            </motion.div>
          )}

          {/* SPINNING OR REVEALED STAGE */}
          {!isPreparing && winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 320 }}
              className="space-y-5"
            >
              {/* Winner Card */}
              <motion.div 
                className={`p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border space-y-3 relative overflow-hidden shadow-sm transition-all ${
                  isSpinning 
                    ? 'border-amber-500 animate-pulse scale-98' 
                    : 'border-black/[0.06] dark:border-white/[0.08]'
                }`}
              >
                <motion.div 
                  key={winner.id}
                  initial={{ scale: 0.5, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 18 }}
                  className="text-5xl sm:text-6xl inline-block"
                >
                  {winner.imageEmoji}
                </motion.div>

                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold block">
                    {isSpinning ? 'Girando...' : 'Salió elegido:'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                    {winner.name}
                  </h3>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                    {winner.categoryLabel}
                  </span>
                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                    ⏱️ {winner.timeEstimate}
                  </span>
                  {winner.caloriesApprox && (
                    <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                      🔥 {winner.caloriesApprox}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                  "{winner.vibe}"
                </p>
              </motion.div>

              {/* Action Buttons (Only when not spinning) */}
              {!isSpinning && (
                <div className="space-y-2.5 pt-1">
                  {winner.type === 'delivery' ? (
                    onOpenDelivery && (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onOpenDelivery(winner)}
                        className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 transition-colors"
                      >
                        <span>Buscar en la app de delivery</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </motion.button>
                    )
                  ) : (
                    winner.type === 'cooking' && onOpenRecipeModal && (
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onOpenRecipeModal(winner)}
                        className="w-full py-3.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 font-semibold text-xs flex items-center justify-center gap-2 border border-black/[0.08] dark:border-white/[0.08] cursor-pointer transition-colors shadow-2xs"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                        <span>Ver Receta en 3 Pasos</span>
                      </motion.button>
                    )
                  )}

                  <div className="flex gap-2">
                    {onReroll && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReroll}
                        className="py-3.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-black/[0.06] dark:border-white/[0.06] cursor-pointer transition-colors shadow-2xs shrink-0"
                        title="Sortear de nuevo"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Re-sortear</span>
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onAcceptMeal(winner)}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>¡Acepto el plato!</span>
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
