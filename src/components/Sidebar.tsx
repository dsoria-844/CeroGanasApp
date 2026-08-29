import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Home,
  Sparkles, 
  ShoppingBag, 
  Calendar, 
  Heart,
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
  Utensils,
  HelpCircle,
  Code2,
  ExternalLink
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
  onOpenHelp: () => void;
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
  onOpenHelp,
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
      icon: <Home className="w-4 h-4" />,
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
      icon: <Heart className="w-4 h-4" />,
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
            {/* Top Brand Mascot Header */}
            <div className="space-y-5">
              <div className="relative p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-2.5">
                <div className="space-y-0.5 min-w-0">
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                    ¿Cero ganas hoy?
                  </h2>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    ¡Tu chef perezoso decide por ti!
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <img
                    src="./sidebar-sloth.jpg"
                    alt="Chef Cero Ganas"
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <button
                    id="btn-close-sidebar"
                    onClick={() => {
                      sound.playClick(600);
                      onClose();
                    }}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 btn-press cursor-pointer transition-colors"
                    title="Cerrar menú"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all btn-press cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20'
                          : 'text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isActive
                            ? 'bg-zinc-950/15 text-zinc-950'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions & Help Section */}
              <div className="space-y-1 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 px-3 pb-1">
                  Acciones & Guía
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

                {/* Ayuda / Onboarding Button */}
                <button
                  id="btn-sidebar-help"
                  onClick={() => {
                    sound.playClick(850);
                    onOpenHelp();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-emerald-500" />
                    <span>Ayuda (Cómo funciona)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Bottom Controls & About Section */}
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2.5">
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

              {/* Acerca de Section */}
              <div className="space-y-1 pt-1.5 border-t border-black/[0.06] dark:border-white/[0.06]">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 px-1 pb-0.5">
                  Acerca de
                </p>

                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-50">Cero Ganas</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                      v1.0.1
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <span>Desarrollador</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Diego Soria</span>
                  </div>

                  <a
                    href="https://github.com/dsoria-844"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      sound.playClick(800);
                      triggerHaptic('light');
                    }}
                    className="flex items-center justify-between w-full pt-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                      <span>GitHub</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400 group-hover:text-amber-500 transition-colors">
                      <span className="text-[10px]">@dsoria-844</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
