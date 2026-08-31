import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, History, Check } from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerHaptic, triggerVictoryConfetti } from '../utils/storage';

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

const confirmedContentVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const confirmedItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 26,
    },
  },
};

export const MealConfirmedModal: React.FC<MealConfirmedModalProps> = ({
  isOpen,
  onClose,
  onViewHistory,
  meal,
}) => {
  useEffect(() => {
    if (isOpen) {
      triggerVictoryConfetti();
      triggerHaptic('success');
    }
  }, [isOpen]);

  if (!isOpen || !meal) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClick(600);
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none touch-none overscroll-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden touch-none select-none"
          style={{ touchAction: 'none', overscrollBehavior: 'none' }}
        >
          {/* Subtle glowing ambient background effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer z-10 shadow-2xs"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </motion.button>

          <motion.div
            variants={confirmedContentVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Top badge */}
            <motion.div variants={confirmedItemVariants} className="flex flex-col items-center justify-center gap-1.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                <span>¡Excelente opción elegida!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight pt-1">
                ¡A disfrutar de tu comida!
              </h2>
            </motion.div>

            {/* Sloth Chef Image with Spring Avatar Pop */}
            <motion.div 
              variants={confirmedItemVariants}
              className="relative mx-auto w-48 h-48 sm:w-52 sm:h-52 rounded-3xl overflow-hidden shadow-xl border-2 border-amber-500/25 bg-amber-500/5 flex items-center justify-center p-2"
            >
              <img
                src="./sloth-cooking-happy.jpg"
                alt="Cocinero Perezoso Feliz"
                className="w-full h-full object-contain filter drop-shadow-sm select-none"
              />
            </motion.div>

            {/* Dish pill & explanation */}
            <motion.div variants={confirmedItemVariants} className="space-y-2">
              <motion.div 
                whileHover={{ scale: 1.03 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08] text-sm font-bold text-zinc-800 dark:text-zinc-100 shadow-2xs"
              >
                <span className="text-lg">{meal.emoji}</span>
                <span>{meal.name}</span>
              </motion.div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-sm mx-auto px-2">
                Este plato ha quedado guardado en tu <strong>historial</strong> para que puedas visualizar lo que vas comiendo sin inconvenientes.
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div variants={confirmedItemVariants} className="space-y-2 pt-1">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  sound.playSuccess();
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>¡Entendido, a comer!</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  sound.playClick(750);
                  onViewHistory();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 border border-black/[0.06] dark:border-white/[0.06] cursor-pointer transition-colors shadow-2xs"
              >
                <History className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ver en mi historial</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
