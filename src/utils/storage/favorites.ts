import { DeliveryOption, Recipe, UserFavoriteMeal } from '../../types';
import { DELIVERY_DATASET, RECIPES_DATASET } from '../../data/mealsData';
import { safeGet, safeSet, STORAGE_KEYS, generateUUID } from './persistence';

export function loadFavorites(): UserFavoriteMeal[] {
  // Clean fallback: empty array by default (Fix 4.4)
  return safeGet<UserFavoriteMeal[]>(STORAGE_KEYS.FAVORITES, []);
}

export function saveFavoritesToStorage(favorites: UserFavoriteMeal[]) {
  safeSet(STORAGE_KEYS.FAVORITES, favorites);
}

export function inferMealAttributes(rawName: string): {
  category: 'cheat_meal' | 'typical' | 'healthy' | 'economic';
  imageEmoji: string;
  tags: string[];
  vibe: string;
  source: 'delivery' | 'cooking' | 'custom';
  ingredients: string[];
} {
  const lower = rawName.toLowerCase();

  // Cheat meal / Fast food
  if (/hamburguesa|burger|pizza|papas fritas|lomito|pancho|choripan|nuggets|chivito|taco|shawarma/.test(lower)) {
    let emoji = '🍔';
    if (/pizza/.test(lower)) emoji = '🍕';
    if (/pancho|hotdog/.test(lower)) emoji = '🌭';
    if (/taco/.test(lower)) emoji = '🌮';
    if (/papas fritas/.test(lower)) emoji = '🍟';
    return {
      category: 'cheat_meal',
      imageEmoji: emoji,
      tags: ['Fast Food', 'Antojo', 'Sabroso'],
      vibe: 'Ideal para darse un gusto tremendo y relajarse.',
      source: 'custom',
      ingredients: ['carne', 'pan', 'queso'],
    };
  }

  // Healthy / Ensaladas / Wok / Bowls
  if (/ensalada|salad|wok|bowl|wrap|pechuga|verduras|vegetariano|saludable|quinoa|poke/.test(lower)) {
    let emoji = '🥗';
    if (/bowl|poke/.test(lower)) emoji = '🍲';
    if (/wrap/.test(lower)) emoji = '🌯';
    if (/pechuga|pollo/.test(lower)) emoji = '🍗';
    return {
      category: 'healthy',
      imageEmoji: emoji,
      tags: ['Saludable', 'Liviano', 'Nutritivo'],
      vibe: 'Comida fresca y nutritiva que te llena de energía.',
      source: 'custom',
      ingredients: ['lechuga', 'tomate', 'pollo'],
    };
  }

  // Pastas & Guisos
  if (/pasta|fideos|ravioles|ñoquis|sorrentinos|lasagna|lasaña|canelones|guiso|estofado|locro|cazuela/.test(lower)) {
    let emoji = '🍝';
    if (/guiso|estofado|locro|cazuela/.test(lower)) emoji = '🍲';
    return {
      category: 'typical',
      imageEmoji: emoji,
      tags: ['Casero', 'Reconfortante', 'Abundante'],
      vibe: 'Un clásico reconfortante de toda la vida.',
      source: 'cooking',
      ingredients: ['fideos', 'salsa de tomate', 'queso'],
    };
  }

  // Empanadas / Tartas
  if (/empanada|empanadas|tarta|pascualina/.test(lower)) {
    return {
      category: 'typical',
      imageEmoji: '🥟',
      tags: ['Práctico', 'Argentino', 'Rápido'],
      vibe: 'Práctico, rendidor y delicioso para cualquier ocasión.',
      source: 'custom',
      ingredients: ['harina', 'carne', 'cebolla'],
    };
  }

  // Asado / Carnes
  if (/asado|milanesa|milanga|parrilla|vacio|bife|costillar|matambre/.test(lower)) {
    return {
      category: 'typical',
      imageEmoji: '🥩',
      tags: ['Clásico', 'Argentino', 'Proteico'],
      vibe: 'Un infaltable con todo el sabor tradicional.',
      source: 'custom',
      ingredients: ['carne', 'papas', 'huevos'],
    };
  }

  // Postres & Dulces
  if (/helado|torta|flan|alfajor|chocotorta|chocolate|postre|dulce|panqueque|brownie|waffle/.test(lower)) {
    let emoji = '🍰';
    if (/helado/.test(lower)) emoji = '🍦';
    if (/chocolate|brownie/.test(lower)) emoji = '🍫';
    if (/panqueque|waffle/.test(lower)) emoji = '🥞';
    return {
      category: 'cheat_meal',
      imageEmoji: emoji,
      tags: ['Postre', 'Dulce', 'Tentación'],
      vibe: 'El toque dulce perfecto para alegrar el momento.',
      source: 'custom',
      ingredients: ['azucar', 'leche', 'huevos'],
    };
  }

  // Default / Genérico
  return {
    category: 'typical',
    imageEmoji: '🍽️',
    tags: ['Plato Personalizado', 'Rico'],
    vibe: 'Una excelente elección preparada a tu gusto.',
    source: 'custom',
    ingredients: ['ingredientes varios'],
  };
}

