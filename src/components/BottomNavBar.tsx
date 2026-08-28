import React from 'react';
import { Calendar, ShoppingBag, Star, Sparkles, Bike } from 'lucide-react';
import { motion } from 'motion/react';
import { AppTab } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';

interface BottomNavBarProps {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  favoritesCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onChangeTab,
  favoritesCount = 0,
}) => {
  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'decide',
      label: 'Decidir',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'pantry',
      label: 'Despensa',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      id: 'weekly',
      label: 'Semanal',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: <Star className="w-4 h-4" />,
      badge: favoritesCount,
    },
  ];

  return (
    <nav 
      aria-label="Navegación principal"
      className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md pointer-events-auto"
    >
      <div className="flex items-center justify-between p-1.5 rounded-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl shadow-black/[0.08] dark:shadow-black/60">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                sound.playClick(isActive ? 700 : 850);
                triggerHaptic('light');
                onChangeTab(tab.id);
              }}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full text-xs font-medium transition-colors duration-150 btn-press cursor-pointer z-10 ${
                isActive
                  ? 'text-zinc-900 dark:text-zinc-50 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.08] shadow-xs -z-10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}

              <div className="relative flex items-center justify-center">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-mono font-bold rounded-full leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="tracking-tight text-[11px] sm:text-xs">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
