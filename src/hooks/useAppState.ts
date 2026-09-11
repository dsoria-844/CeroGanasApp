import { useState, useEffect, useCallback } from 'react';
import { AppTab, DayPlan, MealCardItem, MealHistoryItem, Recipe, UserFavoriteMeal, WeeklyPlan } from '../types';
import { RECIPES_DATASET } from '../data/mealsData';
import {
  addMealToHistory,
  addUserFavoriteMeal,
  assignMealToSlot,
  clearMealHistory,
  clearWeeklyPlan,
  deleteMealFromHistory,
  deleteUserFavoriteMeal,
  generateFullWeeklyPlan,
  getMergedRecipes,
  loadExclusions,
  loadMealHistory,
  loadSavedPantry,
  loadUserFavorites,
  loadWeeklyPlan,
  rerollSingleSlot,
  restoreMealHistoryItem,
  saveWeeklyPlan,
} from '../utils/storage';
import { AddToPlanMeal } from '../components/AddToPlanModal';
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
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);

  // Active Modals
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isBlindModeOpen, setIsBlindModeOpen] = useState(false);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [acceptedMealConfirmation, setAcceptedMealConfirmation] = useState<AcceptedMealConfirmation | null>(null);
  const [planModalMeal, setPlanModalMeal] = useState<AddToPlanMeal | null>(null);

  // Initialize Theme and Local Storage on Mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    setPantry(loadSavedPantry());
    setHistory(loadMealHistory());
    setExclusions(loadExclusions());
    setFavorites(loadUserFavorites());
    setWeeklyPlan(loadWeeklyPlan());

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
    details?: string,
    showConfirmationModal: boolean = true
  ) => {
    const updatedHistory = addMealToHistory(name, type, emoji, details);
    setHistory(updatedHistory);
    if (showConfirmationModal) {
      setAcceptedMealConfirmation({ name, emoji, type });
    }
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
    if ('steps' in recipeOrItem && Array.isArray((recipeOrItem as Recipe).steps) && (recipeOrItem as Recipe).steps.length > 0) {
      setViewingRecipe(recipeOrItem as Recipe);
      return;
    }

    const allRecipes = getMergedRecipes();
    const targetId = recipeOrItem.id;
    const targetName = (recipeOrItem.name || '').toLowerCase().trim();

    // Prioritize exact ID match, then exact name match in merged recipes
    const foundById = targetId ? allRecipes.find(r => r.id === targetId) : undefined;
    if (foundById) {
      setViewingRecipe(foundById);
      return;
    }

    const foundByName = allRecipes.find(r => (r.name || '').toLowerCase().trim() === targetName);
    if (foundByName) {
      setViewingRecipe(foundByName);
      return;
    }

    // Fallback to dataset directly
    const foundInDataset = RECIPES_DATASET.find(r => 
      (targetId && r.id === targetId) || (r.name || '').toLowerCase().trim() === targetName
    );
    if (foundInDataset) {
      setViewingRecipe(foundInDataset);
      return;
    }

    // Honest fallback without invented steps, tips, or fake calories
    const fallbackRecipe: Recipe = {
      id: recipeOrItem.id || 'recipe_' + Date.now(),
      name: recipeOrItem.name,
      category: 'Express',
      prepTime: 10,
      cookTime: 15,
      difficulty: 'Fácil',
      tags: ('tags' in recipeOrItem && Array.isArray(recipeOrItem.tags)) ? recipeOrItem.tags : ['Casero'],
      allIngredientsFormatted: ('ingredientsSummary' in recipeOrItem && Array.isArray(recipeOrItem.ingredientsSummary) && recipeOrItem.ingredientsSummary.length > 0)
        ? recipeOrItem.ingredientsSummary.map(name => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name, amount: '' }))
        : [],
      requiredIngredients: [],
      optionalIngredients: [],
      steps: [],
      imageEmoji: ('imageEmoji' in recipeOrItem && recipeOrItem.imageEmoji) || ('emoji' in (recipeOrItem as any) && (recipeOrItem as any).emoji) || '🍳',
      caloriesApprox: typeof recipeOrItem.caloriesApprox === 'string' ? recipeOrItem.caloriesApprox : '',
      nutritionHighlight: '',
      chefTip: ''
    };
    setViewingRecipe(fallbackRecipe);
  }, []);

  const handleOpenAddToPlan = useCallback((meal: AddToPlanMeal) => {
    setPlanModalMeal(meal);
  }, []);

  const handleCloseAddToPlan = useCallback(() => {
    setPlanModalMeal(null);
  }, []);

  const handleAssignMealToPlan = useCallback((
    dayId: DayPlan['dayId'],
    slotType: 'lunch' | 'dinner',
    meal: AddToPlanMeal
  ) => {
    setWeeklyPlan(prevPlan => {
      const { updatedPlan } = assignMealToSlot(prevPlan || [], dayId, slotType, meal);
      return updatedPlan;
    });
  }, []);

  const handleClearWeeklyPlan = useCallback(() => {
    const emptyPlan = clearWeeklyPlan();
    setWeeklyPlan(emptyPlan);
  }, []);

  const handleGenerateWeeklyPlan = useCallback(() => {
    const generated = generateFullWeeklyPlan(exclusions, history);
    setWeeklyPlan(generated);
    return generated;
  }, [exclusions, history]);

  const handleRerollSlot = useCallback((dayIndex: number, slotType: 'lunch' | 'dinner') => {
    setWeeklyPlan(prevPlan => {
      if (!prevPlan) return prevPlan;
      const updated = [...prevPlan];
      const currentSlot = updated[dayIndex][slotType];
      const newSlot = rerollSingleSlot(currentSlot.type, exclusions, currentSlot.mealName);
      updated[dayIndex] = {
        ...updated[dayIndex],
        [slotType]: newSlot,
      };
      saveWeeklyPlan(updated);
      return updated;
    });
  }, [exclusions]);

  return {
    theme,
    soundEnabled,
    activeTab,
    isSidebarOpen,
    pantry,
    history,
    exclusions,
    favorites,
    weeklyPlan,
    isWelcomeOpen,
    isBlindModeOpen,
    isExclusionsOpen,
    viewingRecipe,
    acceptedMealConfirmation,
    planModalMeal,
    setTheme,
    setSoundEnabled,
    setActiveTab,
    setIsSidebarOpen,
    setPantry,
    setHistory,
    setExclusions,
    setFavorites,
    setWeeklyPlan,
    setIsWelcomeOpen,
    setIsBlindModeOpen,
    setIsExclusionsOpen,
    setViewingRecipe,
    setAcceptedMealConfirmation,
    setPlanModalMeal,
    handleToggleTheme,
    handleToggleSound,
    handleAcceptMeal,
    handleDeleteHistoryItem,
    handleRestoreHistoryItem,
    handleClearHistory,
    handleAddFavorite,
    handleDeleteFavorite,
    handleOpenRecipe,
    handleOpenAddToPlan,
    handleCloseAddToPlan,
    handleAssignMealToPlan,
    handleClearWeeklyPlan,
    handleGenerateWeeklyPlan,
    handleRerollSlot,
  };
}
