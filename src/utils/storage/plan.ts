import { DayPlan, DeliveryOption, MealHistoryItem, MealPlanSlot, Recipe, WeeklyPlan } from '../../types';
import { DELIVERY_DATASET, RECIPES_DATASET } from '../../data/mealsData';
import { safeGet, safeSet, STORAGE_KEYS, generateUUID } from './persistence';
import { getRecentHistoryMealNames } from './history';

export const DAYS_OF_WEEK: { id: DayPlan['dayId']; name: string }[] = [
  { id: 'lunes', name: 'Lunes' },
  { id: 'martes', name: 'Martes' },
  { id: 'miercoles', name: 'Miércoles' },
  { id: 'jueves', name: 'Jueves' },
  { id: 'viernes', name: 'Viernes' },
  { id: 'sabado', name: 'Sábado' },
  { id: 'domingo', name: 'Domingo' },
];

export function createEmptySlot(): MealPlanSlot {
  return {
    id: generateUUID('slot_'),
    mealName: '',
    type: 'cooking',
    emoji: '🍽️',
    category: 'Sin planificar',
    timeEstimate: '',
    isEaten: false,
  };
}

export function createEmptyWeeklyPlan(): WeeklyPlan {
  return DAYS_OF_WEEK.map(day => ({
    dayId: day.id,
    dayName: day.name,
    lunch: createEmptySlot(),
    dinner: createEmptySlot(),
  }));
}

export function isSlotEmpty(slot?: MealPlanSlot | null): boolean {
  return !slot || !slot.mealName || slot.mealName.trim() === '';
}

export function isWeeklyPlanEmpty(plan?: WeeklyPlan | null): boolean {
  if (!plan || !Array.isArray(plan) || plan.length === 0) return true;
  return plan.every(day => isSlotEmpty(day.lunch) && isSlotEmpty(day.dinner));
}

export function clearWeeklyPlan(): WeeklyPlan {
  const emptyPlan = createEmptyWeeklyPlan();
  saveWeeklyPlan(emptyPlan);
  return emptyPlan;
}

export function assignMealToSlot(
  plan: WeeklyPlan,
  dayId: DayPlan['dayId'],
  slotType: 'lunch' | 'dinner',
  meal: {
    name: string;
    type: 'cooking' | 'delivery';
    emoji: string;
    category?: string;
    timeEstimate?: string;
    caloriesApprox?: string;
    recipeId?: string;
    deliveryId?: string;
  }
): { updatedPlan: WeeklyPlan; replacedMealName?: string; isDuplicateDay?: boolean } {
  const currentPlan = Array.isArray(plan) && plan.length === 7 ? plan : createEmptyWeeklyPlan();
  let replacedMealName: string | undefined = undefined;
  let isDuplicateDay: boolean = false;

  const updatedPlan: WeeklyPlan = currentPlan.map(day => {
    if (day.dayId !== dayId) return day;

    const otherSlot = slotType === 'lunch' ? day.dinner : day.lunch;
    if (!isSlotEmpty(otherSlot) && otherSlot.mealName.toLowerCase().trim() === meal.name.toLowerCase().trim()) {
      isDuplicateDay = true;
    }

    const currentSlot = day[slotType];
    if (!isSlotEmpty(currentSlot)) {
      replacedMealName = currentSlot.mealName;
    }

    const newSlot: MealPlanSlot = {
      id: generateUUID('slot_'),
      mealName: meal.name,
      type: meal.type,
      emoji: meal.emoji || (meal.type === 'cooking' ? '🍳' : '🛵'),
      category: meal.category || (meal.type === 'cooking' ? 'Cocina' : 'Delivery'),
      timeEstimate: meal.timeEstimate || '25 min',
      caloriesApprox: meal.caloriesApprox,
      recipeId: meal.recipeId,
      deliveryId: meal.deliveryId,
      isEaten: false,
    };

    return {
      ...day,
      [slotType]: newSlot,
    };
  });

  saveWeeklyPlan(updatedPlan);
  return { updatedPlan, replacedMealName, isDuplicateDay };
}

export function loadWeeklyPlan(): WeeklyPlan | null {
  return safeGet<WeeklyPlan | null>(STORAGE_KEYS.WEEKLY_PLAN, null);
}

export function saveWeeklyPlan(plan: WeeklyPlan) {
  safeSet(STORAGE_KEYS.WEEKLY_PLAN, plan);
}

