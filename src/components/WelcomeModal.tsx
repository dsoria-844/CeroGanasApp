import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Zap, 
  Sparkles, 
  Utensils, 
  ShoppingBag,
  Check
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';
import { AppTab } from '../types';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
  onOpenBlindMode: () => void;
}

const modalContentVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const modalItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
    },
  },
};

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenBlindMode,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    sound.playClick(650);
    triggerHaptic('light');
    if (dontShowAgain) {
      localStorage.setItem('cero_ganas_welcome_seen', 'true');
    }
    onClose();
  };

  const handleAction = (callback: () => void) => {
    sound.playClick(900);
    triggerHaptic('medium');
    if (dontShowAgain) {
      localStorage.setItem('cero_ganas_welcome_seen', 'true');
    }
    onClose();
    callback();
  };

  const handleToggleDontShow = () => {
    sound.playClick(800);
    triggerHaptic('light');
    setDontShowAgain(prev => !prev);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden select-none overscroll-none touch-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 sm:p-7 flex flex-col items-center text-center space-y-4 overscroll-contain touch-auto"
        >
          {/* Close Button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 cursor-pointer transition-colors shadow-2xs z-20"
            title="Cerrar bienvenida"
          >
            <X className="w-4 h-4" />
          </motion.button>

          <motion.div
            variants={modalContentVariants}
            initial="hidden"
            animate="show"
            className="w-full flex flex-col items-center space-y-4"
          >
            {/* Mascot Image with Spring Entrance & Glow */}
            <motion.div variants={modalItemVariants} className="relative pt-1">
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-xl border-2 border-amber-500/30 bg-amber-500/10 p-1 mx-auto flex items-center justify-center relative">
                <img 
                  src="./welcome-mascot.jpg" 
                  alt="Chef Perezoso Cero Ganas" 
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
            </motion.div>

            {/* Heading & Main Question */}
            <motion.div variants={modalItemVariants} className="space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Bienvenido a Cero Ganas</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
                ¿Qué comemos?
              </h2>
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                Porque <span className="text-zinc-900 dark:text-zinc-100 font-bold">cero ganas</span> de <span className="text-amber-500 font-bold">pensar</span>.
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto pt-1">
                Tu chef perezoso decide por ti. Elige cómo quieres resolver tu comida hoy:
              </p>
            </motion.div>

            {/* Action Options */}
            <motion.div variants={modalItemVariants} className="w-full space-y-2 pt-1">
              {/* Action 1: ¡Tengo Hambre! */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAction(onOpenBlindMode)}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-amber-500/25 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-zinc-950/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Zap className="w-4 h-4 fill-current text-zinc-950" />
                  </div>
                  <div className="text-left">
                    <span className="block font-extrabold">¡Tengo Hambre!</span>
                    <span className="block text-[10px] font-medium text-zinc-900/80">Decisión instantánea en 3s</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold bg-zinc-950/15 px-2 py-0.5 rounded-full">Rápido ⚡</span>
              </motion.button>

              {/* Action 2: Ver 20 platos */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAction(() => onSelectTab('decide'))}
                className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs sm:text-sm flex items-center justify-between shadow-xs cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center group-hover:rotate-6 transition-transform">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Elegir entre 20 platos</span>
                    <span className="block text-[10px] font-medium opacity-70">Navega y haz un sorteo</span>
                  </div>
                </div>
                <span className="text-xs opacity-70 group-hover:translate-x-1 transition-transform">→</span>
              </motion.button>

              {/* Action 3: Despensa Inteligente */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAction(() => onSelectTab('pantry'))}
                className="w-full py-2.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs sm:text-sm flex items-center justify-between border border-black/[0.06] dark:border-white/[0.06] cursor-pointer transition-colors group shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center group-hover:rotate-6 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold">Despensa Inteligente</span>
                    <span className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Recetas con lo que tienes</span>
                  </div>
                </div>
                <span className="text-xs text-zinc-400 group-hover:translate-x-1 transition-transform">→</span>
              </motion.button>
            </motion.div>

            {/* Footer checkbox with tactile micro-interaction */}
            <motion.div 
              variants={modalItemVariants}
              className="pt-1 flex items-center justify-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 cursor-pointer" 
              onClick={handleToggleDontShow}
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors cursor-pointer ${
                  dontShowAgain
                    ? 'bg-amber-500 border-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-black/[0.12] dark:border-white/[0.12]'
                }`}
              >
                {dontShowAgain && <Check className="w-3 h-3 stroke-[3]" />}
              </motion.div>
              <label className="cursor-pointer select-none">
                No mostrar automáticamente al inicio
              </label>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
