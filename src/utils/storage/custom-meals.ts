import { DeliveryOption, Recipe } from '../../types';
import { DELIVERY_DATASET, RECIPES_DATASET } from '../../data/mealsData';
import { safeGet, safeSet, STORAGE_KEYS } from './persistence';

export interface CustomMealsStorage {
  customDelivery: DeliveryOption[];
  customRecipes: Recipe[];
}

export function loadCustomMeals(): CustomMealsStorage {
  return safeGet<CustomMealsStorage>(STORAGE_KEYS.CUSTOM_MEALS, {
    customDelivery: [],
    customRecipes: [],
  });
}

export function saveCustomDeliveryMeal(meal: DeliveryOption): CustomMealsStorage {
  const current = loadCustomMeals();
  const existingIdx = current.customDelivery.findIndex(d => d.id === meal.id);
  let updatedDelivery: DeliveryOption[];
  if (existingIdx >= 0) {
    updatedDelivery = [...current.customDelivery];
    updatedDelivery[existingIdx] = meal;
  } else {
    updatedDelivery = [meal, ...current.customDelivery];
  }
  const updated: CustomMealsStorage = {
    ...current,
    customDelivery: updatedDelivery,
  };
  safeSet(STORAGE_KEYS.CUSTOM_MEALS, updated);
  return updated;
}

export function saveCustomRecipeMeal(recipe: Recipe): CustomMealsStorage {
  const current = loadCustomMeals();
  const existingIdx = current.customRecipes.findIndex(r => r.id === recipe.id);
  let updatedRecipes: Recipe[];
  if (existingIdx >= 0) {
    updatedRecipes = [...current.customRecipes];
    updatedRecipes[existingIdx] = recipe;
  } else {
    updatedRecipes = [recipe, ...current.customRecipes];
  }
  const updated: CustomMealsStorage = {
    ...current,
    customRecipes: updatedRecipes,
  };
  safeSet(STORAGE_KEYS.CUSTOM_MEALS, updated);
  return updated;
}

export function deleteCustomMeal(id: string): CustomMealsStorage {
  const current = loadCustomMeals();
  const updated: CustomMealsStorage = {
    customDelivery: current.customDelivery.filter(d => d.id !== id),
    customRecipes: current.customRecipes.filter(r => r.id !== id),
  };
  safeSet(STORAGE_KEYS.CUSTOM_MEALS, updated);
  return updated;
}

export function loadDeletedMealIds(): string[] {
  return safeGet<string[]>(STORAGE_KEYS.DELETED_MEALS, []);
}

export function deleteAnyMeal(id: string): void {
  deleteCustomMeal(id);
  const deletedIds = loadDeletedMealIds();
  if (!deletedIds.includes(id)) {
    const updated = [...deletedIds, id];
    safeSet(STORAGE_KEYS.DELETED_MEALS, updated);
  }
}

export function restoreDeletedMeal(id: string): void {
  const deletedIds = loadDeletedMealIds();
  const updated = deletedIds.filter(deletedId => deletedId !== id);
  safeSet(STORAGE_KEYS.DELETED_MEALS, updated);
}

export function getMergedRecipes(): Recipe[] {
  const custom = loadCustomMeals();
  const deletedIds = loadDeletedMealIds();
  const activePresets = RECIPES_DATASET.filter(r => !deletedIds.includes(r.id));
  const activeCustom = custom.customRecipes.filter(r => !deletedIds.includes(r.id));
  return [...activeCustom, ...activePresets];
}

export function getMergedDelivery(): DeliveryOption[] {
  const custom = loadCustomMeals();
  const deletedIds = loadDeletedMealIds();
  const activePresets = DELIVERY_DATASET.filter(d => !deletedIds.includes(d.id));
  const activeCustom = custom.customDelivery.filter(d => !deletedIds.includes(d.id));
  return [...activeCustom, ...activePresets];
}

export function getAllCatalogMeals(): { delivery: DeliveryOption[]; recipes: Recipe[]; customCount: number } {
  const custom = loadCustomMeals();
  const mergedRecipes = getMergedRecipes();
  const mergedDelivery = getMergedDelivery();
  const customCount = custom.customDelivery.length + custom.customRecipes.length;
  return {
    delivery: mergedDelivery,
    recipes: mergedRecipes,
    customCount,
  };
}
