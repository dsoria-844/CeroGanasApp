import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Star, 
  Plus, 
  Trash2, 
  Sparkles, 
  Search, 
  Bike, 
  ChefHat, 
  Info,
  Check
} from 'lucide-react';
import { UserFavoriteMeal } from '../types';
import { 
  createFavoriteFromInput, 
  inferMealAttributes, 
  triggerHaptic 
} from '../utils/storage';
import { sound } from '../utils/audio';

interface FavoritesModalProps {
  isOpen: boolean;
  isEmbedded?: boolean;
  onClose: () => void;
  favorites: UserFavoriteMeal[];
  onAddFavorite: (meal: UserFavoriteMeal) => void;
  onDeleteFavorite: (id: string) => void;
}

const QUICK_INSPIRATION = [
  '🥩 Milanesa a caballo con papas',
  '🍕 Pizza Napolitana con albahaca',
  '🍣 Combo Sushi Rolls variados',
  '🍔 Hamburguesa Smash con cheddar',
  '🌮 Tacos de carne con guacamole',
  '🥗 Poke Bowl de salmón y palta',
  '🍝 Ravioles caseros con estofado',
  '🍗 Pollo al curry con arroz jazmín',
];

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  isEmbedded = false,
  onClose,
  favorites,
  onAddFavorite,
  onDeleteFavorite,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickAdd = (textToAdd?: string) => {
    const raw = (textToAdd || inputValue).trim();
    if (!raw) return;

    sound.playSuccess();
    triggerHaptic('success');
    const newFav = createFavoriteFromInput(raw);
    onAddFavorite(newFav);
    setRecentlyAddedId(newFav.id);
    setInputValue('');

    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const liveInference = inputValue.trim() ? inferMealAttributes(inputValue.trim()) : null;

  const filteredFavorites = favorites.filter(fav => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      fav.name.toLowerCase().includes(q) ||
      fav.tags.some(t => t.toLowerCase().includes(q)) ||
      fav.category.toLowerCase().includes(q)
    );
  });

  const getCategoryBadgeLabel = (cat: string) => {
    switch (cat) {
      case 'cheat_meal': return 'Cheat Meal';
      case 'healthy': return 'Saludable';
      case 'economic': return 'Económico';
      default: return 'Típico';
    }
  };

  const modalBody = (
    <div className="space-y-5">
      {/* Quick Creation Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="input-new-favorite" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Agregar Nuevo Plato Favorito</span>
          </label>
          <span className="text-[10px] text-zinc-400 font-medium">Detección Inteligente</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="input-new-favorite"
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Empanadas de carne, Sushi, Wok..."
            className="flex-1 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
          />
          <button
            id="btn-add-favorite-submit"
            onClick={() => handleQuickAdd()}
            disabled={!inputValue.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1 btn-press cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Live Auto-Inference Preview */}
        {liveInference && (
          <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2 text-xs flex-wrap">
            <span className="text-[11px] text-zinc-400 font-medium">Inferencia:</span>
            <span className="text-base">{liveInference.emoji}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
              {getCategoryBadgeLabel(liveInference.category)}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300">
              {liveInference.priceLevel}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/[0.04] dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400">
              ⏱️ {liveInference.deliveryTime}
            </span>
          </div>
        )}

        {/* Quick Inspiration Chips */}
        <div className="pt-1">
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider mb-1.5">
            O añade sugerencias populares:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_INSPIRATION.map((item, idx) => {
              const isAlreadyAdded = favorites.some(
                f => f.name.toLowerCase() === item.replace(/^[^\s]+\s/, '').toLowerCase()
              );
              return (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(item.replace(/^[^\s]+\s/, ''))}
                  disabled={isAlreadyAdded}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 btn-press cursor-pointer ${
                    isAlreadyAdded
                      ? 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-400 border-black/[0.04] dark:border-zinc-800 cursor-default'
                      : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-black/[0.08] dark:border-white/[0.08]'
                  }`}
                >
                  {isAlreadyAdded ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>{item}</span>
                    </>
                  ) : (
                    <>
                      <span>+</span>
                      <span>{item}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Filter */}
      {favorites.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar entre tus platos favoritos..."
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] rounded-xl pl-8 pr-4 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Favorites List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            Tus Platos ({filteredFavorites.length})
          </span>
          <span className="text-[11px] text-zinc-400">
            Disponibles para la ruleta
          </span>
        </div>

        {filteredFavorites.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] text-center space-y-2">
            <p className="text-3xl">⭐</p>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {searchQuery ? 'No hay platos que coincidan con la búsqueda' : 'Aún no tienes platos favoritos guardados'}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Agrega tus comidas preferidas arriba o guárdalas desde los resultados de la ruleta y las recetas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredFavorites.map(fav => {
              const isRecent = fav.id === recentlyAddedId;
              return (
                <div
                  key={fav.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 relative shadow-xs ${
                    isRecent 
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30' 
                      : 'bg-white dark:bg-zinc-950 border-black/[0.08] dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-lg shrink-0">
                          {fav.imageEmoji}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {fav.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 border border-black/[0.04] dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                              {getCategoryBadgeLabel(fav.category)}
                            </span>
                            {fav.source === 'cooking' && (
                              <span className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                                <ChefHat className="w-2.5 h-2.5" /> Casero
                              </span>
                            )}
                            {fav.source === 'delivery' && (
                              <span className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                                <Bike className="w-2.5 h-2.5" /> Delivery
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick(450);
                          triggerHaptic('light');
                          onDeleteFavorite(fav.id);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors btn-press cursor-pointer"
                        title="Eliminar de favoritos"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {fav.tags && fav.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fav.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[9px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-black/[0.04] dark:border-zinc-800">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {fav.ingredients && fav.ingredients.length > 0 && (
                    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-[10px] text-zinc-400 truncate">
                      Ingredientes: {fav.ingredients.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-lg p-6 sm:p-8 space-y-6">
        {modalBody}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shadow-xs">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Mis Platos Favoritos
                </h3>
                <span className="text-xs px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                  {favorites.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
                Tus comidas predilectas para la ruleta
              </p>
            </div>
          </div>

          <button
            id="btn-close-favorites"
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors btn-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 flex-1 pr-1 scrollbar-none">
          {modalBody}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Almacenado localmente en tu dispositivo</span>
          </div>

          <button
            onClick={() => {
              sound.playClick(700);
              onClose();
            }}
            className="px-5 py-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs btn-press cursor-pointer shadow-xs"
          >
            Listo
          </button>
        </div>
      </motion.div>
    </div>
  );
};
