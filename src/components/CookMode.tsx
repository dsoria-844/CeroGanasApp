import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChefHat, 
  Check, 
  Clock, 
  RotateCcw,
  ChevronRight,
  Utensils,
  Lightbulb,
  Search,
  X,
  Star,
  Plus,
  Dices
} from 'lucide-react';
import { PantryCategory, MatchResult, MealHistoryItem, UserFavoriteMeal, PantryItem } from '../types';
import { 
  matchRecipesWithPantry, 
  savePantryToStorage, 
  triggerHaptic, 
  triggerVictoryConfetti,
  getPantryItemEmoji,
  getPantryItemName,
  getAllPantryItems,
  addCustomPantryItem,
  deleteCustomPantryItem,
  isMealFavorited,
  createFavoriteFromRecipe
} from '../utils/storage';
import { sound } from '../utils/audio';

interface CookModeProps {
  onBack: () => void;
  onAcceptMeal: (mealName: string, type: 'cooking', emoji: string, details?: string) => void;
  pantry: string[];
  onUpdatePantry: (newPantry: string[]) => void;
  exclusions: string[];
  history: MealHistoryItem[];
  favorites: UserFavoriteMeal[];
  onAddFavorite: (meal: UserFavoriteMeal) => void;
  onDeleteFavorite: (id: string) => void;
}

const CATEGORY_TABS: { id: PantryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'proteins', label: 'Proteínas' },
  { id: 'carbs', label: 'Carbohidratos' },
  { id: 'veggies', label: 'Verduras' },
  { id: 'extras', label: 'Lácteos & Extras' },
];

