import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Plus, 
  AlertCircle
} from 'lucide-react';
import { COMMON_EXCLUSIONS } from '../data/mealsData';
import { saveExclusionsToStorage, triggerHaptic } from '../utils/storage';

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
      const updated = [...exclusions, normalized];
      onUpdateExclusions(updated);
      saveExclusionsToStorage(updated);
      triggerHaptic('success');
    }
    setCustomInput('');
  };

  const removeExclusion = (item: string) => {
    triggerHaptic('light');
    const updated = exclusions.filter(e => e.toLowerCase() !== item.toLowerCase());
    onUpdateExclusions(updated);
    saveExclusionsToStorage(updated);
  };

  const clearAllExclusions = () => {
    triggerHaptic('medium');
    onUpdateExclusions([]);
    saveExclusionsToStorage([]);
  };

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
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-light text-zinc-50 tracking-tight">
                Lista Negra & Exclusiones
              </h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">
                Ingredientes que jamás deben sugerirse
              </p>
            </div>
          </div>

          <button
            id="btn-close-exclusions"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1 scrollbar-none">
          {/* Notice info */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Cualquier comida de delivery o receta casera que contenga estos ingredientes o categorías quedará <strong className="text-zinc-200">bloqueada permanentemente</strong> en tus decisiones.
            </p>
          </div>

          {/* Quick Common Toggles */}
          <div className="space-y-3">
            <label className="text-xs uppercase font-mono tracking-widest text-zinc-500">
              Exclusiones comunes & alérgenos:
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_EXCLUSIONS.map(exc => {
                const isActive = exclusions.some(e => e.toLowerCase() === exc.id.toLowerCase());
                return (
                  <button
                    key={exc.id}
                    id={`btn-exclusion-toggle-${exc.id}`}
                    onClick={() => toggleExclusion(exc.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 border-transparent font-medium shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      isActive ? 'bg-zinc-950 text-white font-bold' : 'border border-zinc-700'
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
          <form onSubmit={handleAddCustom} className="space-y-3">
            <label className="text-xs uppercase font-mono tracking-widest text-zinc-500">
              Añadir ingrediente o plato personalizado:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Cilantro, Berenjena, Champiñones..."
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bloquear</span>
              </button>
            </div>
          </form>

          {/* Active Exclusions Pill List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase font-mono tracking-widest text-zinc-500">
                Exclusiones activas ({exclusions.length}):
              </label>
              {exclusions.length > 0 && (
                <button
                  onClick={clearAllExclusions}
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Borrar todas
                </button>
              )}
            </div>

            {exclusions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-1">
                No tienes exclusiones activas. Se sugerirá todo el menú.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {exclusions.map((exc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs"
                  >
                    <span>🚫 {exc}</span>
                    <button
                      onClick={() => removeExclusion(exc)}
                      className="text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer"
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
        <div className="pt-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-colors cursor-pointer"
          >
            Listo y Guardado
          </button>
        </div>
      </div>
    </div>
  );
};

