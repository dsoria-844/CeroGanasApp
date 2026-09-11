import { 
  DeliveryCategory, 
  DeliveryOption, 
  FoodCategoryFilter, 
  MatchResult, 
  MealCardItem, 
  MealHistoryItem, 
  ModalityFilter, 
  Recipe, 
  UserFavoriteMeal 
} from '../../types';
import { DELIVERY_DATASET, RECIPES_DATASET } from '../../data/mealsData';
import { loadPreferredModality } from './persistence';
import { getRecentHistoryMealNames } from './history';
import { favoriteToDeliveryOption } from './favorites';
import { getMergedDelivery, getMergedRecipes } from './custom-meals';
import { getPantryItemName } from './pantry';

export function getEligibleDeliveryOptions(
  category: DeliveryCategory,
  exclusions: string[] = [],
  history: MealHistoryItem[] = [],
  onlyFavorites: boolean = false,
  favoritesList: UserFavoriteMeal[] = []
): DeliveryOption[] {
  const safeExclusions = Array.isArray(exclusions) ? exclusions : [];
  const safeHistory = Array.isArray(history) ? history : [];
  const safeFavorites = Array.isArray(favoritesList) ? favoritesList : [];

  const recentNames = getRecentHistoryMealNames(safeHistory);
  const lowerExclusions = safeExclusions.map(e => (e || '').toLowerCase());

  let basePool: DeliveryOption[];

  if (onlyFavorites) {
    basePool = safeFavorites.map(favoriteToDeliveryOption);
  } else {
    const customFavoritesAsOptions = safeFavorites
      .filter(f => f && f.source === 'custom')
      .map(favoriteToDeliveryOption);

    const existingNames = new Set((DELIVERY_DATASET || []).map(d => d.name.toLowerCase().trim()));
    const nonDuplicateCustoms = customFavoritesAsOptions.filter(
      c => c && !existingNames.has(c.name.toLowerCase().trim())
    );

    basePool = [...(DELIVERY_DATASET || []), ...nonDuplicateCustoms];
  }

  const eligible = (basePool || []).filter(option => {
    if (!option) return false;
    if (category !== 'all' && option.category !== category) {
      return false;
    }

    const optIngredients = option.ingredients || [];
    const hasExcludedIngredient = optIngredients.some(ing => 
      lowerExclusions.includes((ing || '').toLowerCase())
    );
    if (hasExcludedIngredient) return false;

    const optTags = option.tags || [];
    const hasExcludedTag = optTags.some(tag => 
      lowerExclusions.includes((tag || '').toLowerCase())
    );
    if (hasExcludedTag) return false;

    const wasEatenRecently = recentNames.some(name => 
      name.includes(option.name.toLowerCase()) || option.name.toLowerCase().includes(name)
    );
    if (wasEatenRecently) return false;

    return true;
  });

  if (eligible.length === 0) {
    return (basePool || []).filter(option => {
      if (!option) return false;
      if (category !== 'all' && option.category !== category) return false;
      const optIngredients = option.ingredients || [];
      const optTags = option.tags || [];
      const hasExcluded = optIngredients.some(ing => lowerExclusions.includes((ing || '').toLowerCase())) ||
        optTags.some(tag => lowerExclusions.includes((tag || '').toLowerCase()));
      return !hasExcluded;
    });
  }

  return eligible;
}

export function matchRecipesWithPantry(
  pantry: string[] = [],
  exclusions: string[] = [],
  history: MealHistoryItem[] = []
): MatchResult[] {
  const safePantry = Array.isArray(pantry) ? pantry : [];
  const safeExclusions = Array.isArray(exclusions) ? exclusions : [];
  const safeHistory = Array.isArray(history) ? history : [];

  if (safePantry.length === 0) {
    return [];
  }

  const lowerExclusions = safeExclusions.map(e => (e || '').toLowerCase());
  const recentNames = getRecentHistoryMealNames(safeHistory);

  const results: MatchResult[] = [];

  for (const recipe of (RECIPES_DATASET || [])) {
    const reqIngredients = recipe.requiredIngredients || [];
    const optIngredients = recipe.optionalIngredients || [];
    const tags = recipe.tags || [];

    const hasExcluded = reqIngredients.some(ing => lowerExclusions.includes((ing || '').toLowerCase())) ||
      tags.some(tag => lowerExclusions.includes((tag || '').toLowerCase()));
    
    if (hasExcluded) continue;

    const requiredTotal = reqIngredients.length;
    const requiredMatched = reqIngredients.filter(id => safePantry.includes(id));
    const missingRequired = reqIngredients.filter(id => !safePantry.includes(id));

    const optionalMatched = optIngredients.filter(id => safePantry.includes(id));
    const optionalTotal = optIngredients.length;
    const optionalRatio = optionalTotal > 0 ? optionalMatched.length / optionalTotal : 0;

    let matchPercentage: number;
    if (requiredTotal === 0) {
      matchPercentage = optionalTotal > 0 ? Math.round(optionalRatio * 100) : 0;
    } else if (requiredMatched.length === 0) {
      matchPercentage = 0;
    } else if (missingRequired.length === 0) {
      matchPercentage = optionalTotal > 0 
        ? Math.round(80 + (optionalRatio * 20))
        : 100;
    } else {
      const requiredRatio = requiredMatched.length / requiredTotal;
      matchPercentage = Math.min(95, Math.round((requiredRatio * 80) + (optionalRatio * 20)));
    }

    if (matchPercentage <= 0) continue;

    const allMatched = [...requiredMatched, ...optionalMatched];
    const missing = missingRequired;

    const wasEatenRecently = recentNames.some(name => 
      name.includes(recipe.name.toLowerCase()) || recipe.name.toLowerCase().includes(name)
    );

    const sortingScore = wasEatenRecently ? matchPercentage - 30 : matchPercentage;

    results.push({
      recipe,
      matchPercentage,
      matchedIngredients: allMatched,
      missingIngredients: missing,
      missingCount: missingRequired.length,
      sortingScore,
    });
  }

  results.sort((a, b) => {
    if (b.sortingScore !== a.sortingScore) {
      return b.sortingScore - a.sortingScore;
    }
    return a.missingCount - b.missingCount;
  });

  return results;
}

