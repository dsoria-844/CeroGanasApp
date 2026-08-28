import React from 'react';
import { Bike, ChefHat, ArrowRight, ShieldCheck, Sparkles, SlidersHorizontal } from 'lucide-react';
import { MealHistoryItem } from '../types';
import { sound } from '../utils/audio';

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
    <div className="w-full flex flex-col gap-6">
      {/* Primary Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Delivery Card */}
        <div
          id="btn-mode-delivery"
          onClick={() => {
            sound.playClick(850);
            onSelectMode('delivery');
          }}
          className="group relative bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-7 flex flex-col justify-between hover:border-amber-500/50 dark:hover:border-amber-400/50 transition-all duration-200 card-press cursor-pointer shadow-md shadow-black/[0.03] dark:shadow-black/40 min-h-[260px]"
        >
          <div className="space-y-4">
            <div className="w-13 h-13 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Bike className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Pedir Delivery
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Ruleta rápida para cuando no hay tiempo ni ganas de limpiar. Máximo 3 giros para evitar la fatiga mental.
              </p>
            </div>
          </div>

          <div className="pt-5 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.06] mt-4">
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">
                Cheat Meal
              </span>
              <span className="text-[10px] uppercase font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">
                Saludable
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>{remainingRerolls}/3 giros</span>
              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:translate-x-1 transition-transform border border-black/[0.04] dark:border-white/[0.06]">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Cooking Card */}
        <div
          id="btn-mode-cooking"
          onClick={() => {
            sound.playClick(850);
            onSelectMode('cooking');
          }}
          className="group relative bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-7 flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-emerald-400/50 transition-all duration-200 card-press cursor-pointer shadow-md shadow-black/[0.03] dark:shadow-black/40 min-h-[260px]"
        >
          <div className="space-y-4">
            <div className="w-13 h-13 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <ChefHat className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Cocinar en Casa
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                Aprovecha lo que tienes en la heladera. Recetas inteligentes en 3 pasos ordenadas por afinidad.
              </p>
            </div>
          </div>

          <div className="pt-5 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.06] mt-4">
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">
                Proteínas
              </span>
              <span className="text-[10px] uppercase font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">
                Verduras
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>{pantryCount} en despensa</span>
              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:translate-x-1 transition-transform border border-black/[0.04] dark:border-white/[0.06]">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick context info banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm shrink-0">
            {lastMeal ? lastMeal.emoji : '🍽️'}
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {lastMeal ? `Última comida: ${lastMeal.name}` : 'Aún no registras comidas en tu historial'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {exclusionsCount > 0 ? `${exclusionsCount} ingredientes en lista negra` : 'Sin ingredientes excluidos'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick(750);
            onOpenExclusions();
          }}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 btn-press cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Ajustar exclusiones</span>
        </button>
      </div>
    </div>
  );
};
