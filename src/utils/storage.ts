import confetti from 'canvas-confetti';
import { 
  MealHistoryItem, 
  Recipe, 
  MatchResult, 
  DeliveryOption, 
  DeliveryCategory, 
  UserFavoriteMeal,
  PantryItem,
  PantryCategory,
  WeeklyPlan,
  DayPlan,
  MealPlanSlot,
  MealCardItem,
  MoodFilter,
  ModalityFilter,
  FoodCategoryFilter
} from '../types';
import { DELIVERY_DATASET, RECIPES_DATASET, PANTRY_ITEMS } from '../data/mealsData';

const STORAGE_KEYS = {
  PANTRY: 'que_como_pantry_v1',
  CUSTOM_PANTRY: 'que_como_custom_pantry_v1',
  HISTORY: 'que_como_history_v1',
  EXCLUSIONS: 'que_como_exclusions_v1',
  REROLLS: 'que_como_rerolls_v1',
  FAVORITES: 'que_como_favorites_v1',
  WEEKLY_PLAN: 'que_como_weekly_plan_v1',
  DUEL_THRESHOLD: 'que_como_duel_threshold_v1',
  CUSTOM_MEALS: 'que_como_custom_meals_v1',
  DEFAULT_DELIVERY_APP: 'que_como_default_delivery_app_v1',
  DELETED_MEALS: 'que_como_deleted_meals_v1',
};

export interface CustomMealsStorage {
  delivery: DeliveryOption[];
  recipes: Recipe[];
}

export function loadCustomMeals(): CustomMealsStorage {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_MEALS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        delivery: Array.isArray(parsed.delivery) ? parsed.delivery : [],
        recipes: Array.isArray(parsed.recipes) ? parsed.recipes : [],
      };
    }
  } catch (e) {
    console.error('Error loading custom meals:', e);
  }
  return { delivery: [], recipes: [] };
}

export function saveCustomDeliveryMeal(meal: DeliveryOption): CustomMealsStorage {
  const current = loadCustomMeals();
  const updated: CustomMealsStorage = {
    ...current,
    delivery: [meal, ...current.delivery.filter(d => d.id !== meal.id)],
  };
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MEALS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving custom delivery meal:', e);
  }
  return updated;
}

export function saveCustomRecipeMeal(recipe: Recipe): CustomMealsStorage {
  const current = loadCustomMeals();
  const updated: CustomMealsStorage = {
    ...current,
    recipes: [recipe, ...current.recipes.filter(r => r.id !== recipe.id)],
  };
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MEALS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving custom recipe:', e);
  }
  return updated;
}

export function deleteCustomMeal(id: string): CustomMealsStorage {
  const current = loadCustomMeals();
  const updated: CustomMealsStorage = {
    delivery: current.delivery.filter(d => d.id !== id),
    recipes: current.recipes.filter(r => r.id !== id),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MEALS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting custom meal:', e);
  }
  return updated;
}

export function loadDeletedMealIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_MEALS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading deleted meal IDs:', e);
  }
  return [];
}

export function deleteAnyMeal(id: string): void {
  deleteCustomMeal(id);
  const deleted = loadDeletedMealIds();
  if (!deleted.includes(id)) {
    const updated = [...deleted, id];
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_MEALS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving deleted meal ID:', e);
    }
  }
}

export function restoreDeletedMeal(id: string): void {
  const deleted = loadDeletedMealIds();
  const updated = deleted.filter(d => d !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.DELETED_MEALS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error restoring meal:', e);
  }
}

export function getAllCatalogMeals(): { delivery: DeliveryOption[]; recipes: Recipe[]; customCount: number } {
  const deleted = loadDeletedMealIds();
  const custom = loadCustomMeals();
  
  const allDelivery = [...DELIVERY_DATASET, ...custom.delivery].filter(d => !deleted.includes(d.id));
  const allRecipes = [...RECIPES_DATASET, ...custom.recipes].filter(r => !deleted.includes(r.id));

  return {
    delivery: allDelivery,
    recipes: allRecipes,
    customCount: custom.delivery.length + custom.recipes.length,
  };
}

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;
const MAX_DAILY_REROLLS = 3;

export function loadDuelThreshold(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DUEL_THRESHOLD);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 2 && parsed <= 20) return parsed;
    }
  } catch {
    // ignore
  }
  return 2; // default 2
}

export function saveDuelThreshold(count: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DUEL_THRESHOLD, String(count));
  } catch {
    // ignore
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatNiceDate(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  
  const todayStr = getTodayDateString();
  const itemDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const diffDays = Math.floor((now.getTime() - timestamp) / (24 * 60 * 60 * 1000));
  
  if (itemDateStr === todayStr) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays <= 4) {
    return `Hace ${diffDays} días`;
  }
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatNiceTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// --- HAPTIC & FEEDBACK ---
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      if (type === 'light') navigator.vibrate(15);
      else if (type === 'medium') navigator.vibrate(30);
      else if (type === 'success') navigator.vibrate([20, 50, 40]);
      else if (type === 'warning') navigator.vibrate([40, 40, 40]);
    } catch {
      // Ignore vibration errors on unsupported platforms
    }
  }
}