export function getUnifiedCardDataset(
  modality: ModalityFilter = 'all',
  category: FoodCategoryFilter = 'all',
  exclusions: string[] = [],
  history: MealHistoryItem[] = [],
  favorites: UserFavoriteMeal[] = []
): MealCardItem[] {
  const safeExclusions = Array.isArray(exclusions) ? exclusions : [];
  const safeFavorites = Array.isArray(favorites) ? favorites : [];

  const allDelivery = getMergedDelivery();
  const allRecipes = getMergedRecipes();

  const filteredDelivery = (allDelivery || []).filter(d => {
    if (!d) return false;
    const ings = d.ingredients || [];
    const hasExcluded = ings.some(ing => safeExclusions.includes((ing || '').toLowerCase().trim()));
    if (hasExcluded) return false;
    return true;
  });

  const filteredRecipes = (allRecipes || []).filter(recipe => {
    if (!recipe) return false;
    const req = recipe.requiredIngredients || [];
    const hasExcluded = req.some(id => safeExclusions.includes((id || '').toLowerCase().trim()));
    if (hasExcluded) return false;
    return true;
  });

  const cards: MealCardItem[] = [];

  const matchesCategory = (
    tags: string[],
    ingredients: string[],
    isQuick: boolean,
    isMeat: boolean,
    isPasta: boolean,
    isSandwich: boolean,
    isEmpanada: boolean,
    isProtein: boolean,
    isCheat: boolean,
    isDessert: boolean
  ) => {
    if (category === 'all') return true;
    if (category === 'quick') return isQuick;
    if (category === 'meat') return isMeat;
    if (category === 'pasta') return isPasta;
    if (category === 'sandwiches') return isSandwich;
    if (category === 'empanadas') return isEmpanada;
    if (category === 'protein') return isProtein;
    if (category === 'desserts') return isDessert;
    if (category === 'cheat') return isCheat;
    return true;
  };

  // 1. Delivery Options
  if (modality === 'all' || modality === 'delivery') {
    filteredDelivery.forEach(d => {
      const isQuick = parseInt(d.deliveryTime) <= 25;
      const isMeat = d.tags.some(t => /carne|cerdo|pollo|parrilla|lomito/i.test(t)) || d.ingredients.some(i => /carne|cerdo|pollo/.test(i));
      const isPasta = d.tags.some(t => /pasta|guiso/i.test(t)) || d.ingredients.some(i => /fideos|noquis|ravioles/.test(i));
      const isSandwich = d.tags.some(t => /sandwich|minuta|lomito/i.test(t));
      const isEmpanada = d.tags.some(t => /empanada|regional/i.test(t));
      const isProtein = d.ingredients.some(i => /carne|pollo|cerdo|huevos/.test(i)) || d.tags.some(t => /proteico|carne|pollo/i.test(t));
      const isCheat = d.category === 'cheat_meal' || d.tags.some(t => /cheat|fast_food|frit/i.test(t));
      const isDessert = d.tags.some(t => /postre|golosina|helado|torta|dulce|alfajor/i.test(t));

      if (matchesCategory(d.tags, d.ingredients, isQuick, isMeat, isPasta, isSandwich, isEmpanada, isProtein, isCheat, isDessert)) {
        cards.push({
          id: d.id,
          name: d.name,
          type: 'delivery',
          categoryLabel: isDessert ? 'Postres & Dulces' : d.category === 'cheat_meal' ? 'Delivery Antojo' : d.category === 'healthy' ? 'Delivery Saludable' : 'Delivery Típico',
          timeEstimate: d.deliveryTime,
          tags: d.tags,
          description: d.description,
          ingredientsSummary: d.ingredients.map(getPantryItemName),
          imageEmoji: d.imageEmoji,
          caloriesApprox: d.caloriesApprox,
          vibe: d.vibe,
          deliveryOption: d,
        });
      }
    });
  }

  // 2. Cooking Recipes
  if (modality === 'all' || modality === 'cooking') {
    filteredRecipes.forEach(r => {
      const totalTime = r.prepTime + r.cookTime;
      const isQuick = totalTime <= 15;
      const isMeat = r.category === 'Carne' || r.category === 'Pollo' || r.tags.some(t => /carne|cerdo|pollo/i.test(t));
      const isPasta = r.category === 'Pasta' || r.tags.some(t => /pasta|guiso/i.test(t));
      const isSandwich = r.tags.some(t => /sandwich|minuta|tarta/i.test(t));
      const isEmpanada = r.tags.some(t => /empanada|tarta|vegetariano/i.test(t));
      const isProtein = r.tags.some(t => /prote|pollo|carne/i.test(t)) || r.nutritionHighlight.includes('Proteína');
      const isCheat = r.difficulty === 'Rápida' || r.tags.some(t => /cheat|clasico/i.test(t));
      const isDessert = r.tags.some(t => /postre|golosina|dulce|flan|panqueque|chocotorta/i.test(t));

      if (matchesCategory(r.tags, r.requiredIngredients, isQuick, isMeat, isPasta, isSandwich, isEmpanada, isProtein, isCheat, isDessert)) {
        cards.push({
          id: r.id,
          name: r.name,
          type: 'cooking',
          categoryLabel: isDessert ? 'Postre Casero' : `Cocina Casera (${r.difficulty})`,
          timeEstimate: `${totalTime} min`,
          tags: r.tags,
          description: r.nutritionHighlight || `Receta casera en 3 sencillos pasos.`,
          ingredientsSummary: r.allIngredientsFormatted.slice(0, 4).map(i => i.name),
          imageEmoji: r.imageEmoji,
          caloriesApprox: r.caloriesApprox,
          vibe: r.chefTip ? `Tip del Chef: ${r.chefTip}` : 'Fácil de preparar en casa con ingredientes simples.',
          recipe: r,
        });
      }
    });
  }

  // 3. User Favorites
  const lowerExclusions = safeExclusions.map(e => (e || '').toLowerCase());
  (safeFavorites || []).forEach(f => {
    if (!f) return;
    const isFavCooking = f.source === 'cooking';
    if (
      (modality === 'all') ||
      (modality === 'cooking' && isFavCooking) ||
      (modality === 'delivery' && !isFavCooking)
    ) {
      const fIngredients = f.ingredients || [];
      const hasExcluded = fIngredients.some(ing => 
        lowerExclusions.includes((ing || '').toLowerCase())
      );
      if (hasExcluded) return;

      cards.push({
        id: f.id,
        name: f.name,
        type: isFavCooking ? 'cooking' : 'delivery',
        categoryLabel: '⭐ Tu Favorito Personal',
        timeEstimate: f.deliveryTime || '20-30 min',
        tags: ['Favorito', ...(f.tags || [])],
        description: f.description || 'Guardado en tu lista personal de favoritos.',
        ingredientsSummary: (f.ingredients || []).map(getPantryItemName),
        imageEmoji: f.imageEmoji,
        caloriesApprox: f.caloriesApprox,
        vibe: f.vibe || 'Uno de tus platos predilectos.',
      });
    }
  });

  return cards.sort(() => Math.random() - 0.5);
}

