import React from 'react';
import { History, ShieldAlert, Star, Zap, SlidersHorizontal } from 'lucide-react';
import { MealHistoryItem } from '../types';

interface HeaderProps {
  currentMode: string;
  onNavigateHome: () => void;
  onOpenHistory: () => void;
  onOpenExclusions: () => void;
  onOpenFavorites: () => void;
  onOpenBlindMode: () => void;
  history: MealHistoryItem[];
  exclusionsCount: number;
  favoritesCount: number;
  remainingRerolls: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onNavigateHome,
  onOpenHistory,
  onOpenExclusions,
  onOpenFavorites,
  onOpenBlindMode,
  history,
  exclusionsCount,
  favoritesCount,
  remainingRerolls,
}) => {
  // Count items from the last 4 days
  const recentHistoryCount = history.filter(
    item => Date.now() - item.timestamp <= 4 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur-md px-4 sm:px-8 py-3.5 sm:py-4 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <button
          id="btn-header-home"
          onClick={onNavigateHome}
          className="text-left group transition-all tap-highlight-transparent flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg group-hover:border-zinc-600 transition-colors">
            🍽️
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors flex items-center gap-1.5">
              <span>QUÉ</span>
              <span className="text-amber-400 font-light">COMO</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest hidden xs:block">
              Asistente de Decisión
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* PROMINENT BLIND MODE BUTTON */}
          <button
            id="btn-header-blind-mode"
            onClick={onOpenBlindMode}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 sm:px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/10 transition-transform active:scale-95 cursor-pointer"
            title="Decisión Inmediata Forzada (Modo A Ciegas)"
          >
            <Zap className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
            <span className="font-mono tracking-tight">⚡ A Ciegas</span>
          </button>

          {/* Ajustes / Lista Negra Button */}
          <button
            id="btn-header-exclusions"
            onClick={onOpenExclusions}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition-all cursor-pointer ${
              exclusionsCount > 0
                ? 'bg-zinc-900 text-zinc-100 border-zinc-700 hover:border-zinc-500 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Ajustes / Lista Negra de ingredientes bloqueados"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Lista Negra</span>
            {exclusionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-mono border border-zinc-700">
                {exclusionsCount}
              </span>
            )}
          </button>

          {/* History Button */}
          <button
            id="btn-header-history"
            onClick={onOpenHistory}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border transition-all cursor-pointer ${
              recentHistoryCount > 0
                ? 'bg-zinc-900 text-zinc-100 border-zinc-700 hover:border-zinc-500 shadow-sm'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Historial de comidas de los últimos 4 días"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Historial</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-zinc-700">
              {recentHistoryCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

