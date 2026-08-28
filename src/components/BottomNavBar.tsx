import React from 'react';
import { Compass, Calendar, ShoppingBag, Star, Flame, Sparkles } from 'lucide-react';
import { AppTab } from '../types';
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
      label: 'Decidir Hoy',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: 'weekly',
      label: 'Plan Semanal',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      id: 'pantry',
      label: 'Despensa',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: <Star className="w-5 h-5" />,
      badge: favoritesCount,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2 sm:py-3">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                onChangeTab(tab.id);
                triggerHaptic('light');
              }}
              className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-amber-500 text-zinc-950 text-[9px] font-mono font-bold rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
