import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Plus, 
  Trash2, 
  Sparkles, 
  Search, 
  Bike, 
  ChefHat, 
  Utensils, 
  Info,
  Check
} from 'lucide-react';
import { UserFavoriteMeal } from '../types';
import { 
  createFavoriteFromInput, 
  inferMealAttributes, 
  triggerHaptic 
} from '../utils/storage';

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

  // Real-time preview of inference for user feedback
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

  if (isEmbedded) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Scrollable Body */}
        <div className="space-y-6">
          
          {/* Quick Creation Box (Single Input Field) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="input-new-favorite" className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Agregar Nuevo Plato Favorito</span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Detección Inteligente</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="input-new-favorite"
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Empanadas de carne cortada a cuchillo, Sushi, Wok..."
                className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 font-sans"
              />
              <button
                id="btn-add-favorite-submit"
                onClick={() => handleQuickAdd()}
                disabled={!inputValue.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Live Auto-Inference Preview */}
            {liveInference && (
              <div className="pt-2 border-t border-zinc-850 flex items-center gap-2 text-xs flex-wrap animate-in fade-in duration-150">
                <span className="text-[11px] text-zinc-400 font-mono">Inferencia:</span>
                <span className="text-base">{liveInference.emoji}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-amber-300">
                  {getCategoryBadgeLabel(liveInference.category)}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300">
                  {liveInference.priceLevel}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">
                  ⏱️ {liveInference.deliveryTime}
                </span>
              </div>
            )}
          </div>

          {/* Search bar & count */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar en mis favoritos..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 font-mono"
              />
            </div>
            <span className="text-xs text-zinc-400 font-mono shrink-0">
              {filteredFavorites.length} platos
            </span>
          </div>

          {/* Favorites List */}
          <div className="space-y-2.5">
            {filteredFavorites.length > 0 ? (
              filteredFavorites.map(fav => (
                <div
                  key={fav.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950 border transition-all ${
                    recentlyAddedId === fav.id
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                      {fav.imageEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-medium text-zinc-100 truncate">
                          {fav.name}
                        </h4>
                        {recentlyAddedId === fav.id && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 shrink-0">
                            <Check className="w-3 h-3" /> ¡Nuevo!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <span className="text-amber-400/90">{getCategoryBadgeLabel(fav.category)}</span>
                        <span>•</span>
                        <span>{fav.priceLevel}</span>
                        <span>•</span>
                        <span>{fav.deliveryTime}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onDeleteFavorite(fav.id);
                    }}
                    className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors ml-2 cursor-pointer"
                    title="Eliminar de favoritos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-zinc-950/50 border border-zinc-850 space-y-3">
                <div className="text-3xl">⭐</div>
                <p className="text-xs text-zinc-400">
                  {searchQuery ? 'No hay favoritos que coincidan con la búsqueda.' : 'No tienes platos favoritos guardados aún.'}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-light text-zinc-50 tracking-tight">
                  Mis Platos Favoritos
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                  {favorites.length}
                </span>
              </div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5 font-mono">
                Tus comidas predilectas para la ruleta
              </p>
            </div>
          </div>

          <button
            id="btn-close-favorites"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1 scrollbar-none">
          
          {/* Quick Creation Box (Single Input Field) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="input-new-favorite" className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Creación Rápida de Plato</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                Auto-asigna emoji, tags e ingredientes
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="input-new-favorite"
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: Milanesa con puré, Sushi de salmón, Tacos..."
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                />
                {liveInference && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg select-none">
                    {liveInference.emoji}
                  </span>
                )}
              </div>

              <button
                id="btn-add-favorite-submit"
                onClick={() => handleQuickAdd()}
                disabled={!inputValue.trim()}
                className={`px-4 sm:px-5 py-3 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  inputValue.trim()
                    ? 'bg-zinc-100 text-zinc-950 hover:bg-white active:scale-95 shadow-md font-semibold'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>

            {/* Smart Live Preview of Inferred Tags & Ingredients */}
            {liveInference && (
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-zinc-300">
                    <span>{liveInference.emoji}</span>
                    <strong className="text-zinc-100">{inputValue.trim()}</strong>
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {getCategoryBadgeLabel(liveInference.category)}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 font-mono self-center mr-1">Tags detectados:</span>
                  {liveInference.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-mono">
                      #{tag}
                    </span>
                  ))}
                  {liveInference.ingredients.slice(0, 3).map((ing, idx) => (
                    <span key={`ing-${idx}`} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/50 text-zinc-400 border border-zinc-800 font-mono">
                      ingrediente: {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Inspiration Chips */}
            <div className="pt-2">
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-2">
                O añade sugerencias populares con 1 toque:
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
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-zinc-900/40 text-zinc-600 border-zinc-850 cursor-default'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {isAlreadyAdded ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
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

          {/* Search Filter for Favorites */}
          {favorites.length > 3 && (
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar entre tus platos favoritos..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* Favorites List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-500">
                Tus Platos ({filteredFavorites.length})
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Disponibles para la ruleta
              </span>
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center space-y-2">
                <p className="text-3xl">⭐</p>
                <p className="text-xs font-medium text-zinc-200">
                  {searchQuery ? 'No hay platos que coincidan con la búsqueda' : 'Aún no tienes platos favoritos guardados'}
                </p>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  Agrega tus comidas preferidas arriba o guárdalas directamente desde los resultados de la ruleta y las recetas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFavorites.map(fav => {
                  const isRecent = fav.id === recentlyAddedId;
                  return (
                    <div
                      key={fav.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group relative ${
                        isRecent 
                          ? 'bg-zinc-900 border-amber-500/50 shadow-lg ring-1 ring-amber-500/30' 
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        {/* Top info */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shrink-0">
                              {fav.imageEmoji}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-zinc-100 truncate">
                                {fav.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                  {getCategoryBadgeLabel(fav.category)}
                                </span>
                                {fav.source === 'cooking' && (
                                  <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-0.5">
                                    <ChefHat className="w-2.5 h-2.5" /> Casero
                                  </span>
                                )}
                                {fav.source === 'delivery' && (
                                  <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-0.5">
                                    <Bike className="w-2.5 h-2.5" /> Delivery
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete Favorite Button */}
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              onDeleteFavorite(fav.id);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                            title="Eliminar de favoritos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tags */}
                        {fav.tags && fav.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {fav.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800/80">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bottom details if any */}
                      {fav.ingredients && fav.ingredients.length > 0 && (
                        <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono truncate">
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

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 shrink-0 flex items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Almacenado localmente en tu dispositivo</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-medium text-xs transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