export function triggerVictoryConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#f97316'],
      ticks: 200,
    });
  } catch {
    // Fallback if canvas is not ready
  }
}

// --- LOCAL STORAGE HELPERS ---

export function loadSavedPantry(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PANTRY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading pantry:', e);
  }
  // Default sensible starter pantry for first time users
  return ['huevos', 'arroz', 'fideos', 'cebolla', 'tomate', 'queso', 'aceite', 'salsa_tomate'];
}

export function savePantryToStorage(pantryIds: string[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantryIds));
  } catch (e) {
    console.error('Error saving pantry:', e);
  }
}

export function loadCustomPantryItems(): PantryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PANTRY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading custom pantry items:', e);
  }
  return [];
}

export function saveCustomPantryItems(items: PantryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PANTRY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving custom pantry items:', e);
  }
}

export function inferPantryItemCategory(name: string): { category: PantryCategory; emoji: string } {
  const lower = name.toLowerCase();
  
  // Emoji inference
  let emoji = '🥗';
  if (/poll|pechuga|muslo|alitas/.test(lower)) emoji = '🍗';
  else if (/carne|bife|lomo|asado|picada|molida|vacio|entraña/.test(lower)) emoji = '🥩';
  else if (/pescad|merluza|salmon|salmón|ceviche/.test(lower)) emoji = '🐟';
  else if (/atun|atún/.test(lower)) emoji = '🥫';
  else if (/cerdo|panceta|bacon|bondiola|jamon|jamón|salchicha/.test(lower)) emoji = '🥓';
  else if (/huevo|huevos/.test(lower)) emoji = '🥚';
  else if (/queso|mozzar|cheddar|parmes/.test(lower)) emoji = '🧀';
  else if (/leche|crema|yogur/.test(lower)) emoji = '🥛';
  else if (/manteca|mantequilla/.test(lower)) emoji = '🧈';
  else if (/arroz/.test(lower)) emoji = '🍚';
  else if (/fideo|past|spaghett|tallarin|ñoqui/.test(lower)) emoji = '🍝';
  else if (/papa|papas|patata/.test(lower)) emoji = '🥔';
  else if (/pan|bagel|tostad|taco|wrap/.test(lower)) emoji = '🍞';
  else if (/avena|cereal/.test(lower)) emoji = '🥣';
  else if (/tomate/.test(lower)) emoji = '🍅';
  else if (/cebolla|puerro/.test(lower)) emoji = '🧅';
  else if (/ajo/.test(lower)) emoji = '🧄';
  else if (/palta|aguacate/.test(lower)) emoji = '🥑';
  else if (/lechuga|espinaca|rucula|rúcula|acelga/.test(lower)) emoji = '🥬';
  else if (/zanahoria/.test(lower)) emoji = '🥕';
  else if (/morron|morrón|pimiento|chili/.test(lower)) emoji = '🫑';
  else if (/champin|champiñ|hongo/.test(lower)) emoji = '🍄';
  else if (/choclo|maiz|maíz/.test(lower)) emoji = '🌽';
  else if (/limon|limón/.test(lower)) emoji = '🍋';
  else if (/aceite|oliva/.test(lower)) emoji = '🫒';
  else if (/salsa|tuco|ketchup|mostaza|mayonesa/.test(lower)) emoji = '🥫';
  else if (/especia|sal|pimienta|oregano|orégano/.test(lower)) emoji = '🧂';

  // Category inference
  let category: PantryCategory = 'extras';
  if (/poll|carne|bife|lomo|asado|picada|pescad|salmon|salmón|atun|atún|cerdo|panceta|jamon|jamón|huevo|huevos|tofu|legumb|lentej|garbanzo/.test(lower)) {
    category = 'proteins';
  } else if (/arroz|fideo|past|spaghett|papa|papas|patata|pan|harina|avena|batata|taco|wrap|choclo|maiz/.test(lower)) {
    category = 'carbs';
  } else if (/tomate|cebolla|ajo|palta|aguacate|lechuga|espinaca|rucula|rúcula|acelga|zanahoria|morron|morrón|pimiento|champin|champiñ|hongo|brocoli|brócoli|calabaza|zucchini|pepino|berenjena/.test(lower)) {
    category = 'veggies';
  } else {
    category = 'extras';
  }

  return { category, emoji };
}

