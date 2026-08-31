import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChefHat, 
  Check, 
  Clock, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Heart,
  Plus,
  Dices,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { PantryCategory, MatchResult, MealHistoryItem, UserFavoriteMeal, PantryItem, MealCardItem } from '../types';
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
import { useRaffle } from '../hooks/useRaffle';
import { RaffleModal } from './RaffleModal';

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
  onOpenRecipeModal?: (item: MealCardItem) => void;
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
  onOpenRecipeModal,
}) => {
  const [activeTab, setActiveTab] = useState<PantryCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<'pantry' | 'results'>('pantry');
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const [acceptedRecipeId, setAcceptedRecipeId] = useState<string | null>(null);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customCategory, setCustomCategory] = useState<PantryCategory>('veggies');
  const [allAvailableItems, setAllAvailableItems] = useState<PantryItem[]>([]);

  // Shared Raffle Hook
  const {
    isDuelActive,
    isPreparingRaffle,
    isSpinningDuel,
    duelWinner,
    startRaffleWithPrep,
    startRaffleImmediately,
    closeRaffle,
  } = useRaffle();

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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Ensure scroll is immediately reset to top when viewing results
  useEffect(() => {
    if (viewState === 'results') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [viewState]);

  const matchToMealCard = (m: MatchResult): MealCardItem => {
    const r = m.recipe;
    const totalTime = r.prepTime + r.cookTime;
    return {
      id: r.id,
      name: r.name,
      type: 'cooking',
      categoryLabel: `Cocina (${r.difficulty})`,
      timeEstimate: `${totalTime} min`,
      tags: r.tags,
      description: r.nutritionHighlight || `Receta casera (${m.matchPercentage}% disponible).`,
      ingredientsSummary: r.allIngredientsFormatted.slice(0, 4).map(i => i.name),
      imageEmoji: r.imageEmoji,
      caloriesApprox: r.caloriesApprox,
      vibe: r.chefTip ? `Tip del Chef: ${r.chefTip}` : 'Fácil de preparar en casa con tus ingredientes disponibles.',
      recipe: r,
    };
  };

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
    <div className="w-full flex flex-col gap-4 max-w-xl mx-auto pb-24 select-none">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
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
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-xs btn-press cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{viewState === 'results' ? 'Volver a la despensa' : 'Volver'}</span>
        </button>

        {viewState === 'pantry' && (
          <button
            id="btn-open-custom-ingredient"
            onClick={() => {
              sound.playClick(800);
              setIsAddingCustom(prev => !prev);
            }}
            className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs btn-press cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar ingrediente</span>
          </button>
        )}
      </div>

      {/* PANTRY VIEW */}
      {viewState === 'pantry' && (
        <div className="space-y-3.5">
          {/* Main Title */}
          <div>
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Despensa Inteligente
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              Toca los ingredientes que tienes para encontrar recetas al instante
            </p>
          </div>

          {/* Quick Actions & Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar ingrediente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              id="btn-select-basics"
              onClick={selectCommonStaples}
              className="px-3 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-xs font-semibold btn-press cursor-pointer shrink-0 shadow-2xs"
              title="Marcar ingredientes básicos"
            >
              Básicos
            </button>

            {pantry.length > 0 && (
              <button
                id="btn-clear-pantry"
                onClick={clearPantry}
                className="p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] text-zinc-400 hover:text-red-500 btn-press cursor-pointer shrink-0 shadow-2xs"
                title="Limpiar despensa"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Inline Custom Ingredient Form */}
          <AnimatePresence>
            {isAddingCustom && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddCustomItem}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Nuevo Ingrediente Personalizado
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={e => setCustomItemName(e.target.value)}
                    placeholder="Ej. Espinaca, Atún..."
                    autoFocus
                    className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value as PantryCategory)}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="proteins">Proteínas</option>
                    <option value="carbs">Carbohidratos</option>
                    <option value="veggies">Verduras</option>
                    <option value="extras">Lácteos / Extras</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!customItemName.trim()}
                    className="px-4 py-1 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Category Tabs with Sliding Spring Pill */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none relative">
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
                  className={`relative px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shrink-0 cursor-pointer border transition-colors ${
                    isSelected
                      ? 'text-white dark:text-zinc-900 font-bold border-transparent'
                      : 'bg-white dark:bg-zinc-900 border-black/[0.08] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="pantry-category-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-full shadow-xs -z-0"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  {count > 0 && (
                    <span className={`relative z-10 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected 
                        ? 'bg-amber-500 text-zinc-950' 
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Ingredients Grid with Elastic Tactile Tokens */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
            <motion.div layout className="flex flex-wrap gap-2">
              <AnimatePresence>
                {filteredPantryItems.map(item => {
                  const isSelected = pantry.includes(item.id);
                  return (
                    <motion.div 
                      key={item.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="relative group"
                    >
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        id={`btn-pantry-${item.id}`}
                        onClick={() => toggleIngredient(item.id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs flex items-center gap-2 cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-sm shadow-amber-500/20'
                            : 'bg-zinc-50 dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium'
                        }`}
                      >
                        <span className="text-sm">{item.emoji || '🥘'}</span>
                        <span>{item.name}</span>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </motion.span>
                        )}
                      </motion.button>

                      {!item.isCommon && (
                        <button
                          onClick={e => handleDeleteCustomItem(item.id, e)}
                          title="Eliminar ingrediente"
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 hover:text-red-500 flex items-center justify-center text-[10px] shadow-xs cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Sticky Floating Dynamic Action Dock */}
          <AnimatePresence>
            {pantry.length > 0 && (
              <motion.div 
                initial={{ y: 50, opacity: 0, scale: 0.94 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className="fixed bottom-3 left-4 right-4 max-w-xl mx-auto z-40 p-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex items-center justify-between gap-2"
              >
                <div className="pl-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <span>{matchResults.length} {matchResults.length === 1 ? 'receta posible' : 'recetas posibles'}</span>
                  </span>
                  <span className={`text-[10px] flex items-center gap-1 font-semibold ${
                    readyToCookMatches.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {readyToCookMatches.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    <span>{readyToCookMatches.length} listas para cocinar ya (100%)</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {matchResults.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        const candidates = matchResults.map(matchToMealCard);
                        startRaffleWithPrep(candidates);
                      }}
                      className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold flex items-center gap-1 btn-press cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
                      title="Sortear entre todas las recetas posibles"
                    >
                      <Dices className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sortear</span>
                    </motion.button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    id="btn-generate-recipe"
                    onClick={handleGenerate}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 btn-press cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Ver Recetas ({matchResults.length})</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* RESULTS VIEW WITH DIRECTIONAL SPRING CAROUSEL */}
      {viewState === 'results' && topMatch && (
        <div className="space-y-4">
          {/* Carousel Header & Counter */}
          <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-zinc-950 shadow-xs">
                {selectedRecipeIndex + 1} / {matchResults.length}
              </span>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {topMatch.matchPercentage === 100 ? '⭐ 100% de ingredientes' : `${topMatch.matchPercentage}% de ingredientes`}
              </span>
            </div>

            {/* Navigation Arrows & Sorteo */}
            <div className="flex items-center gap-1.5">
              {matchResults.length > 1 && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const candidates = matchResults.map(matchToMealCard);
                    startRaffleWithPrep(candidates);
                  }}
                  className="px-2.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold flex items-center gap-1 btn-press cursor-pointer border border-black/[0.04] dark:border-white/[0.06]"
                  title="Sortear entre todas las recetas posibles"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Sortear</span>
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.9 }}
                id="btn-prev-recipe"
                onClick={() => {
                  if (selectedRecipeIndex > 0) {
                    sound.playClick(750);
                    triggerHaptic('light');
                    setDirection(-1);
                    setSelectedRecipeIndex(prev => prev - 1);
                  }
                }}
                disabled={selectedRecipeIndex === 0}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed btn-press cursor-pointer transition-all"
                title="Receta anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                id="btn-next-recipe"
                onClick={() => {
                  if (selectedRecipeIndex < matchResults.length - 1) {
                    sound.playClick(850);
                    triggerHaptic('light');
                    setDirection(1);
                    setSelectedRecipeIndex(prev => prev + 1);
                  }
                }}
                disabled={selectedRecipeIndex === matchResults.length - 1}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed btn-press cursor-pointer transition-all"
                title="Siguiente receta"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Main Recipe Card with Directional Spring Motion & Swipe */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={topMatch.recipe.id}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: dir > 0 ? 100 : dir < 0 ? -100 : 0,
                    opacity: 0,
                    scale: 0.96,
                  }),
                  center: {
                    x: 0,
                    opacity: 1,
                    scale: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 350,
                      damping: 28,
                    },
                  },
                  exit: (dir: number) => ({
                    x: dir > 0 ? -100 : dir < 0 ? 100 : 0,
                    opacity: 0,
                    scale: 0.96,
                    transition: {
                      duration: 0.16,
                    },
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_e, info) => {
                  if (info.offset.x > 70 || info.velocity.x > 350) {
                    if (selectedRecipeIndex > 0) {
                      sound.playClick(750);
                      triggerHaptic('light');
                      setDirection(-1);
                      setSelectedRecipeIndex(prev => prev - 1);
                    }
                  } else if (info.offset.x < -70 || info.velocity.x < -350) {
                    if (selectedRecipeIndex < matchResults.length - 1) {
                      sound.playClick(850);
                      triggerHaptic('light');
                      setDirection(1);
                      setSelectedRecipeIndex(prev => prev + 1);
                    }
                  }
                }}
                className="apple-card p-6 sm:p-7 space-y-5 cursor-grab active:cursor-grabbing touch-pan-y"
              >
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
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {topMatch.matchPercentage}% de ingredientes
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
                      className={`p-2 rounded-full border transition-all btn-press cursor-pointer ${
                        isCurrentRecipeFavorited
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-black/[0.06] dark:border-white/[0.06]'
                      }`}
                      title={isCurrentRecipeFavorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      <Heart className={`w-4 h-4 ${isCurrentRecipeFavorited ? 'fill-current' : ''}`} />
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
                        <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
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
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      id="btn-cook-accept-main"
                      onClick={() => handleAcceptRecipe(topMatch)}
                      className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 btn-press cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Cocinaré esto hoy</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* UNIFIED RAFFLE MODAL */}
      <RaffleModal
        isOpen={isDuelActive}
        winner={duelWinner}
        isPreparing={isPreparingRaffle}
        isSpinning={isSpinningDuel}
        candidateCount={matchResults.length}
        onClose={closeRaffle}
        onAcceptMeal={(winner) => {
          sound.playSuccess();
          triggerHaptic('success');
          onAcceptMeal(
            winner.name,
            'cooking',
            winner.imageEmoji,
            `Sorteo Despensa • ${winner.timeEstimate}`
          );
          closeRaffle();
        }}
        onOpenRecipeModal={(winner) => {
          sound.playClick(800);
          closeRaffle();
          if (onOpenRecipeModal) onOpenRecipeModal(winner);
        }}
        onReroll={() => {
          const candidates = matchResults.map(matchToMealCard);
          startRaffleImmediately(candidates);
        }}
      />
    </div>
  );
};
