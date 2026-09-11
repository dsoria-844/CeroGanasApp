import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  loadMealHistory, 
  addMealToHistory, 
  deleteMealFromHistory, 
  restoreMealHistoryItem, 
  clearMealHistory 
} from '../utils/storage/history';

describe('Meal History Management', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('starts empty for a fresh user', () => {
    expect(loadMealHistory()).toEqual([]);
  });

  it('records an accepted meal', () => {
    const updated = addMealToHistory('Milanesas con Puré', 'cooking', '🥩', 'Plato Casero');
    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe('Milanesas con Puré');
    expect(updated[0].type).toBe('cooking');
    expect(updated[0].emoji).toBe('🥩');
  });

  it('debounces rapid multi-clicks within 1.5 seconds for the same meal', () => {
    const first = addMealToHistory('Pizza Muzza', 'delivery', '🍕');
    expect(first).toHaveLength(1);

    // Immediate second tap
    const second = addMealToHistory('Pizza Muzza', 'delivery', '🍕');
    expect(second).toHaveLength(1);
  });

  it('allows recording different meals without debounce blocking', () => {
    addMealToHistory('Pizza Muzza', 'delivery', '🍕');
    const updated = addMealToHistory('Empanadas', 'delivery', '🥟');
    expect(updated).toHaveLength(2);
  });

  it('deletes and restores history items correctly (Undo feature)', () => {
    const list = addMealToHistory('Guiso', 'cooking', '🍲');
    const item = list[0];

    const afterDelete = deleteMealFromHistory(item.id);
    expect(afterDelete).toHaveLength(0);

    const afterRestore = restoreMealHistoryItem(item);
    expect(afterRestore).toHaveLength(1);
    expect(afterRestore[0].id).toBe(item.id);
  });

  it('clears all history upon request', () => {
    addMealToHistory('Comida 1', 'cooking', '🍳');
    addMealToHistory('Comida 2', 'delivery', '🛵');
    const cleared = clearMealHistory();
    expect(cleared).toEqual([]);
    expect(loadMealHistory()).toEqual([]);
  });
});
