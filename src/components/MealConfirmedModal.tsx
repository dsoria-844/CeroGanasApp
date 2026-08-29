import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, History, Check } from 'lucide-react';
import { sound } from '../utils/audio';

interface MealConfirmedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewHistory: () => void;
  meal: {
    name: string;
    emoji: string;
    type: 'delivery' | 'cooking';
  } | null;
}

export const MealConfirmedModal: React.FC<MealConfirmedModalProps> = ({
  isOpen,
  onClose,
  onViewHistory,
  meal,
}) => {
  if (!isOpen || !meal) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
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

          {/* Top badge */}
          <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
              <span>¡Excelente opción elegida!</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight pt-1">
              ¡A disfrutar de tu comida!
            </h2>
          </div>

          {/* Sloth Chef Image */}
          <div className="relative mx-auto w-48 h-48 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-md border border-black/[0.06] dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center p-2">
            <img
              src="./sloth-cooking-happy.jpg"
              alt="Cocinero Perezoso Feliz"
              className="w-full h-full object-contain filter drop-shadow-sm select-none"
            />
          </div>

          {/* Dish pill & explanation */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08] text-sm font-bold text-zinc-800 dark:text-zinc-100">
              <span>{meal.emoji}</span>
              <span>{meal.name}</span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-sm mx-auto px-2">
              Este plato ha quedado guardado en tu <strong>historial</strong> para que puedas visualizar lo que vas comiendo sin inconvenientes.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                sound.playSuccess();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 btn-press cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>¡Entendido, a comer!</span>
            </button>

            <button
              onClick={() => {
                sound.playClick(750);
                onViewHistory();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 border border-black/[0.06] dark:border-white/[0.06] btn-press cursor-pointer transition-colors"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ver en mi historial</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
