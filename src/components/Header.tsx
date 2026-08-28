import React from 'react';
import { Menu, Zap, Sun, Moon, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { AppTab } from '../types';
import { Theme } from '../utils/theme';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentMode: AppTab;
  onNavigateHome: () => void;
  onOpenSidebar: () => void;
  onOpenBlindMode: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  onOpenSidebar,
  onOpenBlindMode,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel px-4 sm:px-8 py-3 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Sidebar Menu Trigger & Logo */}
        <div className="flex items-center gap-2">
          <button
            id="btn-header-sidebar"
            onClick={() => {
              sound.playClick(800);
              onOpenSidebar();
            }}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer transition-colors"
            title="Abrir menú lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand */}
          <button
            id="btn-header-home"
            onClick={() => {
              sound.playClick(900);
              onNavigateHome();
            }}
            className="text-left group flex items-center gap-2.5 btn-press cursor-pointer"
          >
            <img 
              src="/app-logo.jpg" 
              alt="Cero Ganas" 
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover" 
            />
            <h1 
              className="text-xl sm:text-2xl font-extrabold tracking-wide flex items-center gap-1.5 select-none"
              style={{ fontFamily: "'Bubblegum Sans', 'Fredoka', cursive, sans-serif" }}
            >
              <span 
                style={{ 
                  color: '#FDF5E7',
                  textShadow: '0 2px 4px rgba(0,0,0,0.75), 0 1px 2px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,0.9)'
                }}
              >
                Cero
              </span>
              <span 
                style={{ 
                  color: '#FDC305',
                  textShadow: '0 2px 4px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.45)'
                }}
              >
                Ganas
              </span>
            </h1>
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Theme Toggle */}
          <button
            id="btn-header-theme"
            onClick={() => {
              sound.playClick(600);
              onToggleTheme();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] btn-press cursor-pointer transition-colors shadow-xs"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