export function createFavoriteFromInput(name: string): UserFavoriteMeal {
  const trimmed = name.trim();
  const inferred = inferMealAttributes(trimmed);
  return {
    id: generateUUID('fav_'),
    name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
    category: inferred.category,
    priceLevel: '$$',
    deliveryTime: '20-30 min',
    tags: inferred.tags,
    description: `Agregado como plato preferido: ${trimmed}.`,
    ingredients: inferred.ingredients,
    imageEmoji: inferred.imageEmoji,
    caloriesApprox: '~500 kcal',
    vibe: inferred.vibe,
    source: inferred.source,
    createdAt: Date.now(),
  };
}

export function createFavoriteFromDeliveryOption(option: DeliveryOption): UserFavoriteMeal {
  return {
    id: generateUUID('fav_'),
    name: option.name,
    category: option.category,
    priceLevel: option.priceLevel,
    deliveryTime: option.deliveryTime,
    tags: option.tags,
    description: option.description,
    ingredients: option.ingredients,
    imageEmoji: option.imageEmoji,
    caloriesApprox: option.caloriesApprox,
    vibe: option.vibe,
    source: 'delivery',
    createdAt: Date.now(),
  };
}

export function createFavoriteFromRecipe(recipe: Recipe): UserFavoriteMeal {
  return {
    id: generateUUID('fav_'),
    name: recipe.name,
    category: 'typical',
    priceLevel: '$',
    deliveryTime: `${recipe.prepTime + recipe.cookTime} min (Cocina)`,
    tags: ['Casero', recipe.difficulty, recipe.category, ...recipe.tags],
    description: recipe.nutritionHighlight || `Receta casera en 3 pasos.`,
    ingredients: recipe.requiredIngredients,
    imageEmoji: recipe.imageEmoji,
    caloriesApprox: recipe.caloriesApprox,
    vibe: recipe.chefTip ? `Tip del chef: ${recipe.chefTip}` : 'Plato casero fácil y delicioso.',
    source: 'cooking',
    createdAt: Date.now(),
  };
}

export interface PreloadedMealCatalogItem {
  id: string;
  name: string;
  category: 'cheat_meal' | 'typical' | 'healthy' | 'economic';
  type: 'delivery' | 'cooking';
  imageEmoji: string;
  timeEstimate: string;
  description: string;
  tags: string[];
  ingredients: string[];
}

export function getAllPreloadedMeals(): PreloadedMealCatalogItem[] {
  const deliveryItems: PreloadedMealCatalogItem[] = DELIVERY_DATASET.map(d => ({
    id: d.id,
    name: d.name,
    category: d.category,
    type: 'delivery' as const,
    imageEmoji: d.imageEmoji,
    timeEstimate: d.deliveryTime,
    description: d.description,
    tags: d.tags,
    ingredients: d.ingredients,
  }));

  const recipeItems: PreloadedMealCatalogItem[] = RECIPES_DATASET.map(r => ({
    id: r.id,
    name: r.name,
    category: 'typical' as const,
    type: 'cooking' as const,
    imageEmoji: r.imageEmoji,
    timeEstimate: `${r.prepTime + r.cookTime} min`,
    description: r.nutritionHighlight || 'Receta casera en 3 pasos.',
    tags: r.tags,
    ingredients: r.requiredIngredients,
  }));

  return [...deliveryItems, ...recipeItems];
}

export function createFavoriteFromCatalogItem(item: PreloadedMealCatalogItem): UserFavoriteMeal {
  const matchRecipe = RECIPES_DATASET.find(r => r.id === item.id);
  if (matchRecipe) return createFavoriteFromRecipe(matchRecipe);

  const matchDelivery = DELIVERY_DATASET.find(d => d.id === item.id);
  if (matchDelivery) return createFavoriteFromDeliveryOption(matchDelivery);

  return createFavoriteFromInput(item.name);
}

export function addFavoriteMeal(meal: UserFavoriteMeal): UserFavoriteMeal[] {
  const current = loadFavorites();
  const exists = current.some(
    f => f.name.toLowerCase().trim() === meal.name.toLowerCase().trim()
  );
  if (exists) return current;

  const updated = [meal, ...current];
  saveFavoritesToStorage(updated);
  return updated;
}

export function deleteFavoriteMeal(id: string): UserFavoriteMeal[] {
  const current = loadFavorites();
  const updated = current.filter(f => f.id !== id);
  saveFavoritesToStorage(updated);
  return updated;
}

// Aliases for clear naming
export const loadUserFavorites = loadFavorites;
export const addUserFavoriteMeal = addFavoriteMeal;
export const deleteUserFavoriteMeal = deleteFavoriteMeal;

export function isMealFavorited(name: string, favorites: UserFavoriteMeal[]): boolean {
  const lower = name.toLowerCase().trim();
  return favorites.some(f => f.name.toLowerCase().trim() === lower);
}

export function favoriteToDeliveryOption(fav: UserFavoriteMeal): DeliveryOption {
  return {
    id: fav.id,
    name: fav.name,
    category: fav.category,
    priceLevel: fav.priceLevel || '$$',
    deliveryTime: fav.deliveryTime || '25-35 min',
    tags: fav.tags,
    description: fav.description,
    ingredients: fav.ingredients,
    imageEmoji: fav.imageEmoji,
    caloriesApprox: fav.caloriesApprox || '~650 kcal',
    vibe: fav.vibe,
  };
}
