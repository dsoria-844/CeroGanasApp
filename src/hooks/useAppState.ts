import { useState, useEffect, useCallback } from 'react';
import { AppTab, MealCardItem, MealHistoryItem, Recipe, UserFavoriteMeal } from '../types';
import { RECIPES_DATASET } from '../data/mealsData';
import {
  addMealToHistory,
  addUserFavoriteMeal,
  clearMealHistory,
  deleteMealFromHistory,
  deleteUserFavoriteMeal,
  loadExclusions,
  loadMealHistory,
  loadSavedPantry,
  loadUserFavorites,
  restoreMealHistoryItem,
} from '../utils/storage';
import { applyTheme, getInitialTheme, Theme } from '../utils/theme';
import { sound } from '../utils/audio';

export interface AcceptedMealConfirmation {
  name: string;
  emoji: string;
  type: 'delivery' | 'cooking';
}

export function useAppState() {
  const [theme, setTheme] = useState<Theme>('light');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AppTab>('decide');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [pantry, setPantry] = useState<string[]>([]);
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<UserFavoriteMeal[]>([]);

  // Active Modals
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isBlindModeOpen, setIsBlindModeOpen] = useState(false);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [acceptedMealConfirmation, setAcceptedMealConfirmation] = useState<AcceptedMealConfirmation | null>(null);

  // Initialize Theme and Local Storage on Mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    setPantry(loadSavedPantry());
    setHistory(loadMealHistory());
    setExclusions(loadExclusions());
    setFavorites(loadUserFavorites());

    const seenWelcome = localStorage.getItem('cero_ganas_welcome_seen');
    if (!seenWelcome) {
      setIsWelcomeOpen(true);
    }
  }, []);

  // Scroll to top on tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const nextTheme: Theme = prevTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const nextSound = !prev;
      sound.setEnabled(nextSound);
      return nextSound;
    });
  }, []);

  const handleAcceptMeal = useCallback((
    name: string,
    type: 'delivery' | 'cooking',
    emoji: string,
    details?: string
  ) => {
    const updatedHistory = addMealToHistory(name, type, emoji, details);
    setHistory(updatedHistory);
    setAcceptedMealConfirmation({ name, emoji, type });
  }, []);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    const updated = deleteMealFromHistory(id);
    setHistory(updated);
  }, []);

  const handleRestoreHistoryItem = useCallback((item: MealHistoryItem) => {
    const updated = restoreMealHistoryItem(item);
    setHistory(updated);
  }, []);

  const handleClearHistory = useCallback(() => {
    const updated = clearMealHistory();
    setHistory(updated);
  }, []);

  const handleAddFavorite = useCallback((meal: UserFavoriteMeal) => {
    const updated = addUserFavoriteMeal(meal);
    setFavorites(updated);
  }, []);

  const handleDeleteFavorite = useCallback((id: string) => {
    const updated = deleteUserFavoriteMeal(id);
    setFavorites(updated);
  }, []);

  const handleOpenRecipe = useCallback((recipeOrItem: Recipe | MealCardItem | null) => {
    if (!recipeOrItem) return;
    if ('recipe' in recipeOrItem && recipeOrItem.recipe) {
      setViewingRecipe(recipeOrItem.recipe);
      return;
    }
    if ('steps' in recipeOrItem && Array.isArray((recipeOrItem as Recipe).steps)) {
      setViewingRecipe(recipeOrItem as Recipe);
      return;
    }
    const found = RECIPES_DATASET.find(
      r => r.name.toLowerCase().trim() === recipeOrItem.name.toLowerCase().trim()
    );
    if (found) {
      setViewingRecipe(found);
      return;
    }
    const fallbackRecipe: Recipe = {
      id: recipeOrItem.id || 'recipe_' + Date.now(),
      name: recipeOrItem.name,
      category: 'Express',
      prepTime: 10,
      cookTime: 15,
      difficulty: 'Fácil',
      tags: ('tags' in recipeOrItem && Array.isArray(recipeOrItem.tags)) ? recipeOrItem.tags : ['Casero'],
      allIngredientsFormatted: ('ingredientsSummary' in recipeOrItem && Array.isArray(recipeOrItem.ingredientsSummary) && recipeOrItem.ingredientsSummary.length > 0)
        ? recipeOrItem.ingredientsSummary.map(name => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name, amount: 'Al gusto' }))
        : [{ id: 'ing_1', name: 'Ingredientes principales', amount: 'Al gusto' }],
      requiredIngredients: [],
      optionalIngredients: [],
      steps: [
        'Preparar y organizar los ingredientes en la mesa de trabajo.',
        'Cocinar a fuego medio siguiendo la técnica recomendada.',
        'Servir caliente y disfrutar de este riquísimo plato casero.'
      ],
      imageEmoji: recipeOrItem.imageEmoji || '🍳',
      caloriesApprox: typeof recipeOrItem.caloriesApprox === 'string' ? recipeOrItem.caloriesApprox : '~450 kcal',
      nutritionHighlight: 'Plato equilibrado y nutritivo.',
      chefTip: 'Podés ajustar los condimentos a tu gusto personal.'
    };
    setViewingRecipe(fallbackRecipe);
  }, []);

  return {
    theme,
    soundEnabled,
    activeTab,
    isSidebarOpen,
    pantry,
    history,
    exclusions,
    favorites,
    isWelcomeOpen,
    isBlindModeOpen,
    isExclusionsOpen,
    viewingRecipe,
    acceptedMealConfirmation,
    setTheme,
    setSoundEnabled,
    setActiveTab,
    setIsSidebarOpen,
    setPantry,
    setHistory,
    setExclusions,
    setFavorites,
    setIsWelcomeOpen,
    setIsBlindModeOpen,
    setIsExclusionsOpen,
    setViewingRecipe,
    setAcceptedMealConfirmation,
    handleToggleTheme,
    handleToggleSound,
    handleAcceptMeal,
    handleDeleteHistoryItem,
    handleRestoreHistoryItem,
    handleClearHistory,
    handleAddFavorite,
    handleDeleteFavorite,
    handleOpenRecipe,
  };
}
