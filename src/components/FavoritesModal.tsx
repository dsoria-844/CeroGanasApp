import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Star, 
  Plus, 
  Trash2, 
  Search, 
  Bike, 
  ChefHat,
  Check,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { UserFavoriteMeal } from '../types';
import { 
  createFavoriteFromInput, 
  getAllPreloadedMeals,
  createFavoriteFromCatalogItem,
  PreloadedMealCatalogItem,
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

const POPULAR_SUGGESTIONS = [
  { name: 'Milanesa con papas', emoji: '🥩' },
  { name: 'Pizza Napolitana', emoji: '🍕' },
  { name: 'Hamburguesa con cheddar', emoji: '🍔' },
  { name: 'Sushi variado', emoji: '🍣' },
  { name: 'Empanadas de carne', emoji: '🥟' },
  { name: 'Pasta con salsa', emoji: '🍝' },
  { name: 'Pollo al horno', emoji: '🍗' },
  { name: 'Tacos caseros', emoji: '🌮' },
];

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  isEmbedded = false,
  onClose,
  favorites,
  onAddFavorite,
  onDeleteFavorite,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'cooking' | 'delivery'>('all');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Undo Toast state
  const [lastDeletedFavorite, setLastDeletedFavorite] = useState<UserFavoriteMeal | null>(null);
  const [showUndoToast, setShowUndoToast] = useState<boolean>(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // All pre-loaded catalog meals
  const catalog = useMemo(() => getAllPreloadedMeals(), []);

  if (!isOpen) return null;

  const handleAddCustom = (nameToAdd?: string) => {
    const raw = (nameToAdd || inputText).trim();
    if (!raw) return;

    sound.playSuccess();
    triggerHaptic('success');
    const newFav = createFavoriteFromInput(raw);
    onAddFavorite(newFav);
    setRecentlyAddedId(newFav.id);
    setInputText('');

    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1800);
  };

  const handleAddCatalogItem = (item: PreloadedMealCatalogItem) => {
    sound.playSuccess();
    triggerHaptic('success');
    const newFav = createFavoriteFromCatalogItem(item);
    onAddFavorite(newFav);
    setRecentlyAddedId(newFav.id);

    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1800);
  };

  const handleDelete = (id: string) => {
    const itemToDelete = favorites.find(f => f.id === id);
    sound.playClick(450);
    triggerHaptic('light');
    onDeleteFavorite(id);

    if (itemToDelete) {
      setLastDeletedFavorite(itemToDelete);
      setShowUndoToast(true);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setShowUndoToast(false);
        setLastDeletedFavorite(null);
      }, 4000);
    }
  };

  const handleUndoDelete = () => {
    if (!lastDeletedFavorite) return;
    sound.playSuccess();
    triggerHaptic('success');
    onAddFavorite(lastDeletedFavorite);
    setShowUndoToast(false);
    setLastDeletedFavorite(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const isSearching = inputText.trim().length > 0;

  // Search through all preloaded catalog meals
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = inputText.toLowerCase().trim();
    return catalog.filter(item => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)) ||
        item.ingredients.some(i => i.toLowerCase().includes(q))
      );
    });
  }, [catalog, isSearching, inputText]);

  // Filter existing user favorites
  const filteredFavorites = useMemo(() => {
    return favorites.filter(fav => {
      if (activeFilter === 'cooking') return fav.source === 'cooking';
      if (activeFilter === 'delivery') return fav.source === 'delivery';
      return true;
    });
  }, [favorites, activeFilter]);

  const hasExactCatalogMatch = useMemo(() => {
    const q = inputText.toLowerCase().trim();
    return catalog.some(c => c.name.toLowerCase().trim() === q);
  }, [catalog, inputText]);

  const getFavoriteForCatalogItem = (item: PreloadedMealCatalogItem) => {
    const lower = item.name.toLowerCase().trim();
    return favorites.find(f => f.name.toLowerCase().trim() === lower);
  };

  const content = (
    <div className="space-y-4 select-none">
      {/* Search Bar across pre-loaded meals database */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            maxLength={50}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputText.trim()) {
                e.preventDefault();
                if (searchResults.length > 0) {
                  const firstMatch = searchResults[0];
                  const existingFav = getFavoriteForCatalogItem(firstMatch);
                  if (!existingFav) {
                    handleAddCatalogItem(firstMatch);
                  }
                } else {
                  handleAddCustom();
                }
              }
            }}
            placeholder="Buscar entre platos cargados (ej: Milanesa, Pizza, Wok, Salmón)..."
            className="w-full bg-zinc-100 dark:bg-zinc-800/80 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-sans"
          />
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Add custom button if no exact match */}
        {inputText.trim() && !hasExactCatalogMatch && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => handleAddCustom()}
            className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 btn-press cursor-pointer shrink-0 transition-all"
            title="Crear como plato personalizado"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Crear</span>
          </motion.button>
        )}
      </div>

      {/* SEARCH MODE: Display results from pre-loaded database */}
      {isSearching ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>Resultados en catálogo ({searchResults.length})</span>
            </span>
            <button
              onClick={() => setInputText('')}
              className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline cursor-pointer"
            >
              Ver mis favoritos
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] text-center space-y-3">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                No encontramos "{inputText}" en los platos cargados
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                ¿Quieres guardarlo como plato personalizado con este nombre?
              </p>
              <button
                onClick={() => handleAddCustom()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 btn-press cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Crear plato personalizado</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
              {searchResults.map(item => {
                const existingFav = getFavoriteForCatalogItem(item);
                const isFavorited = !!existingFav;
                const isRecent = existingFav && existingFav.id === recentlyAddedId;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isRecent
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                        : isFavorited
                        ? 'bg-amber-500/5 border-amber-500/25 dark:bg-amber-500/10 dark:border-amber-500/30'
                        : 'bg-white dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-2xl shrink-0">
                        {item.imageEmoji}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className={`inline-flex items-center gap-1 font-medium ${
                            item.source === 'cooking' 
                              ? 'text-emerald-700 dark:text-emerald-400' 
                              : 'text-amber-700 dark:text-amber-400'
                          }`}>
                            {item.source === 'cooking' ? <ChefHat className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                            <span>{item.source === 'cooking' ? 'Cocinar' : 'Delivery'}</span>
                          </span>
                          {item.deliveryTime && (
                            <>
                              <span>•</span>
                              <span>{item.deliveryTime}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isFavorited ? (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(existingFav!.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-rose-500/15 hover:text-rose-600 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
                        title="Quitar de favoritos"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                        <span>Guardado</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddCatalogItem(item)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-amber-500 hover:text-zinc-950 dark:hover:bg-amber-400 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs transition-colors"
                        title="Agregar a favoritos"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Sumar</span>
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* NORMAL MODE: User's saved Favorites */
        <div className="space-y-4">
          {/* Filter Tabs with Sliding Spring Pill */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 relative">
              {[
                { id: 'all', label: `Todos (${favorites.length})` },
                { id: 'cooking', label: 'Caseros', icon: ChefHat },
                { id: 'delivery', label: 'Delivery', icon: Bike },
              ].map(tab => {
                const isSelected = activeFilter === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick(750);
                      setActiveFilter(tab.id as 'all' | 'cooking' | 'delivery');
                    }}
                    className={`relative px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                      isSelected
                        ? 'text-white dark:text-zinc-900 font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="favorites-filter-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                        className={`absolute inset-0 rounded-full shadow-xs -z-0 ${
                          tab.id === 'cooking' 
                            ? 'bg-emerald-600 dark:bg-emerald-500' 
                            : tab.id === 'delivery'
                            ? 'bg-amber-500'
                            : 'bg-zinc-900 dark:bg-white'
                        }`}
                      />
                    )}
                    {Icon && <Icon className="w-3 h-3 relative z-10" />}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {favorites.length > 0 && (
              <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
                {filteredFavorites.length} {filteredFavorites.length === 1 ? 'plato' : 'platos'}
              </span>
            )}
          </div>

          {/* Favorites List Grid */}
          {filteredFavorites.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl">
                <Star className="w-6 h-6 fill-amber-400/30 text-amber-500" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Sin platos favoritos aún
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  Busca entre todos los platos cargados arriba o añade alguna de las sugerencias populares.
                </p>
              </div>

              {/* Quick Suggestions Chips in Empty State */}
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-2">
                  Sugerencias populares (1 toque para agregar):
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                  {POPULAR_SUGGESTIONS.map((item, idx) => {
                    const isAdded = favorites.some(f => f.name.toLowerCase() === item.name.toLowerCase());
                    if (isAdded) return null;
                    return (
                      <motion.button
                        key={idx}
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddCustom(item.name)}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <span>{item.emoji}</span>
                        <span className="font-medium">{item.name}</span>
                        <Plus className="w-3 h-3 text-zinc-400" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <AnimatePresence mode="popLayout">
                {filteredFavorites.map(fav => {
                  const isRecent = fav.id === recentlyAddedId;
                  return (
                    <motion.div
                      key={fav.id}
                      layout
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.88, y: -8 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      whileHover={{ y: -1.5 }}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isRecent
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-white dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.15] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-2xl shrink-0 select-none">
                          {fav.imageEmoji}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {fav.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className={`inline-flex items-center gap-1 font-medium ${
                              fav.source === 'cooking' 
                                ? 'text-emerald-700 dark:text-emerald-400' 
                                : 'text-amber-700 dark:text-amber-400'
                            }`}>
                              {fav.source === 'cooking' ? <ChefHat className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                              <span>{fav.source === 'cooking' ? 'Cocinar' : 'Delivery'}</span>
                            </span>
                            {fav.deliveryTime && (
                              <>
                                <span>•</span>
                                <span>{fav.deliveryTime}</span>
                              </>
                            )}
                            {fav.vibe && (
                              <>
                                <span>•</span>
                                <span className="truncate">{fav.vibe}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleDelete(fav.id)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                        title="Eliminar de favoritos"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Compact Suggestions Row when list is short */}
          {favorites.length > 0 && favorites.length < 5 && (
            <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Sugerencias para sumar:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {POPULAR_SUGGESTIONS.map((item, idx) => {
                  const isAdded = favorites.some(f => f.name.toLowerCase() === item.name.toLowerCase());
                  if (isAdded) return null;
                  return (
                    <motion.button
                      key={idx}
                      layout
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddCustom(item.name)}
                      className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                    >
                      <span>{item.emoji}</span>
                      <span className="font-medium">{item.name}</span>
                      <Plus className="w-3 h-3 text-zinc-400" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING UNDO TOAST */}
      <AnimatePresence>
        {showUndoToast && lastDeletedFavorite && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-50 p-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xl flex items-center justify-between gap-3 border border-white/10 dark:border-black/10"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{lastDeletedFavorite.imageEmoji}</span>
              <span className="text-xs truncate font-medium">
                Eliminaste «{lastDeletedFavorite.name}»
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

  if (isEmbedded) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-5 pb-24">
        {/* View Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
              <span>Mis Platos Favoritos</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              Tus comidas preferidas para priorizar en opciones y sorteos
            </p>
          </div>
        </div>

        <div className="apple-card p-5 sm:p-7 space-y-4">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-5 sm:p-7 overflow-hidden max-h-[90vh] flex flex-col space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Mis Platos Favoritos
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Tus comidas predilectas para los sorteos
              </p>
            </div>
          </div>

          <button
            id="btn-close-favorites"
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors btn-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-0.5">
          {content}
        </div>
      </motion.div>
    </div>
  );
};
