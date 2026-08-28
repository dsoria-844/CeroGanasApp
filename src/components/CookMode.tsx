import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChefHat, 
  Check, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  ChevronRight,
  Utensils,
  Lightbulb,
  Search,
  X,
  Star,
  Plus,
  Trash2,
  Sparkles,
  Dices,
  Info
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

const CATEGORY_TABS: { id: PantryCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Todo', icon: '🧺' },
  { id: 'proteins', label: 'Proteínas', icon: '🍗' },
  { id: 'carbs', label: 'Carbohidratos', icon: '🍚' },
  { id: 'veggies', label: 'Verduras', icon: '🥦' },
  { id: 'extras', label: 'Lácteos & Extras', icon: '🧀' },
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

  // Custom Pantry Item Modal / Inline state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customCategory, setCustomCategory] = useState<PantryCategory>('veggies');
  const [allAvailableItems, setAllAvailableItems] = useState<PantryItem[]>([]);

  // 100% Roulette Spinning State
  const [isSpinningRoulette, setIsSpinningRoulette] = useState(false);
  const rouletteIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load all pantry items on mount and whenever custom items change
  useEffect(() => {
    setAllAvailableItems(getAllPantryItems());
  }, []);

  // Match results calculation & sorting
  const matchResults = useMemo(() => {
    return matchRecipesWithPantry(pantry, exclusions, history);
  }, [pantry, exclusions, history]);

  // Split matches into explicit tiers
  const readyToCookMatches = useMemo(() => {
    return matchResults.filter(m => m.matchPercentage === 100);
  }, [matchResults]);

  const almostReadyMatches = useMemo(() => {
    return matchResults.filter(m => m.matchPercentage >= 70 && m.matchPercentage < 100);
  }, [matchResults]);

  const otherMatches = useMemo(() => {
    return matchResults.filter(m => m.matchPercentage < 70);
  }, [matchResults]);

  const topMatch = matchResults.length > 0 ? matchResults[selectedRecipeIndex] || matchResults[0] : null;

  // Toggle single ingredient
  const toggleIngredient = (id: string) => {
    triggerHaptic('light');
    let updated: string[];
    if (pantry.includes(id)) {
      updated = pantry.filter(item => item !== id);
    } else {
      updated = [...pantry, id];
    }
    onUpdatePantry(updated);
    savePantryToStorage(updated);
  };

  // Select all common staples
  const selectCommonStaples = () => {
    triggerHaptic('medium');
    const commonIds = allAvailableItems.filter(item => item.isCommon).map(item => item.id);
    const merged = Array.from(new Set([...pantry, ...commonIds]));
    onUpdatePantry(merged);
    savePantryToStorage(merged);
  };

  // Clear all pantry
  const clearPantry = () => {
    triggerHaptic('medium');
    onUpdatePantry([]);
    savePantryToStorage([]);
  };

  // Handle adding custom ingredient
  const handleAddCustomItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customItemName.trim();
    if (!trimmed) return;

    triggerHaptic('success');
    const { item } = addCustomPantryItem(trimmed, customCategory);
    const updatedAll = getAllPantryItems();
    setAllAvailableItems(updatedAll);

    // Auto-select the newly added ingredient
    const updatedPantry = Array.from(new Set([...pantry, item.id]));
    onUpdatePantry(updatedPantry);
    savePantryToStorage(updatedPantry);

    setCustomItemName('');
    setIsAddingCustom(false);
  };

  // Delete custom ingredient
  const handleDeleteCustomItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    deleteCustomPantryItem(id);
    const updatedAll = getAllPantryItems();
    setAllAvailableItems(updatedAll);

    // Remove from pantry selection if selected
    if (pantry.includes(id)) {
      const updated = pantry.filter(item => item !== id);
      onUpdatePantry(updated);
      savePantryToStorage(updated);
    }
  };

  const handleGenerate = () => {
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
      triggerHaptic('light');

      if (counter >= totalSpins) {
        if (rouletteIntervalRef.current) clearInterval(rouletteIntervalRef.current);
        setIsSpinningRoulette(false);
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
    triggerHaptic('success');
    triggerVictoryConfetti();
    setAcceptedRecipeId(match.recipe.id);
    onAcceptMeal(
      match.recipe.name,
      'cooking',
      match.recipe.imageEmoji,
      `Cocina Casera (${match.recipe.difficulty}) • ${match.recipe.prepTime + match.recipe.cookTime} min`
    );
  };

  const handleToggleFavorite = (match: MatchResult) => {
    const isFav = isMealFavorited(match.recipe.name, favorites);
    if (isFav) {
      const existing = favorites.find(f => f.name.toLowerCase().trim() === match.recipe.name.toLowerCase().trim());
      if (existing) {
        onDeleteFavorite(existing.id);
        triggerHaptic('light');
      }
    } else {
      const newFav = createFavoriteFromRecipe(match.recipe);
      onAddFavorite(newFav);
      triggerHaptic('success');
    }
  };

  // Filter pantry items by category and search
  const filteredPantryItems = allAvailableItems.filter(item => {
    if (activeTab !== 'all' && item.category !== activeTab) return false;
    if (searchQuery.trim() !== '') {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Calculate count of selected ingredients per category
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
    <div className="w-full flex flex-col gap-6">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          id="btn-cook-back"
          onClick={() => {
            if (viewState === 'results') {
              setViewState('pantry');
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{viewState === 'results' ? 'Editar despensa' : 'Volver al menú'}</span>
        </button>

        {viewState === 'pantry' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-300 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full">
              {pantry.length} seleccionados
            </span>
          </div>
        ) : (
          <button
            onClick={() => setViewState('pantry')}
            className="text-xs font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full cursor-pointer hover:border-zinc-700"
          >
            <span>Modificar ingredientes ({pantry.length})</span>
          </button>
        )}
      </div>

      {/* PANTRY VIEW */}
      {viewState === 'pantry' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header text */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-light text-zinc-50 tracking-tight">
                Cocinar en Casa
              </h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-mono">
                Despensa Inteligente • Match por Ingredientes Disponibles
              </p>
            </div>

            {/* Add Custom Ingredient Quick Trigger Button */}
            <button
              id="btn-open-custom-ingredient"
              onClick={() => setIsAddingCustom(true)}
              className="self-start sm:self-auto px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-2 hover:border-zinc-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Agregar ingrediente personalizado</span>
            </button>
          </div>

          {/* Inline Custom Ingredient Creation Box (When Open) */}
          <AnimatePresence>
            {isAddingCustom && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddCustomItem}
                className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 space-y-4 shadow-xl overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider font-mono">
                      Nuevo Ingrediente en Despensa
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Nombre del ingrediente:
                    </label>
                    <input
                      id="input-custom-ingredient-name"
                      type="text"
                      value={customItemName}
                      onChange={e => setCustomItemName(e.target.value)}
                      placeholder="Ej: Salmón fresco, Berenjena, Curry en polvo..."
                      autoFocus
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Categoría:
                    </label>
                    <select
                      value={customCategory}
                      onChange={e => setCustomCategory(e.target.value as PantryCategory)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-400 cursor-pointer"
                    >
                      <option value="proteins">🍗 Proteínas</option>
                      <option value="carbs">🍚 Carbohidratos</option>
                      <option value="veggies">🥦 Verduras</option>
                      <option value="extras">🧀 Lácteos & Extras</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!customItemName.trim()}
                    className={`px-5 py-2 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all ${
                      customItemName.trim()
                        ? 'bg-zinc-100 text-zinc-950 hover:bg-white font-semibold cursor-pointer shadow-md'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar y Activar</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Quick Actions & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80">
            <div className="flex items-center gap-2">
              <button
                id="btn-select-basics"
                onClick={selectCommonStaples}
                className="px-3.5 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <span>✨ Marcar básicos</span>
              </button>
              <button
                id="btn-clear-pantry"
                onClick={clearPantry}
                className="px-3.5 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar en despensa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs (Proteínas, Carbohidratos, Verduras, Lácteos/Extras) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map(tab => {
              const isSelected = activeTab === tab.id;
              const count = categorySelectedCounts[tab.id] || 0;
              return (
                <button
                  key={tab.id}
                  id={`btn-pantry-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Interactive Chips Grid */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                {activeTab === 'all' 
                  ? 'Todos los Ingredientes' 
                  : CATEGORY_TABS.find(t => t.id === activeTab)?.label} ({filteredPantryItems.length})
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                Toca para marcar lo que tienes en casa
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {filteredPantryItems.map(item => {
                const isSelected = pantry.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="relative group"
                  >
                    <button
                      id={`btn-pantry-${item.id}`}
                      onClick={() => toggleIngredient(item.id)}
                      className={`px-4 py-2.5 rounded-full text-xs transition-all flex items-center gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-zinc-100 text-zinc-950 border-transparent font-medium shadow-md pr-3'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{item.emoji}</span>
                      <span>{item.name}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-zinc-950 ml-0.5" />
                      ) : null}
                    </button>

                    {/* Delete button for custom ingredients */}
                    {!item.isCommon && (
                      <button
                        onClick={e => handleDeleteCustomItem(item.id, e)}
                        title="Eliminar ingrediente personalizado"
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500 flex items-center justify-center text-[10px] shadow-sm cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recipe Match Insights Banner */}
          {pantry.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl">
                  {readyToCookMatches.length > 0 ? '🎉' : almostReadyMatches.length > 0 ? '🍳' : '💡'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-100">
                    {readyToCookMatches.length > 0
                      ? `¡Tienes ${readyToCookMatches.length} ${readyToCookMatches.length === 1 ? 'receta' : 'recetas'} listas para cocinar al 100%!`
                      : almostReadyMatches.length > 0
                      ? `${almostReadyMatches.length} recetas con más del 70% de ingredientes`
                      : 'Descubre qué puedes preparar con tu despensa'}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {readyToCookMatches.length} al 100% • {almostReadyMatches.length} al 70%+
                  </p>
                </div>
              </div>

              {readyToCookMatches.length > 0 && (
                <button
                  id="btn-spin-100-roulette-pantry"
                  onClick={() => {
                    handleGenerate();
                    setTimeout(() => handleSpinReadyRoulette(), 300);
                  }}
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Ruleta 100% Listas ({readyToCookMatches.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Floating Sticky Bottom CTA */}
          <div className="sticky bottom-4 z-20 pt-2">
            <button
              id="btn-generate-recipe"
              onClick={handleGenerate}
              disabled={pantry.length === 0}
              className={`w-full py-4 px-6 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 shadow-2xl transition-all active:scale-98 ${
                pantry.length > 0
                  ? 'bg-zinc-100 hover:bg-white text-zinc-950 cursor-pointer hover:scale-[1.01] font-semibold'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>
                {pantry.length === 0
                  ? 'Selecciona al menos 1 ingrediente'
                  : `Ver Recetas con Match (${pantry.length} ingredientes en casa)`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* RESULTS VIEW */}
      {viewState === 'results' && topMatch && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Match Quality Banner & 100% Roulette Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {topMatch.matchPercentage === 100 ? '🌟' : topMatch.matchPercentage >= 70 ? '✨' : '🍳'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold border ${
                    topMatch.matchPercentage === 100
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : topMatch.matchPercentage >= 70
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}>
                    {topMatch.matchPercentage === 100
                      ? 'Listo para cocinar'
                      : topMatch.matchPercentage >= 70
                      ? 'Te falta poco'
                      : 'Receta adaptable'}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
                    {topMatch.matchPercentage}% de coincidencia
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-200 mt-1">
                  {topMatch.matchPercentage === 100
                    ? '¡Tienes absolutamente todos los ingredientes en casa!'
                    : topMatch.missingCount === 1
                    ? `Solo te falta 1 ingrediente (${topMatch.missingIngredients.map(id => getPantryItemName(id)).join(', ')})`
                    : `Faltan ${topMatch.missingCount} ingredientes principales`}
                </p>
              </div>
            </div>

            {/* Spin among 100% match recipes roulette button */}
            {readyToCookMatches.length > 1 && (
              <button
                id="btn-spin-100-roulette-results"
                onClick={handleSpinReadyRoulette}
                disabled={isSpinningRoulette}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Dices className={`w-4 h-4 ${isSpinningRoulette ? 'animate-spin' : ''}`} />
                <span>
                  {isSpinningRoulette 
                    ? 'Girando entre listas...' 
                    : `Girar entre recetas 100% listas (${readyToCookMatches.length})`}
                </span>
              </button>
            )}
          </div>

          {/* Main Recipe Card */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-3 py-1 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                    {topMatch.recipe.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {topMatch.recipe.prepTime + topMatch.recipe.cookTime} min total
                  </span>
                  <span className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                    {topMatch.recipe.difficulty}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-light text-zinc-50 tracking-tight pt-1">
                  {topMatch.recipe.name}
                </h3>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-4xl shrink-0">
                  {topMatch.recipe.imageEmoji}
                </div>

                {/* Instant Favorite Toggle Button */}
                <button
                  id="btn-toggle-favorite-recipe"
                  onClick={() => handleToggleFavorite(topMatch)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCurrentRecipeFavorited
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                  title={isCurrentRecipeFavorited ? 'En tus favoritos' : 'Guardar en mis favoritos'}
                >
                  <Star className={`w-3.5 h-3.5 ${isCurrentRecipeFavorited ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                  <span className="hidden sm:inline">
                    {isCurrentRecipeFavorited ? 'En favoritos' : 'Guardar favorito'}
                  </span>
                </button>
              </div>
            </div>

            {/* Ingredients Analysis: What you have vs What's missing */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-mono flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Ingredientes ({topMatch.recipe.allIngredientsFormatted.length})</span>
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {topMatch.matchedIngredients.length} disponibles en tu despensa
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {topMatch.recipe.allIngredientsFormatted.map((ing, idx) => {
                  const isAvailable = pantry.includes(ing.id);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
                        isAvailable
                          ? 'bg-zinc-950/80 border-zinc-800 text-zinc-200'
                          : 'bg-zinc-950/40 border-zinc-850 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base">{getPantryItemEmoji(ing.id)}</span>
                        <span className="truncate font-medium">{ing.name}</span>
                        {ing.amount && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ({ing.amount})
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                        isAvailable 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : ing.optional 
                          ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}>
                        {isAvailable ? '✓ Disponible' : ing.optional ? 'Opcional' : 'Faltante'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step-by-Step 3 Steps Instructions */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                Preparación en 3 Pasos
              </h4>

              <div className="space-y-3">
                {topMatch.recipe.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3.5 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80"
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chef Pro-Tip */}
            {topMatch.recipe.chefTip && (
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-400">
                <Lightbulb className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-zinc-200">Consejo del chef: </strong>
                  <span className="italic font-serif text-zinc-300">"{topMatch.recipe.chefTip}"</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              {acceptedRecipeId === topMatch.recipe.id ? (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-zinc-200 font-medium text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-100" />
                  <span>¡Receta confirmada y guardada en el historial de 4 días!</span>
                </div>
              ) : (
                <button
                  id="btn-cook-accept-main"
                  onClick={() => handleAcceptRecipe(topMatch)}
                  className="w-full py-4 px-6 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Cocinaré esta receta hoy!</span>
                </button>
              )}
            </div>
          </div>

          {/* Sorted Ranked Categories: 100% Match, >=70% Match, Other */}
          <div className="space-y-6 pt-4">
            {/* 100% Matches Tier */}
            {readyToCookMatches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-2">
                    <span>🌟 Listas para cocinar (100% Match)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                      {readyToCookMatches.length}
                    </span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {readyToCookMatches.map((match) => {
                    const matchIdx = matchResults.findIndex(m => m.recipe.id === match.recipe.id);
                    const isSelected = matchIdx === selectedRecipeIndex;
                    return (
                      <button
                        key={match.recipe.id}
                        onClick={() => {
                          setSelectedRecipeIndex(matchIdx);
                          triggerHaptic('light');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-800 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                            {match.recipe.imageEmoji}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-zinc-100 truncate">
                              {match.recipe.name}
                            </p>
                            <p className="text-[11px] text-emerald-400 font-mono">
                              100% Match • {match.recipe.prepTime + match.recipe.cookTime} min
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-transform shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* >= 70% Matches Tier */}
            {almostReadyMatches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase tracking-widest text-amber-400 font-mono flex items-center gap-2">
                    <span>✨ Te falta poco (70%+ Match)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                      {almostReadyMatches.length}
                    </span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {almostReadyMatches.map((match) => {
                    const matchIdx = matchResults.findIndex(m => m.recipe.id === match.recipe.id);
                    const isSelected = matchIdx === selectedRecipeIndex;
                    return (
                      <button
                        key={match.recipe.id}
                        onClick={() => {
                          setSelectedRecipeIndex(matchIdx);
                          triggerHaptic('light');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-800 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                            {match.recipe.imageEmoji}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-medium text-zinc-200 truncate">
                              {match.recipe.name}
                            </p>
                            <p className="text-[11px] text-amber-400 font-mono truncate">
                              {match.matchPercentage}% match • Falta: {match.missingIngredients.map(id => getPantryItemName(id)).join(', ')}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-transform shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Matches */}
            {otherMatches.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                  Otras Opciones Compatibles ({otherMatches.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otherMatches.slice(0, 4).map((match) => {
                    const matchIdx = matchResults.findIndex(m => m.recipe.id === match.recipe.id);
                    const isSelected = matchIdx === selectedRecipeIndex;
                    return (
                      <button
                        key={match.recipe.id}
                        onClick={() => {
                          setSelectedRecipeIndex(matchIdx);
                          triggerHaptic('light');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                          isSelected 
                            ? 'bg-zinc-800 border-zinc-600 shadow-lg' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                            {match.recipe.imageEmoji}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-medium text-zinc-300 truncate">
                              {match.recipe.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              {match.matchPercentage}% match
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-1 transition-transform shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
