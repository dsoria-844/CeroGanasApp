import React from 'react';
import { Menu, HelpCircle } from 'lucide-react';
import { AppTab } from '../types';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentMode: AppTab;
  onNavigateHome: () => void;
  onOpenSidebar: () => void;
  onOpenBlindMode: () => void;
  onOpenHelp: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  onOpenSidebar,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel px-4 sm:px-8 py-2.5 transition-colors duration-200">
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
              <span className="text-zinc-900 dark:text-zinc-50">
                Cero
              </span>
              <span 
                style={{ 
                  color: '#f59e0b'
                }}
              >
                Ganas
              </span>
            </h1>
          </button>
        </div>

        {/* Right Action Controls: Help Guide Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="btn-header-help"
            onClick={() => {
              sound.playClick(850);
              onOpenHelp();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] btn-press cursor-pointer transition-colors shadow-2xs"
            title="Ayuda / Guía rápida"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