export function createSlotFromRecipe(r: Recipe): MealPlanSlot {
  return {
    id: generateUUID('slot_'),
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
    id: generateUUID('slot_'),
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
  exclusions: string[] = [],
  history: MealHistoryItem[] = []
): WeeklyPlan {
  const safeExclusions = Array.isArray(exclusions) ? exclusions.map(e => (e || '').toLowerCase().trim()) : [];
  const safeHistory = Array.isArray(history) ? history : [];
  const recentMealNames = getRecentHistoryMealNames(safeHistory);

  const availableRecipes = RECIPES_DATASET.filter(r => {
    if (!r) return false;
    const req = r.requiredIngredients || [];
    const tags = r.tags || [];
    return !req.some(i => safeExclusions.includes((i || '').toLowerCase().trim())) &&
           !tags.some(t => safeExclusions.includes((t || '').toLowerCase().trim()));
  });

  const availableDelivery = DELIVERY_DATASET.filter(d => {
    if (!d) return false;
    const ings = d.ingredients || [];
    const tags = d.tags || [];
    return !ings.some(i => safeExclusions.includes((i || '').toLowerCase().trim())) &&
           !tags.some(t => safeExclusions.includes((t || '').toLowerCase().trim()));
  });

  // Prefer items not recently eaten if possible
  const recipePool = [...availableRecipes].sort((a, b) => {
    const aRecent = recentMealNames.includes((a.name || '').toLowerCase().trim()) ? 1 : 0;
    const bRecent = recentMealNames.includes((b.name || '').toLowerCase().trim()) ? 1 : 0;
    if (aRecent !== bRecent) return aRecent - bRecent;
    return Math.random() - 0.5;
  });

  const deliveryPool = [...availableDelivery].sort((a, b) => {
    const aRecent = recentMealNames.includes((a.name || '').toLowerCase().trim()) ? 1 : 0;
    const bRecent = recentMealNames.includes((b.name || '').toLowerCase().trim()) ? 1 : 0;
    if (aRecent !== bRecent) return aRecent - bRecent;
    return Math.random() - 0.5;
  });

  let recipeIdx = 0;
  let deliveryIdx = 0;

  const plan: WeeklyPlan = DAYS_OF_WEEK.map((day, dayIndex) => {
    let lunchSlot: MealPlanSlot;
    let dinnerSlot: MealPlanSlot;

    // Pick Lunch
    if (recipePool.length > 0) {
      const lunchRecipe = recipePool[recipeIdx % recipePool.length];
      recipeIdx++;
      lunchSlot = createSlotFromRecipe(lunchRecipe);
    } else if (deliveryPool.length > 0) {
      const lunchDelivery = deliveryPool[deliveryIdx % deliveryPool.length];
      deliveryIdx++;
      lunchSlot = createSlotFromDelivery(lunchDelivery);
    } else {
      lunchSlot = createEmptySlot();
    }

    // Pick Dinner
    const preferDelivery = (day.id === 'viernes' || day.id === 'sabado' || dayIndex % 3 === 2);
    if (preferDelivery && deliveryPool.length > 0) {
      const delItem = deliveryPool[deliveryIdx % deliveryPool.length];
      deliveryIdx++;
      dinnerSlot = createSlotFromDelivery(delItem);
    } else if (recipePool.length > 0) {
      let dinnerRecipe = recipePool[recipeIdx % recipePool.length];
      if (recipePool.length > 1 && lunchSlot.mealName && dinnerRecipe.name.toLowerCase().trim() === lunchSlot.mealName.toLowerCase().trim()) {
        recipeIdx++;
        dinnerRecipe = recipePool[recipeIdx % recipePool.length];
      }
      recipeIdx++;
      dinnerSlot = createSlotFromRecipe(dinnerRecipe);
    } else if (deliveryPool.length > 0) {
      const delItem = deliveryPool[deliveryIdx % deliveryPool.length];
      deliveryIdx++;
      dinnerSlot = createSlotFromDelivery(delItem);
    } else {
      dinnerSlot = createEmptySlot();
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
  exclusions: string[] = [],
  currentMealName: string = ''
): MealPlanSlot {
  const safeExclusions = Array.isArray(exclusions) ? exclusions.map(e => (e || '').toLowerCase().trim()) : [];
  const currLower = (currentMealName || '').toLowerCase().trim();

  const availableRecipes = RECIPES_DATASET.filter(r => {
    if (!r) return false;
    const req = r.requiredIngredients || [];
    const tags = r.tags || [];
    const hasExcluded = req.some(i => safeExclusions.includes((i || '').toLowerCase().trim())) ||
      tags.some(t => safeExclusions.includes((t || '').toLowerCase().trim()));
    return !hasExcluded && (r.name || '').toLowerCase().trim() !== currLower;
  });

  const availableDelivery = DELIVERY_DATASET.filter(d => {
    if (!d) return false;
    const ings = d.ingredients || [];
    const tags = d.tags || [];
    const hasExcluded = ings.some(i => safeExclusions.includes((i || '').toLowerCase().trim())) ||
      tags.some(t => safeExclusions.includes((t || '').toLowerCase().trim()));
    return !hasExcluded && (d.name || '').toLowerCase().trim() !== currLower;
  });

  if (type === 'cooking' || (type === 'any' && Math.random() > 0.4)) {
    if (availableRecipes.length > 0) {
      const randomR = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
      return createSlotFromRecipe(randomR);
    }
    const nonExcludedRecipes = RECIPES_DATASET.filter(r => 
      !(r.requiredIngredients || []).some(i => safeExclusions.includes((i || '').toLowerCase().trim()))
    );
    if (nonExcludedRecipes.length > 0) {
      return createSlotFromRecipe(nonExcludedRecipes[0]);
    }
    if (availableDelivery.length > 0) {
      return createSlotFromDelivery(availableDelivery[0]);
    }
    return createEmptySlot();
  } else {
    if (availableDelivery.length > 0) {
      const randomD = availableDelivery[Math.floor(Math.random() * availableDelivery.length)];
      return createSlotFromDelivery(randomD);
    }
    const nonExcludedDelivery = DELIVERY_DATASET.filter(d => 
      !(d.ingredients || []).some(i => safeExclusions.includes((i || '').toLowerCase().trim()))
    );
    if (nonExcludedDelivery.length > 0) {
      return createSlotFromDelivery(nonExcludedDelivery[0]);
    }
    if (availableRecipes.length > 0) {
      return createSlotFromRecipe(availableRecipes[0]);
    }
    return createEmptySlot();
  }
}