export function addCustomPantryItem(name: string, forcedCategory?: PantryCategory): { item: PantryItem; all: PantryItem[] } {
  const currentCustom = loadCustomPantryItems();
  const trimmed = name.trim();
  const inferred = inferPantryItemCategory(trimmed);
  
  // Format clean ID
  const cleanId = trimmed.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || `custom_${Date.now()}`;

  const newItem: PantryItem = {
    id: cleanId,
    name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
    category: forcedCategory || inferred.category,
    emoji: inferred.emoji,
    isCommon: false,
  };

  // Prevent exact duplicate ID
  const filtered = currentCustom.filter(c => c.id !== newItem.id);
  const updated = [newItem, ...filtered];
  saveCustomPantryItems(updated);

  return {
    item: newItem,
    all: updated,
  };
}

export function deleteCustomPantryItem(id: string): PantryItem[] {
  const currentCustom = loadCustomPantryItems();
  const updated = currentCustom.filter(c => c.id !== id);
  saveCustomPantryItems(updated);
  return updated;
}

export function getAllPantryItems(): PantryItem[] {
  const custom = loadCustomPantryItems();
  const defaultItems = PANTRY_ITEMS;
  
  // Avoid duplicates by id
  const customIds = new Set(custom.map(c => c.id));
  const uniqueDefaults = defaultItems.filter(d => !customIds.has(d.id));
  
  return [...uniqueDefaults, ...custom];
}

export function loadMealHistory(): MealHistoryItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) {
      const items: MealHistoryItem[] = JSON.parse(saved);
      // Clean items older than 30 days but keep record
      const now = Date.now();
      const valid = items.filter(item => (now - item.timestamp) < (30 * 24 * 60 * 60 * 1000));
      return valid;
    }
  } catch (e) {
    console.error('Error loading history:', e);
  }
  return [];
}

