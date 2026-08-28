import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Clock, 
  ChefHat, 
  Bike, 
  Calendar, 
  Search, 
  Check, 
  Sparkles,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { MealHistoryItem } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';

interface HistoryViewProps {
  history: MealHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';
type ModalityFilter = 'all' | 'cooking' | 'delivery';

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onDeleteHistoryItem,
  onClearHistory,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearSuccess, setShowClearSuccess] = useState(false);

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

  const handleDeleteItem = (id: string) => {
    sound.playClick(400);
    triggerHaptic('light');
    onDeleteHistoryItem(id);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24">
      {/* View Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Historial de Comidas</span>
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
            Trazabilidad y registro de lo que comiste
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-500/20 text-red-600 dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 btn-press cursor-pointer"
          >
            {showClearSuccess ? <Check className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{showClearSuccess ? 'Borrado' : 'Borrar todo'}</span>
          </button>
        )}
      </div>

      {/* Summary Statistics Card */}
      {totalCount > 0 && (
        <div className="apple-card p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
              Total Registros
            </span>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {totalCount} comidas
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
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

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/10 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
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
      )}

      {/* Filter & Search Controls */}
      <div className="apple-card p-4 sm:p-5 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de plato..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
          {/* Time range */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 hidden sm:inline">
              Período:
            </span>
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all btn-press cursor-pointer border ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-semibold shadow-xs'
                      : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Modality Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1 hidden sm:inline">
              Modalidad:
            </span>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'cooking', label: '🍳 Cocina' },
              { id: 'delivery', label: '🛵 Delivery' },
            ].map(m => {
              const isSelected = modalityFilter === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    sound.playClick(750);
                    setModalityFilter(m.id as ModalityFilter);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all btn-press cursor-pointer border ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-semibold shadow-xs'
                      : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Traceability Timeline List */}
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
                : 'Acepta comidas en el módulo de decisión para comenzar tu registro.'}
            </p>
          </div>
        ) : (
          filteredHistory.map(item => {
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
              <div
                key={item.id}
                className="apple-card p-4 sm:p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
              >
                {/* Visual Icon & Meal details */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-2xl shadow-xs shrink-0">
                    {item.emoji || (item.type === 'cooking' ? '🍳' : '🛵')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
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
                        <span className="hidden sm:inline text-zinc-400">
                          • {item.details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors btn-press cursor-pointer shrink-0"
                  title="Eliminar este registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
