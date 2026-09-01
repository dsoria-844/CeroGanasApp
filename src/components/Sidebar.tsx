import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Home,
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
  Utensils,
  HelpCircle,
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

const navListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.04,
    },
  },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
    }
  },
};

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
      label: 'Mis platos y recetas',
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
        <div className="fixed inset-0 z-50 flex select-none">
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
            className="relative z-10 w-4/5 max-w-xs h-full bg-white dark:bg-zinc-900 border-r border-black/[0.08] dark:border-white/[0.08] p-4 sm:p-5 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Top Brand Mascot Header & Nav */}
            <div className="space-y-3">
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                className="relative p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-2 border border-black/[0.04] dark:border-white/[0.06]"
              >
                <div className="space-y-0.5 min-w-0">
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                    ¿Cero ganas hoy?
                  </h2>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    ¡Tu chef perezoso decide por vos!
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <img
                    src="./sidebar-sloth.jpg"
                    alt="Chef Cero Ganas"
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    id="btn-close-sidebar"
                    onClick={() => {
                      sound.playClick(600);
                      onClose();
                    }}
                    className="p-1 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    title="Cerrar menú"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Main Navigation Links with Staggered Cascades & Sliding Spring Pill */}
              <motion.div 
                variants={navListVariants}
                initial="hidden"
                animate="show"
                className="space-y-0.5 relative"
              >
                <p className="text-[9px] uppercase font-semibold tracking-wider text-zinc-400 px-2.5 pb-0.5">
                  Navegación
                </p>

                {navItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      variants={navItemVariants}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleNav(item.id)}
                      className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        isActive
                          ? 'text-zinc-950 font-extrabold'
                          : 'text-zinc-600 dark:text-zinc-400 font-semibold hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-pill"
                          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                          className="absolute inset-0 rounded-xl bg-amber-500 shadow-sm shadow-amber-500/20 -z-0"
                        />
                      )}
                      <div className="flex items-center gap-2 relative z-10">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className={`relative z-10 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                          isActive
                            ? 'bg-zinc-950/15 text-zinc-950'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Quick Actions & Help Section */}
              <div className="space-y-0.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <p className="text-[9px] uppercase font-semibold tracking-wider text-zinc-400 px-2.5 pb-0.5">
                  Acciones y guía
                </p>

                {/* Tengo Hambre Button */}
                <motion.button
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    sound.playClick(1000);
                    onOpenBlindMode();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span>¡Tengo Hambre!</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </motion.button>

                {/* Ayuda / Onboarding Button */}
                <motion.button
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.96 }}
                  id="btn-sidebar-help"
                  onClick={() => {
                    sound.playClick(850);
                    onOpenHelp();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ayuda (Cómo funciona)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                </motion.button>
              </div>
            </div>

            {/* Bottom Controls & About Section */}
            <div className="pt-2.5 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
              {/* Quick Settings Bar: Theme & Sound */}
              <div className="grid grid-cols-2 gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    sound.playClick(600);
                    onToggleTheme();
                  }}
                  className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-zinc-400" />}
                    <span className="text-[11px]">{theme === 'light' ? 'Claro' : 'Oscuro'}</span>
                  </div>
                  <span className="text-[9px] text-zinc-400">Tema</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    sound.playClick(soundEnabled ? 400 : 900);
                    onToggleSound();
                  }}
                  className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-1.5">
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-400" />}
                    <span className="text-[11px]">{soundEnabled ? 'Sonido' : 'Mudo'}</span>
                  </div>
                  <span className="text-[9px] text-zinc-400">Audio</span>
                </motion.button>
              </div>

              {/* Acerca de Section */}
              <div className="space-y-0.5">
                <p className="text-[9px] uppercase font-semibold tracking-wider text-zinc-400 px-1">
                  Acerca de
                </p>

                <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] flex items-center gap-3">
                  {/* Columna 1: Imagen de Cero Ganas */}
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-amber-500/10 border border-black/[0.06] dark:border-white/[0.08] shrink-0 shadow-2xs flex items-center justify-center">
                    <img
                      src="./about-mascot.jpg"
                      alt="Cero Ganas Chef"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Columna 2: Textos (Nombre, Versión, Desarrollador) */}
                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 tracking-tight">
                          Cero Ganas
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-mono font-bold border border-amber-500/30">
                          v1.0.1
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Decidí qué comer hoy
                      </p>
                    </div>

                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                      <span className="text-zinc-400 text-[9px] uppercase font-semibold tracking-wider block">
                        Desarrollado por
                      </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">
                        Diego Soria
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apoyá el proyecto (Donaciones) */}
              <motion.a
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                href="https://cafecito.app/diego_soria"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  sound.playClick(850);
                  triggerHaptic('medium');
                }}
                className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/30 flex items-center justify-between gap-2.5 text-zinc-900 dark:text-zinc-50 transition-all cursor-pointer group shadow-2xs"
                title="Invitame un cafecito en Cafecito.app"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm shrink-0 border border-amber-500/30 group-hover:rotate-12 transition-transform">
                    ☕
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[11px] font-bold text-amber-950 dark:text-amber-100 leading-tight">
                      Invitame un cafecito
                    </p>
                    <p className="text-[9px] text-amber-800/80 dark:text-amber-300/80 leading-tight truncate">
                      Ayudá a mantener y mejorar la app
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 group-hover:translate-x-0.5 transition-transform shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </motion.a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