export function saveMealHistoryToStorage(history: MealHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export function addMealToHistory(name: string, type: 'delivery' | 'cooking', emoji: string, details?: string): MealHistoryItem[] {
  const current = loadMealHistory();
  const now = Date.now();
  const newItem: MealHistoryItem = {
    id: `meal_${now}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    type,
    timestamp: now,
    dateFormatted: formatNiceDate(now),
    timeFormatted: formatNiceTime(now),
    details,
    emoji,
  };
  const updated = [newItem, ...current];
  saveMealHistoryToStorage(updated);
  return updated;
}

export function deleteMealFromHistory(id: string): MealHistoryItem[] {
  const current = loadMealHistory();
  const updated = current.filter(item => item.id !== id);
  saveMealHistoryToStorage(updated);
  return updated;
}

export function clearMealHistory(): MealHistoryItem[] {
  saveMealHistoryToStorage([]);
  return [];
}

export function getRecentHistoryMealNames(history: MealHistoryItem[]): string[] {
  const now = Date.now();
  return history
    .filter(item => (now - item.timestamp) <= FOUR_DAYS_MS)
    .map(item => item.name.toLowerCase().trim());
}

export function loadExclusions(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EXCLUSIONS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading exclusions:', e);
  }
  return [];
}

export function saveExclusionsToStorage(exclusions: string[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.EXCLUSIONS, JSON.stringify(exclusions));
  } catch (e) {
    console.error('Error saving exclusions:', e);
  }
}

export function loadRerollsState(): { remaining: number; date: string } {
  const today = getTodayDateString();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REROLLS);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.date === today) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error loading rerolls:', e);
  }
  const fresh = { remaining: MAX_DAILY_REROLLS, date: today };
  localStorage.setItem(STORAGE_KEYS.REROLLS, JSON.stringify(fresh));
  return fresh;
}

export function decrementRerolls(): number {
  const state = loadRerollsState();
  const updatedRemaining = Math.max(0, state.remaining - 1);
  const updated = { remaining: updatedRemaining, date: state.date };
  localStorage.setItem(STORAGE_KEYS.REROLLS, JSON.stringify(updated));
  return updatedRemaining;
}

export function resetRerollsToMax(): number {
  const today = getTodayDateString();
  const reset = { remaining: MAX_DAILY_REROLLS, date: today };
  localStorage.setItem(STORAGE_KEYS.REROLLS, JSON.stringify(reset));
  return MAX_DAILY_REROLLS;
}

// --- FAVORITES ENGINE & STORAGE ---

export function loadFavorites(): UserFavoriteMeal[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading favorites:', e);
  }
  // Default starter favorites for quick inspiration if empty
  return [
    {
      id: 'fav_default_1',
      name: 'Milanesa con puré de papas',
      category: 'typical',
      priceLevel: '$$',
      deliveryTime: '25-35 min',
      tags: ['Favorito', 'Minutas', 'Carne', 'Casero'],
      description: 'Clásico infalible con carne tierna empanada y puré suave.',
      ingredients: ['bife', 'carne_roja', 'papa', 'huevos', 'manteca', 'leche'],
      imageEmoji: '🥩',
      caloriesApprox: '~720 kcal',
      vibe: 'El confort total para cualquier almuerzo o cena.',
      source: 'custom',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'fav_default_2',
      name: 'Pizza Napolitana a la leña',
      category: 'typical',
      priceLevel: '$$',
      deliveryTime: '30-40 min',
      tags: ['Favorito', 'Pizza', 'Queso', 'Amigos'],
      description: 'Masa crujiente con mozzarella derretida, tomate fresco y albahaca.',
      ingredients: ['queso', 'salsa_tomate', 'harina', 'aceite'],
      imageEmoji: '🍕',
      caloriesApprox: '~680 kcal',
      vibe: 'Infaltable para el fin de semana o una noche de relax.',
      source: 'delivery',
      createdAt: Date.now() - 86400000,
    }
  ];
}

export function saveFavoritesToStorage(favorites: UserFavoriteMeal[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (e) {
    console.error('Error saving favorites:', e);
  }
}

/**
 * Intelligent Auto-Inference Engine for Quick Dish Creation
 * Analyzes free-text input and infers Emoji, Category, Tags, Price, Time & Ingredients.
 */
export function inferMealAttributes(rawName: string): {
  emoji: string;
  category: 'cheat_meal' | 'typical' | 'healthy' | 'economic';
  tags: string[];
  ingredients: string[];
  priceLevel: '$' | '$$' | '$$$';
  deliveryTime: string;
  vibe: string;
  description: string;
} {
  const lower = rawName.toLowerCase();

  // 1. Infer Emoji
  let emoji = '🍽️';
  if (/burg|hamburg|cheeseburg|smash|medallon/.test(lower)) emoji = '🍔';
  else if (/pizz|fugazz|muzzar|faina/.test(lower)) emoji = '🍕';
  else if (/sushi|roll|sashimi|nigiri|poke|maki/.test(lower)) emoji = '🍣';
  else if (/taco|burrito|quesadill|fajita|nacho|mexic/.test(lower)) emoji = '🌮';
  else if (/past|fideo|spaghett|tallarin|raviol|lasa[ñn]|ñoqui|fettucc|gnocchi|penne/.test(lower)) emoji = '🍝';
  else if (/ensalad|salad|cesar|caesar|bowl verde|verde|hojas/.test(lower)) emoji = '🥗';
  else if (/milan|milanga|bife|asado|carne|vacio|entraña|tira|costill|steak|lomo/.test(lower)) emoji = '🥩';
  else if (/pollo|chicken|pechuga|alitas|crispy|nugget|muslo/.test(lower)) emoji = '🍗';
  else if (/pescad|salmon|salmón|atun|atún|merluza|ceviche|camaron|marisc|rabas/.test(lower)) emoji = '🐟';
  else if (/empanad|empanaditas|tarta/.test(lower)) emoji = '🥟';
  else if (/sandw|sándw|lomit|tostad|bagel|chivito|pepito/.test(lower)) emoji = '🥪';
  else if (/arroz|paella|risotto|curry|wok|chaufa|yakimeshi/.test(lower)) emoji = '🍚';
  else if (/sopa|guiso|ramen|cazuela|locro|lentej|caldo/.test(lower)) emoji = '🍲';
  else if (/postre|helad|torta|pastel|alfajor|brownie|waffle|pancake/.test(lower)) emoji = '🍨';
  else if (/wrap|shawarma|kebab|falafel/.test(lower)) emoji = '🌯';
  else if (/papa|papas fritas|pure|puré|fritas/.test(lower)) emoji = '🍟';
  else if (/huevo|omelette|revuelto|tortilla/.test(lower)) emoji = '🍳';

  // 2. Infer Category
  let category: 'cheat_meal' | 'typical' | 'healthy' | 'economic' = 'typical';
  if (/ensalad|salad|poke|sushi|verdura|grill|salm[oó]n|at[uú]n|avena|fit|saludable|vegan|veggie|liviano/.test(lower)) {
    category = 'healthy';
  } else if (/burg|hamburg|pizz|frito|fritas|bacon|cheddar|lomit|alitas|nachos|postre|helad|torta|cheat/.test(lower)) {
    category = 'cheat_meal';
  } else if (/arroz|fideo|tortilla|huevo|sopa|guiso|lentej|econ[oó]mic|barat|express/.test(lower)) {
    category = 'economic';
  }

  // 3. Infer Ingredients
  const ingredients: string[] = [];
  if (/poll|pechuga|muslo|alitas/.test(lower)) ingredients.push('pollo');
  if (/carne|bife|asado|lomo|vacio|picada|molida|entraña|costill/.test(lower)) {
    ingredients.push('carne_roja');
    if (/picada|molida|burg/.test(lower)) ingredients.push('carne_picada');
    if (/bife|lomo|asado/.test(lower)) ingredients.push('bife');
  }
  if (/pescad|merluza|salmon|salmón|ceviche/.test(lower)) ingredients.push('pescado');
  if (/atun|atún/.test(lower)) ingredients.push('atun');
  if (/cerdo|panceta|bacon|bondiola|jamon|jamón/.test(lower)) {
    ingredients.push('cerdo');
    if (/jamon|jamón/.test(lower)) ingredients.push('jamon');
  }
  if (/huevo|omelette|revuelto|tortilla/.test(lower)) ingredients.push('huevos');
  if (/queso|mozzar|cheddar|parmes|ricotta/.test(lower)) ingredients.push('queso');
  if (/arroz|risotto|paella|wok/.test(lower)) ingredients.push('arroz');
  if (/fideo|past|spaghett|raviol|lasa[ñn]|ñoqui/.test(lower)) ingredients.push('fideos');
  if (/papa|pur[eé]|fritas/.test(lower)) ingredients.push('papa');
  if (/pan|taco|wrap|tortilla harina|lomit|sandw/.test(lower)) ingredients.push('pan_tacos');
  if (/tomate|pomodoro|salsa tomate|tuco/.test(lower)) ingredients.push('tomate', 'salsa_tomate');
  if (/cebolla|fugazz/.test(lower)) ingredients.push('cebolla');
  if (/palta|aguacate|guacamole/.test(lower)) ingredients.push('palta');
  if (/lechuga|rucula|rúcula|verde|ensalad/.test(lower)) ingredients.push('lechuga');
  if (/champin|champiñ|hongo/.test(lower)) ingredients.push('champinones');
  if (/ajo|al ajillo/.test(lower)) ingredients.push('ajo');
  if (/soja|teriyaki/.test(lower)) ingredients.push('salsa_soja');
  if (/crema/.test(lower)) ingredients.push('crema');

  if (ingredients.length === 0) {
    ingredients.push('aceite', 'especias');
  }

  // 4. Infer Tags
  const tags: string[] = ['Favorito'];
  if (category === 'healthy') tags.push('Saludable', 'Nutritivo');
  else if (category === 'cheat_meal') tags.push('Cheat Meal', 'Reconfortante');
  else if (category === 'economic') tags.push('Económico', 'Rápido');
  else tags.push('Minutas', 'Casero');

  if (/carne|bife|asado|milan/.test(lower)) tags.push('Carne');
  if (/poll/.test(lower)) tags.push('Pollo');
  if (/past|fideo/.test(lower)) tags.push('Pasta');
  if (/pescad|sushi|salmon/.test(lower)) tags.push('Pescado');
  if (/pizz/.test(lower)) tags.push('Pizza');
  if (/burg/.test(lower)) tags.push('Burger');

  // 5. Price & Time
  let priceLevel: '$' | '$$' | '$$$' = '$$';
  if (category === 'economic') priceLevel = '$';
  else if (/sushi|salmon|asado|gourmet|marisc/.test(lower)) priceLevel = '$$$';

  const deliveryTime = category === 'economic' || /express|rapido|sandw/.test(lower) 
    ? '20-30 min' 
    : '25-40 min';

  const vibe = `Tu plato personalizado favorito: ${rawName}. Siempre satisface el antojo.`;
  const description = `Plato personalizado guardado en tu recetario favorito.`;

  return {
    emoji,
    category,
    tags: Array.from(new Set(tags)),
    ingredients: Array.from(new Set(ingredients)),
    priceLevel,
    deliveryTime,
    vibe,
    description,
  };
}

export function createFavoriteFromInput(name: string): UserFavoriteMeal {
  const trimmed = name.trim();
  const inferred = inferMealAttributes(trimmed);
  return {
    id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: trimmed,
    category: inferred.category,
    priceLevel: inferred.priceLevel,
    deliveryTime: inferred.deliveryTime,
    tags: inferred.tags,
    description: inferred.description,
    ingredients: inferred.ingredients,
    imageEmoji: inferred.emoji,
    vibe: inferred.vibe,
    source: 'custom',
    createdAt: Date.now(),
  };
}

export function createFavoriteFromDeliveryOption(option: DeliveryOption): UserFavoriteMeal {
  return {
    id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: option.name,
    category: option.category,
    priceLevel: option.priceLevel,
    deliveryTime: option.deliveryTime,
    tags: ['Favorito', ...option.tags.filter(t => t !== 'Favorito')],
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
    id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: recipe.name,
    category: recipe.category === 'Pollo' || recipe.category === 'Pescado' || recipe.category === 'Vegetariano' 
      ? 'healthy' 
      : recipe.category === 'Pasta' || recipe.category === 'Carne' 
      ? 'typical' 
      : 'economic',
    priceLevel: '$$',
    deliveryTime: `${recipe.prepTime + recipe.cookTime} min cocina`,
    tags: ['Favorito', 'Casero', recipe.category, recipe.difficulty],
    description: `Receta casera: ${recipe.steps[0].slice(0, 70)}...`,
    ingredients: recipe.requiredIngredients,
    imageEmoji: recipe.imageEmoji,
    caloriesApprox: recipe.caloriesApprox,
    vibe: recipe.chefTip || 'Receta casera favorita para disfrutar en casa.',
    source: 'cooking',
    createdAt: Date.now(),
  };
}

export function addFavoriteMeal(meal: UserFavoriteMeal): UserFavoriteMeal[] {
  const current = loadFavorites();
  // Check if duplicate name
  const existingIdx = current.findIndex(f => f.name.toLowerCase().trim() === meal.name.toLowerCase().trim());
  let updated: UserFavoriteMeal[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = meal;
  } else {
    updated = [meal, ...current];
  }
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

// Convert a UserFavoriteMeal into a DeliveryOption so it can spin seamlessly in roulette
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

// --- FILTERING & ALGORITHMS ---

export function getEligibleDeliveryOptions(
  category: DeliveryCategory,
  exclusions: string[],
  history: MealHistoryItem[],
  onlyFavorites: boolean = false,
  favoritesList: UserFavoriteMeal[] = []
): DeliveryOption[] {
  const recentNames = getRecentHistoryMealNames(history);
  const lowerExclusions = exclusions.map(e => e.toLowerCase());

  // Base pool determination:
  // If onlyFavorites is enabled, convert all user favorites to DeliveryOption pool
  // If not, combine DELIVERY_DATASET with any custom user favorites
  let basePool: DeliveryOption[];

  if (onlyFavorites) {
    basePool = favoritesList.map(favoriteToDeliveryOption);
  } else {
    // Combine standard dataset with user's custom created favorites so their custom creations are also present in catalog
    const customFavoritesAsOptions = favoritesList
      .filter(f => f.source === 'custom')
      .map(favoriteToDeliveryOption);

    // Merge without exact duplicates by name
    const existingNames = new Set(DELIVERY_DATASET.map(d => d.name.toLowerCase().trim()));
    const nonDuplicateCustoms = customFavoritesAsOptions.filter(
      c => !existingNames.has(c.name.toLowerCase().trim())
    );

    basePool = [...DELIVERY_DATASET, ...nonDuplicateCustoms];
  }

  const eligible = basePool.filter(option => {
    // Category check
    if (category !== 'all' && option.category !== category) {
      return false;
    }

    // Exclusions check
    const hasExcludedIngredient = option.ingredients.some(ing => 
      lowerExclusions.includes(ing.toLowerCase())
    );
    if (hasExcludedIngredient) return false;

    // Check tags against exclusions
    const hasExcludedTag = option.tags.some(tag => 
      lowerExclusions.includes(tag.toLowerCase())
    );
    if (hasExcludedTag) return false;

    // Exclude if eaten in the last 4 days
    const wasEatenRecently = recentNames.some(name => 
      name.includes(option.name.toLowerCase()) || option.name.toLowerCase().includes(name)
    );
    if (wasEatenRecently) return false;

    return true;
  });

  // Fallback: If everything in the pool was eaten in last 4 days, return without the 4-day block (still respecting exclusions & category)
  if (eligible.length === 0) {
    return basePool.filter(option => {
      if (category !== 'all' && option.category !== category) return false;
      const hasExcluded = option.ingredients.some(ing => lowerExclusions.includes(ing.toLowerCase())) ||
        option.tags.some(tag => lowerExclusions.includes(tag.toLowerCase()));
      return !hasExcluded;
    });
  }

  return eligible;
}

export function matchRecipesWithPantry(
  pantry: string[],
  exclusions: string[],
  history: MealHistoryItem[]
): MatchResult[] {
  const lowerExclusions = exclusions.map(e => e.toLowerCase());
  const recentNames = getRecentHistoryMealNames(history);

  const results: MatchResult[] = [];

  for (const recipe of RECIPES_DATASET) {
    // Check exclusions
    const hasExcluded = recipe.requiredIngredients.some(ing => lowerExclusions.includes(ing.toLowerCase())) ||
      recipe.tags.some(tag => lowerExclusions.includes(tag.toLowerCase()));
    
    if (hasExcluded) continue;

    // Required match
    const requiredTotal = recipe.requiredIngredients.length;
    const requiredMatched = recipe.requiredIngredients.filter(id => pantry.includes(id));
    const missingRequired = recipe.requiredIngredients.filter(id => !pantry.includes(id));

    // Optional match
    const optionalMatched = recipe.optionalIngredients.filter(id => pantry.includes(id));
    const optionalTotal = recipe.optionalIngredients.length;
    const optionalRatio = optionalTotal > 0 ? optionalMatched.length / optionalTotal : 1;

    let matchPercentage: number;
    if (requiredTotal === 0 || missingRequired.length === 0) {
      // 100% Match: All required ingredients are in the user's pantry!
      matchPercentage = 100;
    } else {
      // Partial match: calculate exact percentage
      const requiredRatio = requiredMatched.length / requiredTotal;
      matchPercentage = Math.min(95, Math.round((requiredRatio * 80) + (optionalRatio * 20)));
    }

    const allMatched = [...requiredMatched, ...optionalMatched];
    const missing = missingRequired;

    // Check if eaten in last 4 days
    const wasEatenRecently = recentNames.some(name => 
      name.includes(recipe.name.toLowerCase()) || recipe.name.toLowerCase().includes(name)
    );

    // Apply minor sorting penalty if eaten recently
    const sortingScore = wasEatenRecently ? matchPercentage - 30 : matchPercentage;

    results.push({
      recipe,
      matchPercentage,
      matchedIngredients: allMatched,
      missingIngredients: missing,
      missingCount: missingRequired.length,
    });
  }

  // Sort by highest match percentage and least missing ingredients
  results.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.missingCount - b.missingCount;
  });

  return results;
}

export function getPantryItemName(id: string): string {
  const all = getAllPantryItems();
  const item = all.find(p => p.id === id);
  if (item) return item.name;
  return id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ');
}

export function getPantryItemEmoji(id: string): string {
  const all = getAllPantryItems();
  const item = all.find(p => p.id === id);
  return item ? item.emoji : '🥄';
}

// --- UNIFIED TINDER SWIPE DECK DATASET ---
export function getUnifiedCardDataset(
  modality: ModalityFilter = 'all',
  category: FoodCategoryFilter = 'all',
  exclusions: string[] = [],
  history: MealHistoryItem[] = [],
  favorites: UserFavoriteMeal[] = []
): MealCardItem[] {
  const deletedIds = loadDeletedMealIds();
  const customMeals = loadCustomMeals();
  const allDelivery = [...DELIVERY_DATASET, ...customMeals.delivery].filter(d => !deletedIds.includes(d.id));
  const allRecipes = [...RECIPES_DATASET, ...customMeals.recipes].filter(r => !deletedIds.includes(r.id));

  const filteredDelivery = allDelivery.filter(d => {
    const hasExcluded = d.ingredients.some(ing => exclusions.includes(ing.toLowerCase().trim()));
    if (hasExcluded) return false;
    return true;
  });

  const filteredRecipes = allRecipes.filter(recipe => {
    const hasExcluded = recipe.requiredIngredients.some(id => exclusions.includes(id.toLowerCase().trim()));
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

  // 1. Delivery Options (included if modality is 'all' or 'delivery')
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

  // 2. Cooking Recipes (included if modality is 'all' or 'cooking')
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
  favorites.forEach(f => {
    const isFavCooking = f.source === 'cooking';
    if (
      (modality === 'all') ||
      (modality === 'cooking' && isFavCooking) ||
      (modality === 'delivery' && !isFavCooking)
    ) {
      cards.push({
        id: f.id,
        name: f.name,
        type: isFavCooking ? 'cooking' : 'delivery',
        categoryLabel: '⭐ Tu Favorito Personal',
        timeEstimate: f.deliveryTime || '20-30 min',
        tags: ['Favorito', ...f.tags],
        description: f.description || 'Guardado en tu lista personal de favoritos.',
        ingredientsSummary: f.ingredients.map(getPantryItemName),
        imageEmoji: f.imageEmoji,
        caloriesApprox: f.caloriesApprox,
        vibe: f.vibe || 'Uno de tus platos predilectos.',
      });
    }
  });

  return cards.sort(() => Math.random() - 0.5);
}

export type DeliveryApp = 'pedidosya' | 'rappi' | 'google';

export function loadDefaultDeliveryApp(): DeliveryApp {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DEFAULT_DELIVERY_APP);
    if (saved === 'pedidosya' || saved === 'rappi' || saved === 'google') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'pedidosya';
}

export function saveDefaultDeliveryApp(app: DeliveryApp): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_DELIVERY_APP, app);
  } catch {
    // ignore
  }
}

export function getDeliverySearchUrl(dishName: string): string {
  const app = loadDefaultDeliveryApp();
  const query = encodeURIComponent(dishName);
  if (app === 'pedidosya') {
    return `https://www.pedidosya.com.ar/restaurantes?q=${query}`;
  }
  if (app === 'rappi') {
    return `https://www.rappi.com.ar/search?query=${query}`;
  }
  return `https://www.google.com/search?q=${query}+delivery+pedir`;
}

// --- BLIND DECISION PICKER (EXCLUDES DESSERTS & SWEETS) ---
export function pickBlindDecisionMeal(
  exclusions: string[],
  history: MealHistoryItem[],
  favorites: UserFavoriteMeal[]
): MealCardItem {
  // Exclude desserts and sweets from "Tengo Hambre"
  const allCards = getUnifiedCardDataset('all', 'all', exclusions, history, favorites);
  const savoryCards = allCards.filter(card => {
    const isDessert = card.tags.some(t => /postre|golosina|helado|torta|dulce|alfajor|flan|panqueque|chocotorta/i.test(t)) ||
      (card.categoryLabel && /postre|dulce/i.test(card.categoryLabel));
    return !isDessert;
  });

  const pool = savoryCards.length > 0 ? savoryCards : allCards;

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

// --- WEEKLY PLAN GENERATION & STORAGE ---
const DAYS_OF_WEEK: { id: DayPlan['dayId']; name: string }[] = [
  { id: 'lunes', name: 'Lunes' },
  { id: 'martes', name: 'Martes' },
  { id: 'miercoles', name: 'Miércoles' },
  { id: 'jueves', name: 'Jueves' },
  { id: 'viernes', name: 'Viernes' },
  { id: 'sabado', name: 'Sábado' },
  { id: 'domingo', name: 'Domingo' },
];

export function loadWeeklyPlan(): WeeklyPlan | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEKLY_PLAN);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading weekly plan:', e);
  }
  return null;
}

