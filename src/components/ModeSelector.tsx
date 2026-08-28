import React from 'react';
import { Bike, ChefHat, ArrowRight, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';
import { MealHistoryItem } from '../types';

interface ModeSelectorProps {
  onSelectMode: (mode: 'delivery' | 'cooking') => void;
  onOpenExclusions: () => void;
  pantryCount: number;
  remainingRerolls: number;
  history: MealHistoryItem[];
  exclusionsCount: number;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onSelectMode,
  onOpenExclusions,
  pantryCount,
  remainingRerolls,
  history,
  exclusionsCount,
}) => {
  const lastMeal = history.length > 0 ? history[0] : null;

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Primary Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Card (Deep Dark Zinc) */}
        <div
          id="btn-mode-delivery"
          onClick={() => onSelectMode('delivery')}
          className="group relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between hover:border-zinc-500 transition-all duration-300 cursor-pointer shadow-lg min-h-[280px]"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-100 group-hover:scale-110 transition-transform">
              <Bike className="w-7 h-7 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-light text-zinc-50 tracking-tight">
                Pedir Delivery
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Ruleta rápida para cuando no hay tiempo ni ganas de limpiar. Máximo 3 giros diarios para evitar la fatiga.
              </p>
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-zinc-800/80 mt-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono tracking-wider bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800 text-zinc-400">
                Cheat Meal
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800 text-zinc-400">
                Saludable
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">
              <span>{remainingRerolls}/3 giros</span>
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:translate-x-1 transition-transform border border-zinc-700">
                <ArrowRight className="w-4 h-4 text-zinc-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Cooking Card (High-Contrast Inverted Ivory/White) */}
        <div
          id="btn-mode-cooking"
          onClick={() => onSelectMode('cooking')}
          className="group relative bg-zinc-100 text-zinc-900 border border-transparent rounded-3xl p-8 flex flex-col justify-between hover:bg-white transition-all duration-300 cursor-pointer shadow-xl min-h-[280px]"
        >
          <div className="space-y-4">
            <div className="w-14 h-14 bg-zinc-900 text-zinc-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChefHat className="w-7 h-7 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-medium text-zinc-950 tracking-tight">
                Cocinar en Casa
              </h2>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Optimiza lo que tienes en la heladera. Recetas inteligentes en 3 pasos ordenadas por afinidad.
              </p>
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-zinc-200 mt-4">
            <div className="flex gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-mono tracking-wider bg-zinc-200 text-zinc-800 px-2.5 py-1 rounded-md">
                Proteínas
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-zinc-200 text-zinc-800 px-2.5 py-1 rounded-md">
                Verduras
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
              <span>{pantryCount} en despensa</span>
              <div className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-100 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exclusions and Rules Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                {exclusionsCount > 0
                  ? `${exclusionsCount} exclusiones activas configuradas`
                  : 'Filtros & Preferencias'}
              </p>
              <p className="text-[11px] text-zinc-400">
                {exclusionsCount > 0
                  ? 'Se omiten automáticamente de la ruleta y las recetas.'
                  : 'Puedes bloquear ingredientes como cebolla, mariscos o frituras.'}
              </p>
            </div>
          </div>

          <button
            id="btn-quick-config-exclusions"
            onClick={onOpenExclusions}
            className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:text-white transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Configurar Exclusiones</span>
          </button>
        </div>

        {/* Anti-fatigue Reminder / Quote */}
        <div className="md:col-span-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex items-center">
          {lastMeal ? (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Última comida</p>
              <p className="text-xs text-zinc-300 font-medium">
                {lastMeal.emoji} {lastMeal.name}
              </p>
              <p className="text-[10px] text-zinc-500 italic">Bloqueado por 4 días para variar</p>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic font-serif leading-relaxed">
              "Una decisión rápida ahorra energía mental para lo que de verdad importa."
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

