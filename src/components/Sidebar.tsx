import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  ShoppingBag, 
  Calendar, 
  Star, 
  Settings, 
  History, 
  Zap, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  Plus,
  Utensils
} from 'lucide-react';
import { AppTab, MealHistoryItem } from '../types';
import { Theme } from '../utils/theme';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  onOpenHistory: () => void;
  onOpenBlindMode: () => void;
  history: MealHistoryItem[];
  exclusionsCount: number;
  favoritesCount: number;
  theme: Theme;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  onOpenBlindMode,
  history,
  exclusionsCount,
  favoritesCount,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
}) => {
  const handleNav = (tab: AppTab) => {
    sound.playClick(850);
    triggerHaptic('light');
    onChangeTab(tab);
    onClose();
  };

  const navItems: { id: AppTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'decide',
      label: 'Inicio',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'create_meal',
      label: 'Modificar platos',
      icon: <Utensils className="w-4 h-4" />,
    },
    {
      id: 'pantry',
      label: 'Despensa Inteligente',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      id: 'weekly',
      label: 'Plan Semanal',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'favorites',
      label: 'Mis Favoritos',
      icon: <Star className="w-4 h-4" />,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'history',
      label: 'Historial de Comidas',
      icon: <History className="w-4 h-4" />,
      badge: history.length > 0 ? history.length : undefined,
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: <Settings className="w-4 h-4" />,
      badge: exclusionsCount > 0 ? exclusionsCount : undefined,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm cursor-pointer"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative z-10 w-4/5 max-w-xs h-full bg-white dark:bg-zinc-900 border-r border-black/[0.08] dark:border-white/[0.08] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            {/* Top Brand Header */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <img 
                    src="/app-logo.jpg" 
                    alt="Cero Ganas" 
                    className="w-10 h-10 rounded-xl object-cover shadow-xs border border-black/[0.08] dark:border-white/[0.08]" 
                  />
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                      Cero Ganas
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      de pensar! pero si de comer!
                    </p>
                  </div>
                </div>

                <button
                  id="btn-close-sidebar"
                  onClick={() => {
                    sound.playClick(600);
                    onClose();
                  }}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Navigation Links */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 px-3 pb-1">
                  Navegación
                </p>

                {navItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all btn-press cursor-pointer ${
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions Section */}
              <div className="space-y-1 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 px-3 pb-1">
                  Acción Inmediata
                </p>

                {/* Tengo Hambre Button */}
                <button
                  onClick={() => {
                    sound.playClick(1000);
                    onOpenBlindMode();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-current" />
                    <span>¡Tengo Hambre!</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Bottom Controls (Theme & Sound) */}
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 pl-1">
                  {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-400" />}
                  <span>Modo {theme === 'light' ? 'Claro' : 'Oscuro'}</span>
                </div>

                <button
                  onClick={() => {
                    sound.playClick(600);
                    onToggleTheme();
                  }}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs btn-press cursor-pointer"
                >
                  Cambiar
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 pl-1">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                  <span>Efectos Sonoros</span>
                </div>

                <button
                  onClick={() => {
                    sound.playClick(soundEnabled ? 400 : 900);
                    onToggleSound();
                  }}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium text-zinc-800 dark:text-zinc-200 shadow-xs btn-press cursor-pointer"
                >
                  {soundEnabled ? 'Activado' : 'Silencio'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