export function saveWeeklyPlan(plan: WeeklyPlan) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error('Error saving weekly plan:', e);
  }
}

export function createSlotFromRecipe(r: Recipe): MealPlanSlot {
  return {
    id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    mealName: r.name,
    type: 'cooking',
    emoji: r.imageEmoji,
    category: `Cocina (${r.category})`,
    timeEstimate: `${r.prepTime + r.cookTime} min`,
    caloriesApprox: r.caloriesApprox,
    recipeId: r.id,
    isEaten: false,
  };
}

export function createSlotFromDelivery(d: DeliveryOption): MealPlanSlot {
  return {
    id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    mealName: d.name,
    type: 'delivery',
    emoji: d.imageEmoji,
    category: d.category === 'cheat_meal' ? 'Delivery Cheat' : 'Delivery Típico',
    timeEstimate: d.deliveryTime,
    caloriesApprox: d.caloriesApprox,
    deliveryId: d.id,
    isEaten: false,
  };
}

export function generateFullWeeklyPlan(
  exclusions: string[],
  history: MealHistoryItem[]
): WeeklyPlan {
  const availableRecipes = RECIPES_DATASET.filter(r => !r.requiredIngredients.some(i => exclusions.includes(i)));
  const availableDelivery = DELIVERY_DATASET.filter(d => !d.ingredients.some(i => exclusions.includes(i)));

  // Shuffle pools
  const recipePool = [...availableRecipes].sort(() => Math.random() - 0.5);
  const deliveryPool = [...availableDelivery].sort(() => Math.random() - 0.5);

  let recipeIdx = 0;
  let deliveryIdx = 0;

  const plan: WeeklyPlan = DAYS_OF_WEEK.map((day, dayIndex) => {
    // Balanced distribution:
    // Weekday lunches: mainly quick cooking/healthy
    // Friday/Saturday dinners: delivery/cheat meals
    // Sunday dinner: comfort delivery or easy pasta
    let lunchSlot: MealPlanSlot;
    let dinnerSlot: MealPlanSlot;

    // Lunch: Cooking recipe
    const lunchRecipe = recipePool[recipeIdx % recipePool.length];
    recipeIdx++;
    lunchSlot = createSlotFromRecipe(lunchRecipe);

    // Dinner:
    if (day.id === 'viernes' || day.id === 'sabado' || dayIndex % 3 === 2) {
      const delItem = deliveryPool[deliveryIdx % deliveryPool.length];
      deliveryIdx++;
      dinnerSlot = createSlotFromDelivery(delItem);
    } else {
      const dinnerRecipe = recipePool[recipeIdx % recipePool.length];
      recipeIdx++;
      dinnerSlot = createSlotFromRecipe(dinnerRecipe);
    }

    return {
      dayId: day.id,
      dayName: day.name,
      lunch: lunchSlot,
      dinner: dinnerSlot,
    };
  });

  saveWeeklyPlan(plan);
  return plan;
}

export function rerollSingleSlot(
  type: 'cooking' | 'delivery' | 'any',
  exclusions: string[],
  currentMealName: string
): MealPlanSlot {
  const availableRecipes = RECIPES_DATASET.filter(r => 
    !r.requiredIngredients.some(i => exclusions.includes(i)) && r.name !== currentMealName
  );
  const availableDelivery = DELIVERY_DATASET.filter(d => 
    !d.ingredients.some(i => exclusions.includes(i)) && d.name !== currentMealName
  );

  if (type === 'cooking' || (type === 'any' && Math.random() > 0.4)) {
    const randomR = availableRecipes[Math.floor(Math.random() * availableRecipes.length)] || RECIPES_DATASET[0];
    return createSlotFromRecipe(randomR);
  } else {
    const randomD = availableDelivery[Math.floor(Math.random() * availableDelivery.length)] || DELIVERY_DATASET[0];
    return createSlotFromDelivery(randomD);
  }
}
