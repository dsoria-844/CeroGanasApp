export type DeliveryCategory = 'all' | 'cheat_meal' | 'typical' | 'healthy' | 'economic';

export interface DeliveryOption {
  id: string;
  name: string;
  category: 'cheat_meal' | 'typical' | 'healthy' | 'economic';
  priceLevel: '$' | '$$' | '$$$';
  deliveryTime: string;
  tags: string[];
  description: string;
  ingredients: string[]; // for exclusion filtering
  imageEmoji: string;
  caloriesApprox: string;
  vibe: string;
}

export interface RecipeIngredient {
  name: string;
  id: string;
  amount?: string;
  optional?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  prepTime: number; // in mins
  cookTime: number; // in mins
  difficulty: 'Fácil' | 'Media' | 'Rápida';
  category: 'Pollo' | 'Carne' | 'Pasta' | 'Pescado' | 'Vegetariano' | 'Express';
  requiredIngredients: string[]; // array of ingredient IDs
  optionalIngredients: string[];
  allIngredientsFormatted: RecipeIngredient[];
  steps: string[]; // 3 structured steps
  tags: string[];
  caloriesApprox: string;
  nutritionHighlight: string;
  imageEmoji: string;
  chefTip: string;
}

export type PantryCategory = 'proteins' | 'carbs' | 'veggies' | 'extras';

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  emoji: string;
  isCommon?: boolean;
}

export interface MealHistoryItem {
  id: string;
  name: string;
  type: 'delivery' | 'cooking';
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  details?: string;
  emoji: string;
}

export interface UserFavoriteMeal {
  id: string;
  name: string;
  category: 'cheat_meal' | 'typical' | 'healthy' | 'economic';
  priceLevel: '$' | '$$' | '$$$';
  deliveryTime: string;
  tags: string[];
  description: string;
  ingredients: string[];
  imageEmoji: string;
  caloriesApprox?: string;
  vibe: string;
  source: 'delivery' | 'cooking' | 'custom';
  createdAt: number;
}

export type AppTab = 'decide' | 'weekly' | 'pantry' | 'favorites' | 'history' | 'create_meal' | 'settings';
export type ModalityFilter = 'all' | 'cooking' | 'delivery';
export type FoodCategoryFilter = 'all' | 'quick' | 'meat' | 'pasta' | 'sandwiches' | 'empanadas' | 'protein' | 'desserts' | 'cheat';

export interface MealCardItem {
  id: string;
  name: string;
  type: 'delivery' | 'cooking';
  categoryLabel: string;
  timeEstimate: string;
  tags: string[];
  description: string;
  ingredientsSummary: string[];
  imageEmoji: string;
  caloriesApprox?: string;
  vibe: string;
  deliveryOption?: DeliveryOption;
  recipe?: Recipe;
}

export interface MealPlanSlot {
  id: string;
  mealName: string;
  type: 'delivery' | 'cooking';
  emoji: string;
  category: string;
  timeEstimate: string;
  caloriesApprox?: string;
  recipeId?: string;
  deliveryId?: string;
  isEaten?: boolean;
}

export interface DayPlan {
  dayId: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
  dayName: string;
  lunch: MealPlanSlot;
  dinner: MealPlanSlot;
}

export interface MatchResult {
  recipe: Recipe;
  matchPercentage: number;
  sortingScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  missingCount: number;
}

export type WeeklyPlan = DayPlan[];
