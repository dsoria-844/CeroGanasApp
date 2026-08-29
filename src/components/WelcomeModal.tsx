import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Zap, 
  Sparkles, 
  Utensils, 
  ShoppingBag
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
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl p-6 sm:p-7 flex flex-col items-center text-center space-y-4 overscroll-contain touch-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 btn-press cursor-pointer"
            title="Cerrar bienvenida"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Mascot Image */}
          <div className="relative pt-1">
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-lg border-2 border-amber-500/30 bg-amber-500/10 p-1 mx-auto flex items-center justify-center">
              <img 
                src="./welcome-mascot.jpg" 
                alt="Chef Perezoso Cero Ganas" 
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          </div>

          {/* Heading & Main Question */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Bienvenido a Cero Ganas
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
              ¿Qué comemos?
            </h2>
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              Porque <span className="text-zinc-900 dark:text-zinc-100 font-bold">cero ganas</span> de <span className="text-amber-500 font-bold">pensar</span>.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto pt-1">
              Tu chef perezoso decide por ti. Elige cómo quieres resolver tu comida hoy:
            </p>
          </div>

          {/* Action Options */}
          <div className="w-full space-y-2 pt-2">
            {/* Action 1: ¡Tengo Hambre! */}
            <button
              onClick={() => handleAction(onOpenBlindMode)}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center justify-between shadow-md shadow-amber-500/20 btn-press cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-zinc-950/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div className="text-left">
                  <span className="block font-bold">¡Tengo Hambre!</span>
                  <span className="block text-[10px] font-medium text-zinc-800">Decisión instantánea en 3s</span>
                </div>
              </div>
              <span className="text-xs font-bold bg-zinc-950/10 px-2 py-0.5 rounded-full">Rápido</span>
            </button>

            {/* Action 2: Ver 20 platos */}
            <button
              onClick={() => handleAction(() => onSelectTab('decide'))}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs sm:text-sm flex items-center justify-between shadow-xs btn-press cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block font-bold">Elegir entre 20 platos</span>
                  <span className="block text-[10px] font-medium opacity-70">Navega y haz un sorteo</span>
                </div>
              </div>
              <span className="text-xs opacity-70">→</span>
            </button>

            {/* Action 3: Despensa Inteligente */}
            <button
              onClick={() => handleAction(() => onSelectTab('pantry'))}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm flex items-center justify-between border border-black/[0.06] dark:border-white/[0.06] btn-press cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block font-bold">Despensa Inteligente</span>
                  <span className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Match por ingredientes</span>
                </div>
              </div>
              <span className="text-xs text-zinc-400">→</span>
            </button>
          </div>

          {/* Footer checkbox */}
          <div 
            className="pt-1 flex items-center justify-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 cursor-pointer" 
            onClick={() => setDontShowAgain(prev => !prev)}
          >
            <input 
              type="checkbox" 
              id="dontShowWelcome"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-amber-500 accent-amber-500 cursor-pointer"
            />
            <label htmlFor="dontShowWelcome" className="cursor-pointer select-none">
              No mostrar automáticamente al inicio
            </label>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
