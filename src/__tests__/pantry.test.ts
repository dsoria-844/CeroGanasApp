import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadSavedPantry, 
  savePantryToStorage, 
  addCustomPantryItem, 
  deleteCustomPantryItem, 
  inferPantryItemCategory 
} from '../utils/storage/pantry';
import { matchRecipesWithPantry } from '../utils/storage/recipes';

describe('Pantry and Recipe Matching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default pantry items for new users', () => {
    const defaultPantry = loadSavedPantry();
    expect(defaultPantry).toContain('huevos');
    expect(defaultPantry).toContain('arroz');
  });

  it('saves and reloads pantry items', () => {
    savePantryToStorage(['huevos', 'tomate', 'queso']);
    const loaded = loadSavedPantry();
    expect(loaded).toEqual(['huevos', 'tomate', 'queso']);
  });

  it('infers correct categories for common ingredients', () => {
    expect(inferPantryItemCategory('pechuga de pollo').category).toBe('proteins');
    expect(inferPantryItemCategory('fideos').category).toBe('carbs');
    expect(inferPantryItemCategory('tomate').category).toBe('veggies');
    expect(inferPantryItemCategory('aceite').category).toBe('extras');
  });

  it('adds and deletes custom pantry items safely', () => {
    const { item } = addCustomPantryItem('Palta Haas');
    expect(item.name).toBe('Palta haas');

    const all = deleteCustomPantryItem(item.id);
    expect(all.some(i => i.id === item.id)).toBe(false);
  });

  it('matches recipes with pantry ingredients and scores them', () => {
    const pantry = ['huevos', 'arroz', 'cebolla', 'aceite'];
    const results = matchRecipesWithPantry(pantry, [], []);
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].matchPercentage).toBeGreaterThan(0);
      expect(results[0].recipe).toBeDefined();
    }
  });

  it('correctly filters out items matching exclusions via hasExcludedItems', async () => {
    const { hasExcludedItems } = await import('../utils/storage/recipes');
    expect(hasExcludedItems(['cebolla', 'carne'], ['Cebolla'])).toBe(true);
    expect(hasExcludedItems(['tomate', 'lechuga'], ['cebolla', 'ajo'])).toBe(false);
    expect(hasExcludedItems([], ['cebolla'])).toBe(false);
    expect(hasExcludedItems(['cebolla'], [])).toBe(false);
    expect(hasExcludedItems(['  carne picada  '], ['carne picada'])).toBe(true);
  });
});
