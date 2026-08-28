import React from 'react';
import { 
  X, 
  History, 
  Trash2, 
  ShieldCheck 
} from 'lucide-react';
import { MealHistoryItem } from '../types';
import { triggerHaptic } from '../utils/storage';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-light text-zinc-50 tracking-tight">
                Historial de Comidas
              </h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
                Seguimiento de los últimos 4 días
              </p>
            </div>
          </div>

          <button
            id="btn-close-history"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-5 space-y-5 flex-1 pr-1 scrollbar-none">
          {/* Smart Rule Callout */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-zinc-200">Regla anti-monotonía:</strong> Las comidas elegidas en los últimos 4 días se bloquean de la ruleta de delivery para que no te canses de comer lo mismo.
            </p>
          </div>

          {/* List of Recent Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-500">
                Últimos 4 días ({activeRecentItems.length})
              </span>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onClearHistory();
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar todo</span>
                </button>
              )}
            </div>

            {activeRecentItems.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center space-y-2">
                <p className="text-3xl">🍽️</p>
                <p className="text-xs font-medium text-zinc-200">
                  No hay comidas recientes registradas
                </p>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  Cuando aceptes una opción de delivery o receta casera, se guardará aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeRecentItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                        {item.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-medium text-zinc-100 truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
                            {item.type === 'delivery' ? '🛵 Delivery' : '🍳 Casero'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {item.dateFormatted} • {item.timeFormatted}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        onDeleteHistoryItem(item.id);
                      }}
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors shrink-0 cursor-pointer"
                      title="Eliminar del historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Older items if any */}
          {olderItems.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-500">
                Historial anterior ({olderItems.length})
              </span>
              <div className="space-y-2">
                {olderItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between text-xs text-zinc-400"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{item.emoji}</span>
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({item.dateFormatted})</span>
                    </div>
                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="text-zinc-500 hover:text-zinc-200 p-1 cursor-pointer"
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
        <div className="pt-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-100 font-medium text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