export function pickBlindDecisionMeal(
  exclusions: string[] = [],
  history: MealHistoryItem[] = [],
  favorites: UserFavoriteMeal[] = []
): MealCardItem {
  const safeExclusions = Array.isArray(exclusions) ? exclusions : [];
  const safeHistory = Array.isArray(history) ? history : [];
  const safeFavorites = Array.isArray(favorites) ? favorites : [];

  const prefModality = loadPreferredModality();
  let allCards = getUnifiedCardDataset(prefModality, 'all', safeExclusions, safeHistory, safeFavorites);
  if (allCards.length === 0) {
    allCards = getUnifiedCardDataset('all', 'all', safeExclusions, safeHistory, safeFavorites);
  }
  const savoryCards = (allCards || []).filter(card => {
    if (!card) return false;
    const tags = card.tags || [];
    const isDessert = tags.some(t => /postre|golosina|helado|torta|dulce|alfajor|flan|panqueque|chocotorta/i.test(t)) ||
      (card.categoryLabel && /postre|dulce/i.test(card.categoryLabel));
    return !isDessert;
  });

  const pool = savoryCards.length > 0 ? savoryCards : (allCards || []);

  if (pool.length === 0) {
    return {
      id: 'default_blind',
      name: 'Milanesa con Puré Casero',
      type: 'cooking',
      categoryLabel: 'Clásico Infalible',
      timeEstimate: '20 min',
      tags: ['Clásico', 'Delicioso'],
      description: 'El clásico indiscutible que nunca falla.',
      ingredientsSummary: ['Carne / Pollo', 'Papas', 'Huevos'],
      imageEmoji: '🥩',
      caloriesApprox: '~600 kcal',
      vibe: 'Cero dudas. Prepará o pedite unas milanesas ya.',
    };
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
