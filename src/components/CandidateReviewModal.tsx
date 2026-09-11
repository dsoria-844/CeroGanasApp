import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Clock, ChefHat, Bike, Check } from 'lucide-react';
import { MealCardItem } from '../types';

interface CandidateReviewModalProps {
  isOpen: boolean;
  candidates: MealCardItem[];
  maxCandidates: number;
  onClose: () => void;
  onRemoveCandidate: (id: string) => void;
  isLocked?: boolean;
}

export const CandidateReviewModal: React.FC<CandidateReviewModalProps> = ({
  isOpen,
  candidates,
  maxCandidates,
  onClose,
  onRemoveCandidate,
  isLocked = false,
}) => {
  // Desktop Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isReady = candidates.length >= maxCandidates;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-candidates-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm select-none"
      >
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden"
        >
          {/* Mobile Handle Indicator */}
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.05] dark:border-white/[0.05] shrink-0">
            <div className="flex items-center gap-2">
              <h3
                id="review-candidates-title"
                className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight"
              >
                Tus Candidatos
              </h3>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  isReady
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}
              >
                {candidates.length} de {maxCandidates}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer"
              title="Cerrar revisión"
              aria-label="Cerrar revisión"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subtitle Message */}
          <div className="px-5 pt-3 pb-1 shrink-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isReady
                ? '¡Tenés los 5 platos listos para la ruleta!'
                : `Tenés ${candidates.length} de ${maxCandidates}. Podés quitar platos o volver para completar 5.`}
            </p>
          </div>

          {/* Candidates Scrollable List */}
          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
            {candidates.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-zinc-400">
                <p className="text-sm font-medium">No tenés candidatos seleccionados todavía.</p>
                <p className="text-xs text-zinc-500">Tocá "Me tienta" en los platos que te gusten.</p>
              </div>
            ) : (
              candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.05] hover:border-black/[0.08] dark:hover:border-white/[0.1] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
                      {c.imageEmoji}
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-snug">
                        {c.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{c.timeEstimate}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          {c.type === 'cooking' ? (
                            <ChefHat className="w-2.5 h-2.5 text-emerald-500" />
                          ) : (
                            <Bike className="w-2.5 h-2.5 text-amber-500" />
                          )}
                          <span>{c.type === 'cooking' ? 'Cocinar' : 'Delivery'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => onRemoveCandidate(c.id)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title={`Quitar ${c.name} de candidatos`}
                      aria-label={`Quitar ${c.name} de candidatos`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-black/[0.05] dark:border-white/[0.05] bg-zinc-50/80 dark:bg-zinc-800/40 backdrop-blur shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-[0.99]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 active:scale-[0.99]'
              }`}
            >
              {isReady ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirmar candidatos</span>
                </>
              ) : (
                <span>Volver a elegir</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
