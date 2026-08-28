import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldAlert, 
  Plus, 
  AlertCircle
} from 'lucide-react';
import { COMMON_EXCLUSIONS } from '../data/mealsData';
import { saveExclusionsToStorage, triggerHaptic } from '../utils/storage';
import { sound } from '../utils/audio';

interface ExclusionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exclusions: string[];
  onUpdateExclusions: (newExclusions: string[]) => void;
}

export const ExclusionsModal: React.FC<ExclusionsModalProps> = ({
  isOpen,
  onClose,
  exclusions,
  onUpdateExclusions,
}) => {
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const toggleExclusion = (idOrName: string) => {
    sound.playClick(800);
    triggerHaptic('light');
    let updated: string[];
    const normalized = idOrName.toLowerCase().trim();
    if (exclusions.some(e => e.toLowerCase() === normalized)) {
      updated = exclusions.filter(e => e.toLowerCase() !== normalized);
    } else {
      updated = [...exclusions, normalized];
    }
    onUpdateExclusions(updated);
    saveExclusionsToStorage(updated);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const normalized = customInput.toLowerCase().trim();
    if (!exclusions.some(e => e.toLowerCase() === normalized)) {
      sound.playSuccess();
      const updated = [...exclusions, normalized];
      onUpdateExclusions(updated);
      saveExclusionsToStorage(updated);
      triggerHaptic('success');
    }
    setCustomInput('');
  };

  const removeExclusion = (item: string) => {
    sound.playClick(450);
    triggerHaptic('light');
    const updated = exclusions.filter(e => e.toLowerCase() !== item.toLowerCase());
    onUpdateExclusions(updated);
    saveExclusionsToStorage(updated);
  };

  const clearAllExclusions = () => {
    sound.playClick(450);
    triggerHaptic('medium');
    onUpdateExclusions([]);
    saveExclusionsToStorage([]);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Lista Negra & Exclusiones
                </h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
                  Ingredientes que jamás deben sugerirse
                </p>
              </div>
            </div>

            <button
              id="btn-close-exclusions"
              onClick={() => {
                sound.playClick(600);
                onClose();
              }}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors btn-press cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Scrollable */}
          <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1 scrollbar-none">
            {/* Notice info */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Cualquier comida de delivery o receta casera que contenga estos ingredientes quedará <strong className="text-zinc-900 dark:text-zinc-100">bloqueada permanentemente</strong> en tus decisiones.
              </p>
            </div>

            {/* Quick Common Toggles */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Exclusiones comunes & alérgenos:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EXCLUSIONS.map(exc => {
                  const isActive = exclusions.some(e => e.toLowerCase() === exc.id.toLowerCase());
                  return (
                    <button
                      key={exc.id}
                      id={`btn-exclusion-toggle-${exc.id}`}
                      onClick={() => toggleExclusion(exc.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 border btn-press cursor-pointer ${
                        isActive
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-semibold shadow-xs'
                          : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-black/[0.08] dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        isActive 
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold' 
                          : 'border border-zinc-300 dark:border-zinc-700'
                      }`}>
                        {isActive ? '✕' : '+'}
                      </span>
                      <span>{exc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Exclusion Input */}
            <form onSubmit={handleAddCustom} className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Añadir ingrediente personalizado:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Cilantro, Berenjena, Champiñones..."
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold btn-press disabled:opacity-40 flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bloquear</span>
                </button>
              </div>
            </form>

            {/* Active Exclusions Pill List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  Exclusiones activas ({exclusions.length}):
                </label>
                {exclusions.length > 0 && (
                  <button
                    onClick={clearAllExclusions}
                    className="text-xs text-zinc-400 hover:text-red-500 transition-colors btn-press cursor-pointer"
                  >
                    Borrar todas
                  </button>
                )}
              </div>

              {exclusions.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-1">
                  No tienes exclusiones activas. Se sugerirá todo el menú.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {exclusions.map((exc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-200 text-xs font-medium"
                    >
                      <span>🚫 {exc}</span>
                      <button
                        onClick={() => removeExclusion(exc)}
                        className="text-zinc-400 hover:text-red-500 p-0.5 btn-press cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0">
            <button
              onClick={() => {
                sound.playClick(700);
                onClose();
              }}
              className="w-full py-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs btn-press cursor-pointer shadow-xs"
            >
              Listo y Guardado
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
