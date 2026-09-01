import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Trash2, 
  Clock, 
  ChefHat, 
  Bike, 
  Calendar, 
  Search, 
  Check, 
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { MealHistoryItem } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';

interface HistoryViewProps {
  history: MealHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onRestoreHistoryItem?: (item: MealHistoryItem) => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';
type ModalityFilter = 'all' | 'cooking' | 'delivery';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 26,
    },
  },
};

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onDeleteHistoryItem,
  onClearHistory,
  onRestoreHistoryItem,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  // Undo Toast state
  const [lastDeletedItem, setLastDeletedItem] = useState<MealHistoryItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState<boolean>(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Time calculations
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
  const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

  // Filter items
  const filteredHistory = history.filter(item => {
    // 1. Search Query
    if (searchQuery.trim() && !item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
      return false;
    }

    // 2. Modality
    if (modalityFilter !== 'all' && item.type !== modalityFilter) {
      return false;
    }

    // 3. Time range
    const diff = now - item.timestamp;
    if (timeFilter === 'today' && diff > ONE_DAY_MS) return false;
    if (timeFilter === 'week' && diff > SEVEN_DAYS_MS) return false;
    if (timeFilter === 'month' && diff > THIRTY_DAYS_MS) return false;

    return true;
  });

  // Calculate stats
  const totalCount = history.length;
  const cookingCount = history.filter(h => h.type === 'cooking').length;
  const deliveryCount = history.filter(h => h.type === 'delivery').length;
  const cookingPercent = totalCount > 0 ? Math.round((cookingCount / totalCount) * 100) : 0;
  const deliveryPercent = totalCount > 0 ? Math.round((deliveryCount / totalCount) * 100) : 0;

  const handleClearAll = () => {
    sound.playClick(450);
    triggerHaptic('medium');
    onClearHistory();
    setShowClearSuccess(true);
    setTimeout(() => setShowClearSuccess(false), 2000);
  };

  const handleDeleteItem = (item: MealHistoryItem) => {
    sound.playClick(400);
    triggerHaptic('light');
    onDeleteHistoryItem(item.id);

    setLastDeletedItem(item);
    setShowUndoToast(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setShowUndoToast(false);
      setLastDeletedItem(null);
    }, 4000);
  };

  const handleUndoDelete = () => {
    if (!lastDeletedItem || !onRestoreHistoryItem) return;
    sound.playSuccess();
    triggerHaptic('success');
    onRestoreHistoryItem(lastDeletedItem);
    setShowUndoToast(false);
    setLastDeletedItem(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24 select-none">
      {/* View Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Historial de Comidas</span>
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
            Todo lo que comiste, en un solo lugar
          </p>
        </div>

        {history.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleClearAll}
            className="px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            {showClearSuccess ? <Check className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{showClearSuccess ? 'Borrado' : 'Borrar todo'}</span>
          </motion.button>
        )}
      </div>

      {/* Summary Statistics Card with Animated Balance Bar */}
      {totalCount > 0 && (
        <div className="apple-card p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                Total Registros
              </span>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {totalCount} comidas
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/15 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                <ChefHat className="w-3.5 h-3.5" />
                Cocinado en Casa
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {cookingCount}
                </p>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ({cookingPercent}%)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/15 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1">
                <Bike className="w-3.5 h-3.5" />
                Delivery
              </span>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {deliveryCount}
                </p>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  ({deliveryPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Animated Ratio Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                Casero {cookingPercent}%
              </span>
              <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Bike className="w-3 h-3" />
                Delivery {deliveryPercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex shadow-2xs">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cookingPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="h-full bg-emerald-500 rounded-l-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${deliveryPercent}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="h-full bg-amber-500 rounded-r-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Controls with Dual Sliding Spring Pills */}
      <div className="apple-card p-4 sm:p-5 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de plato..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            maxLength={50}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
          {/* Time range */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 hidden sm:inline">
              Período:
            </span>
            <div className="flex items-center gap-1 relative">
              {[
                { id: 'all', label: 'Todo' },
                { id: 'today', label: 'Hoy' },
                { id: 'week', label: '7 días' },
                { id: 'month', label: '30 días' },
              ].map(t => {
                const isSelected = timeFilter === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      sound.playClick(750);
                      setTimeFilter(t.id as TimeFilter);
                    }}
                    className={`relative px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'text-white dark:text-zinc-900 font-bold'
                        : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="history-time-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                        className="absolute inset-0 rounded-full bg-zinc-900 dark:bg-white shadow-xs -z-0"
                      />
                    )}
                    <span className="relative z-10">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modality Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 hidden sm:inline">
              Tipo:
            </span>
            <div className="flex items-center gap-1 relative">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'cooking', label: 'Cocina', icon: ChefHat },
                { id: 'delivery', label: 'Delivery', icon: Bike },
              ].map(m => {
                const isSelected = modalityFilter === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      sound.playClick(750);
                      setModalityFilter(m.id as ModalityFilter);
                    }}
                    className={`relative px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                      isSelected
                        ? 'text-white dark:text-zinc-900 font-bold'
                        : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="history-modality-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                        className={`absolute inset-0 rounded-full shadow-xs -z-0 ${
                          m.id === 'cooking'
                            ? 'bg-emerald-600 dark:bg-emerald-500'
                            : m.id === 'delivery'
                            ? 'bg-amber-500'
                            : 'bg-zinc-900 dark:bg-white'
                        }`}
                      />
                    )}
                    {Icon && <Icon className="w-3 h-3 relative z-10" />}
                    <span className="relative z-10">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Traceability Timeline List with FLIP & Staggered Animations */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="apple-card p-10 text-center space-y-2 text-zinc-400">
            <History className="w-8 h-8 mx-auto stroke-1" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No hay registros en el historial
            </p>
            <p className="text-xs">
              {history.length > 0
                ? 'Ninguna comida coincide con los filtros seleccionados.'
                : 'Elegí comidas en la pantalla principal para empezar a registrar.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2.5"
          >
            <AnimatePresence mode="popLayout">
              {filteredHistory.map(item => {
                const dateObj = new Date(item.timestamp);
                const fullDate = dateObj.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const fullTime = dateObj.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <motion.div
                    key={item.id}
                    layout
                    variants={cardVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, scale: 0.9, y: -8 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    whileHover={{ y: -1.5 }}
                    className="apple-card p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:shadow-md transition-shadow"
                  >
                    {/* Visual Icon & Meal details */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-2xl shadow-xs shrink-0 select-none">
                        {item.emoji || (item.type === 'cooking' ? '🍳' : '🛵')}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50">
                            {item.name}
                          </h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.type === 'cooking'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                          }`}>
                            {item.type === 'cooking' ? '🍳 Cocinado' : '🛵 Delivery'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="capitalize">{fullDate}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{fullTime} hs</span>
                          </span>
                          {item.details && (
                            <span className="hidden sm:inline text-zinc-400 truncate max-w-xs">
                              • {item.details}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleDeleteItem(item)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
                      title="Eliminar este registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* FLOATING UNDO TOAST */}
      <AnimatePresence>
        {showUndoToast && lastDeletedItem && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-50 p-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl flex items-center justify-between gap-3 border border-white/10 dark:border-black/10"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{lastDeletedItem.emoji || '🍽️'}</span>
              <span className="text-xs truncate font-medium">
                Eliminaste «{lastDeletedItem.name}»
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleUndoDelete}
              className="px-3 py-1 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs"
            >
              Deshacer
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
