import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createEmptyWeeklyPlan, 
  generateFullWeeklyPlan, 
  assignMealToSlot, 
  rerollSingleSlot, 
  clearWeeklyPlan, 
  isSlotEmpty, 
  isWeeklyPlanEmpty 
} from '../utils/storage/plan';

describe('Weekly Plan Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates an empty plan of exactly 7 days', () => {
    const plan = createEmptyWeeklyPlan();
    expect(plan).toHaveLength(7);
    expect(isWeeklyPlanEmpty(plan)).toBe(true);
  });

  it('generates a full plan without throwing errors and respects structure', () => {
    const plan = generateFullWeeklyPlan([], []);
    expect(plan).toHaveLength(7);
    expect(isWeeklyPlanEmpty(plan)).toBe(false);
    plan.forEach(day => {
      expect(day.lunch).toBeDefined();
      expect(day.dinner).toBeDefined();
      expect(day.lunch.mealName.length).toBeGreaterThan(0);
      expect(day.dinner.mealName.length).toBeGreaterThan(0);
    });
  });

  it('assigns a meal to a specific slot and detects conflict/replacement', () => {
    const plan = createEmptyWeeklyPlan();
    const newMeal = {
      name: 'Fideos con Tuco',
      type: 'cooking' as const,
      emoji: '🍝',
      category: 'Pastas',
    };

    const { updatedPlan, replacedMealName, isDuplicateDay } = assignMealToSlot(plan, 'lunes', 'lunch', newMeal);
    const monday = updatedPlan.find(d => d.dayId === 'lunes');
    expect(monday?.lunch.mealName).toBe('Fideos con Tuco');
    expect(replacedMealName).toBeUndefined();
    expect(isDuplicateDay).toBe(false);

    // Reassigning same slot replaces it
    const replaceMeal = {
      name: 'Ravioles',
      type: 'cooking' as const,
      emoji: '🍝',
    };
    const res2 = assignMealToSlot(updatedPlan, 'lunes', 'lunch', replaceMeal);
    expect(res2.replacedMealName).toBe('Fideos con Tuco');
  });

  it('rerolls a single slot without throwing', () => {
    const slot = rerollSingleSlot('cooking', [], 'Milanesas');
    expect(slot).toBeDefined();
    expect(slot.mealName).toBeDefined();
    expect(isSlotEmpty(slot)).toBe(false);
  });

  it('clears plan and persists empty state', () => {
    generateFullWeeklyPlan([], []);
    const cleared = clearWeeklyPlan();
    expect(isWeeklyPlanEmpty(cleared)).toBe(true);
  });
});
