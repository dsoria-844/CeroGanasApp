import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  History, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';
import { MealHistoryItem } from '../types';
import { triggerHaptic } from '../utils/storage';
import { sound } from '../utils/audio';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: MealHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onDeleteHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const fourDaysAgo = Date.now() - (4 * 24 * 60 * 60 * 1000);
  const activeRecentItems = history.filter(item => item.timestamp >= fourDaysAgo);
  const olderItems = history.filter(item => item.timestamp < fourDaysAgo);

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
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Historial de Comidas
                </h3>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
                  Seguimiento de los últimos 4 días
                </p>
              </div>
            </div>

            <button
              id="btn-close-history"
              onClick={() => {
                sound.playClick(600);
                onClose();
              }}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors btn-press cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 scrollbar-none">
            {/* Smart Rule Callout */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-zinc-800 dark:text-zinc-200">Regla anti-monotonía:</strong> Las comidas elegidas en los últimos 4 días se bloquean de la ruleta para asegurar variedad en tu dieta.
              </p>
            </div>

            {/* List of Recent Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  Últimos 4 días ({activeRecentItems.length})
                </span>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playClick(450);
                      triggerHaptic('medium');
                      onClearHistory();
                    }}
                    className="text-xs text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-1 btn-press cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Borrar todo</span>
                  </button>
                )}
              </div>

              {activeRecentItems.length === 0 ? (
                <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] text-center space-y-2">
                  <p className="text-3xl">🍽️</p>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    No hay comidas recientes registradas
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                    Cuando aceptes una opción de delivery o receta casera, se guardará aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeRecentItems.map(item => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-xl shrink-0">
                          {item.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {item.name}
                            </h4>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full border border-black/[0.04] dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 font-medium">
                              {item.type === 'delivery' ? '🛵 Delivery' : '🍳 Casero'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            {item.dateFormatted} • {item.timeFormatted}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick(450);
                          triggerHaptic('light');
                          onDeleteHistoryItem(item.id);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors btn-press cursor-pointer shrink-0"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Older items */}
            {olderItems.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                  Historial anterior ({olderItems.length})
                </span>
                <div className="space-y-1.5">
                  {olderItems.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{item.emoji}</span>
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">({item.dateFormatted})</span>
                      </div>
                      <button
                        onClick={() => {
                          sound.playClick(450);
                          onDeleteHistoryItem(item.id);
                        }}
                        className="text-zinc-400 hover:text-red-500 p-1 btn-press cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
