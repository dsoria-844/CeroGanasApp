import { DayPlan, DeliveryOption, MealHistoryItem, MealPlanSlot, Recipe, WeeklyPlan } from '../../types';
import { DELIVERY_DATASET, RECIPES_DATASET } from '../../data/mealsData';
import { safeGet, safeSet, STORAGE_KEYS, generateUUID } from './persistence';

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
  exclusions: string[],
  history: MealHistoryItem[]
): WeeklyPlan {
  const availableRecipes = RECIPES_DATASET.filter(r => !r.requiredIngredients.some(i => exclusions.includes(i)));
  const availableDelivery = DELIVERY_DATASET.filter(d => !d.ingredients.some(i => exclusions.includes(i)));

  const recipePool = [...availableRecipes].sort(() => Math.random() - 0.5);
  const deliveryPool = [...availableDelivery].sort(() => Math.random() - 0.5);

  let recipeIdx = 0;
  let deliveryIdx = 0;

  const plan: WeeklyPlan = DAYS_OF_WEEK.map((day, dayIndex) => {
    let lunchSlot: MealPlanSlot;
    let dinnerSlot: MealPlanSlot;

    // Lunch: Cooking recipe
    const lunchRecipe = recipePool[recipeIdx % recipePool.length];
    recipeIdx++;
    lunchSlot = createSlotFromRecipe(lunchRecipe);

    // Dinner: Delivery on weekends or alternate
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