export const CookMode: React.FC<CookModeProps> = ({
  onBack,
  onAcceptMeal,
  pantry,
  onUpdatePantry,
  exclusions,
  history,
  favorites,
  onAddFavorite,
  onDeleteFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<PantryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<'pantry' | 'results'>('pantry');
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number>(0);
  const [acceptedRecipeId, setAcceptedRecipeId] = useState<string | null>(null);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customCategory, setCustomCategory] = useState<PantryCategory>('veggies');
  const [allAvailableItems, setAllAvailableItems] = useState<PantryItem[]>([]);

  const [isSpinningRoulette, setIsSpinningRoulette] = useState(false);
  const rouletteIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setAllAvailableItems(getAllPantryItems());
  }, []);

  const matchResults = useMemo(() => {
    return matchRecipesWithPantry(pantry, exclusions, history);
  }, [pantry, exclusions, history]);

  const readyToCookMatches = useMemo(() => {
    return matchResults.filter(m => m.matchPercentage === 100);
  }, [matchResults]);

  const almostReadyMatches = useMemo(() => {
    return matchResults.filter(m => m.matchPercentage >= 70 && m.matchPercentage < 100);
  }, [matchResults]);

  const topMatch = matchResults.length > 0 ? matchResults[selectedRecipeIndex] || matchResults[0] : null;

  const toggleIngredient = (id: string) => {
    const isCurrentlySelected = pantry.includes(id);
    sound.playClick(isCurrentlySelected ? 550 : 850);
    triggerHaptic('light');
    let updated: string[];
    if (isCurrentlySelected) {
      updated = pantry.filter(item => item !== id);
    } else {
      updated = [...pantry, id];
    }
    onUpdatePantry(updated);
    savePantryToStorage(updated);
  };

  const selectCommonStaples = () => {
    sound.playClick(900);
    triggerHaptic('medium');
    const commonIds = allAvailableItems.filter(item => item.isCommon).map(item => item.id);
    const merged = Array.from(new Set([...pantry, ...commonIds]));
    onUpdatePantry(merged);
    savePantryToStorage(merged);
  };

  const clearPantry = () => {
    sound.playClick(500);
    triggerHaptic('medium');
    onUpdatePantry([]);
    savePantryToStorage([]);
  };

  const handleAddCustomItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customItemName.trim();
    if (!trimmed) return;

    sound.playSuccess();
    triggerHaptic('success');
    const { item } = addCustomPantryItem(trimmed, customCategory);
    const updatedAll = getAllPantryItems();
    setAllAvailableItems(updatedAll);

    const updatedPantry = Array.from(new Set([...pantry, item.id]));
    onUpdatePantry(updatedPantry);
    savePantryToStorage(updatedPantry);

    setCustomItemName('');
    setIsAddingCustom(false);
  };

  const handleDeleteCustomItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(450);
    triggerHaptic('light');
    deleteCustomPantryItem(id);
    const updatedAll = getAllPantryItems();
    setAllAvailableItems(updatedAll);

    if (pantry.includes(id)) {
      const updated = pantry.filter(item => item !== id);
      onUpdatePantry(updated);
      savePantryToStorage(updated);
    }
  };

  const handleGenerate = () => {
    sound.playClick(900);
    triggerHaptic('medium');
    setSelectedRecipeIndex(0);
    setViewState('results');
    setAcceptedRecipeId(null);
  };

  const handleSpinReadyRoulette = () => {
    if (readyToCookMatches.length === 0) return;
    setIsSpinningRoulette(true);
    triggerHaptic('medium');

    let counter = 0;
    const totalSpins = 16;
    const intervalTime = 80;

    if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);

    rouletteIntervalRef.current = setInterval(() => {
      counter++;
      const randomIndex = Math.floor(Math.random() * readyToCookMatches.length);
      const chosenMatch = readyToCookMatches[randomIndex];
      const matchIndexInFull = matchResults.findIndex(m => m.recipe.id === chosenMatch.recipe.id);
      
      setSelectedRecipeIndex(matchIndexInFull !== -1 ? matchIndexInFull : 0);
      sound.playTick(600 + (counter * 30));
      triggerHaptic('light');

      if (counter >= totalSpins) {
        if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
        setIsSpinningRoulette(false);
        sound.playSuccess();
        triggerHaptic('success');
        triggerVictoryConfetti();
      }
    }, intervalTime);
  };

  useEffect(() => {
    return () => {
      if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
    };
  }, []);

  const handleAcceptRecipe = (match: MatchResult) => {
    sound.playSuccess();
    triggerHaptic('success');
    triggerVictoryConfetti();
    setAcceptedRecipeId(match.recipe.id);
    onAcceptMeal(
      match.recipe.name,
      'cooking',
      match.recipe.imageEmoji,
      `Cocina (${match.recipe.difficulty}) • ${match.recipe.prepTime + match.recipe.cookTime} min`
    );
  };

  const handleToggleFavorite = (match: MatchResult) => {
    const isFav = isMealFavorited(match.recipe.name, favorites);
    if (isFav) {
      sound.playClick(500);
      const existing = favorites.find(f => f.name.toLowerCase().trim() === match.recipe.name.toLowerCase().trim());
      if (existing) {
        onDeleteFavorite(existing.id);
        triggerHaptic('light');
      }
    } else {
      sound.playClick(1000);
      const newFav = createFavoriteFromRecipe(match.recipe);
      onAddFavorite(newFav);
      triggerHaptic('success');
    }
  };

  const filteredPantryItems = allAvailableItems.filter(item => {
    if (activeTab !== 'all' && item.category !== activeTab) return false;
    if (searchQuery.trim() !== '') {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const categorySelectedCounts = useMemo(() => {
    const counts: Record<string, number> = { all: pantry.length };
    for (const item of allAvailableItems) {
      if (pantry.includes(item.id)) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    }
    return counts;
  }, [pantry, allAvailableItems]);

  const isCurrentRecipeFavorited = topMatch ? isMealFavorited(topMatch.recipe.name, favorites) : false;

  return (
    <div className="w-full flex flex-col gap-5 max-w-2xl mx-auto pb-16">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-cook-back"
          onClick={() => {
            sound.playClick(700);
            if (viewState === 'results') {
              setViewState('pantry');
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-xs btn-press cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{viewState === 'results' ? 'Editar despensa' : 'Volver'}</span>
        </button>

        {viewState === 'pantry' ? (
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] px-3 py-1 rounded-full shadow-xs">
            {pantry.length} seleccionados
          </span>
        ) : (
          <button
            onClick={() => {
              sound.playClick(750);
              setViewState('pantry');
            }}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] px-3 py-1 rounded-full shadow-xs btn-press cursor-pointer"
          >
            <span>Modificar despensa ({pantry.length})</span>
          </button>
        )}
      </div>

      {/* PANTRY VIEW */}
      {viewState === 'pantry' && (
        <div className="space-y-5">
          {/* Header text */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Cocinar en Casa
              </h2>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
                Despensa Inteligente • Match por Ingredientes
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-open-custom-ingredient"
                onClick={() => {
                  sound.playClick(800);
                  setIsAddingCustom(true);
                }}
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 shadow-xs btn-press cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar ingrediente</span>
              </button>

              <button
                id="btn-generate-recipe"
                onClick={handleGenerate}
                disabled={pantry.length === 0}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xs btn-press ${
                  pantry.length > 0
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 cursor-pointer'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-60'
                }`}
                title={pantry.length === 0 ? 'Selecciona al menos 1 ingrediente' : 'Ver recetas'}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Ver Recetas ({matchResults.length})</span>
              </button>
            </div>
          </div>

          {/* Inline Custom Ingredient Form */}
          <AnimatePresence>
            {isAddingCustom && (
              <motion.form
                initial={{ opacity: 0, scale: 0.95, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                onSubmit={handleAddCustomItem}
                className="apple-card p-5 space-y-4 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Nuevo Ingrediente
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white btn-press"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      id="input-custom-ingredient-name"
                      type="text"
                      value={customItemName}
                      onChange={e => setCustomItemName(e.target.value)}
                      placeholder="Nombre del ingrediente..."
                      autoFocus
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <select
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value as PantryCategory)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.1] rounded-xl px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                    >
                      <option value="proteins">Proteínas</option>
                      <option value="carbs">Carbohidratos</option>
                      <option value="veggies">Verduras</option>
                      <option value="extras">Lácteos & Extras</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 btn-press"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!customItemName.trim()}
                    className="px-4 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs btn-press shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Quick Actions & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center gap-2">
              <button
                id="btn-select-basics"
                onClick={selectCommonStaples}
                className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-200 text-xs font-medium btn-press cursor-pointer"
              >
                <span>Marcar básicos</span>
              </button>
              <button
                id="btn-clear-pantry"
                onClick={clearPantry}
                className="px-3 py-1.5 rounded-full bg-transparent border border-black/[0.08] dark:border-white/[0.08] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-medium flex items-center gap-1 btn-press cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            </div>

            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar en despensa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map(tab => {
              const isSelected = activeTab === tab.id;
              const count = categorySelectedCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  id={`btn-pantry-tab-${tab.id}`}
                  onClick={() => {
                    sound.playClick(isSelected ? 600 : 750);
                    setActiveTab(tab.id);
                  }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shrink-0 btn-press cursor-pointer border ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-medium shadow-xs'
                      : 'bg-white dark:bg-zinc-900/90 border-black/[0.08] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected 
                        ? 'bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Clean Ingredient Chips Grid */}
          <div className="apple-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                {activeTab === 'all' 
                  ? 'Todos los Ingredientes' 
                  : CATEGORY_TABS.find(t => t.id === activeTab)?.label} ({filteredPantryItems.length})
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredPantryItems.map(item => {
                const isSelected = pantry.includes(item.id);
                return (
                  <div key={item.id} className="relative group">
                    <button
                      id={`btn-pantry-${item.id}`}
                      onClick={() => toggleIngredient(item.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 btn-press cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-medium shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-black/[0.06] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{item.name}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                      ) : null}
                    </button>

                    {!item.isCommon && (
                      <button
                        onClick={e => handleDeleteCustomItem(item.id, e)}
                        title="Eliminar ingrediente"
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-black/[0.08] dark:border-zinc-700 text-zinc-500 hover:text-red-500 flex items-center justify-center text-[10px] shadow-xs cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Match Banner */}
          {pantry.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-xs">
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {readyToCookMatches.length > 0
                    ? `Tienes ${readyToCookMatches.length} ${readyToCookMatches.length === 1 ? 'receta' : 'recetas'} listas al 100%`
                    : almostReadyMatches.length > 0
                    ? `${almostReadyMatches.length} recetas con más del 70% de ingredientes`
                    : 'Descubre qué puedes preparar con tu despensa'}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {readyToCookMatches.length} al 100% • {almostReadyMatches.length} al 70%+
                </p>
              </div>

              {readyToCookMatches.length > 0 && (
                <button
                  id="btn-spin-100-roulette-pantry"
                  onClick={() => {
                    handleGenerate();
                    setTimeout(() => handleSpinReadyRoulette(), 300);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-xs flex items-center gap-1.5 btn-press cursor-pointer shrink-0 shadow-xs"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Sortear ({readyToCookMatches.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* RESULTS VIEW */}
      {viewState === 'results' && topMatch && (
        <div className="space-y-5">
          {/* Main Recipe Card */}
          <div className="apple-card p-6 sm:p-7 space-y-5">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {topMatch.recipe.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    {topMatch.recipe.prepTime + topMatch.recipe.cookTime} min
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {topMatch.recipe.difficulty}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {topMatch.recipe.name}
                </h3>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-3xl shadow-xs shrink-0">
                  {topMatch.recipe.imageEmoji}
                </div>

                <button
                  id="btn-toggle-favorite-recipe"
                  onClick={() => handleToggleFavorite(topMatch)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-amber-500 transition-colors btn-press cursor-pointer"
                  title="Guardar en favoritos"
                >
                  <Star className={`w-4 h-4 ${isCurrentRecipeFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Ingredients Analysis */}
            <div className="space-y-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center justify-between">
                <span>Ingredientes ({topMatch.recipe.allIngredientsFormatted.length})</span>
                <span className="text-[11px] text-zinc-400 font-normal">
                  {topMatch.matchedIngredients.length} disponibles
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {topMatch.recipe.allIngredientsFormatted.map((ing, idx) => {
                  const isAvailable = pantry.includes(ing.id);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        isAvailable
                          ? 'bg-zinc-50 dark:bg-zinc-900 border-black/[0.06] dark:border-white/[0.06] text-zinc-800 dark:text-zinc-200'
                          : 'bg-zinc-50/40 dark:bg-zinc-900/40 border-black/[0.04] dark:border-white/[0.04] text-zinc-400'
                      }`}
                    >
                      <span className="truncate font-medium">{ing.name}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                        isAvailable 
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200' 
                          : 'text-zinc-400'
                      }`}>
                        {isAvailable ? '✓ Disponible' : 'Falta'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                Preparación en 3 Pasos
              </h4>

              <div className="space-y-2">
                {topMatch.recipe.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-black/[0.04] dark:border-white/[0.06]"
                  >
                    <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="pt-2">
              {acceptedRecipeId === topMatch.recipe.id ? (
                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-center text-zinc-900 dark:text-zinc-100 font-medium text-xs">
                  Receta confirmada y guardada en tu historial
                </div>
              ) : (
                <button
                  id="btn-cook-accept-main"
                  onClick={() => handleAcceptRecipe(topMatch)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm flex items-center justify-center gap-2 shadow-md btn-press cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Cocinaré esto hoy</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
