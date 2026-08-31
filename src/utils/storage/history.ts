import { MealHistoryItem } from '../../types';
import { safeGet, safeSet, STORAGE_KEYS, generateUUID, formatNiceDate, formatNiceTime } from './persistence';

export function loadMealHistory(): MealHistoryItem[] {
  return safeGet<MealHistoryItem[]>(STORAGE_KEYS.HISTORY, [
    {
      id: 'default_1',
      name: 'Pizza Margherita Casera',
      type: 'cooking',
      timestamp: Date.now() - 86400000 * 2,
      dateFormatted: 'Hace 2 días',
      timeFormatted: '21:30',
      details: 'Cocina • 25 min',
      emoji: '🍕',
    },
  ]);
}

export function saveMealHistoryToStorage(history: MealHistoryItem[]) {
  safeSet(STORAGE_KEYS.HISTORY, history);
}

export function addMealToHistory(
  name: string,
  type: 'delivery' | 'cooking',
  emoji: string,
  details?: string
): MealHistoryItem[] {
  const current = loadMealHistory();
  const now = Date.now();
  const newItem: MealHistoryItem = {
    id: generateUUID('meal_'),
    name,
    type,
    timestamp: now,
    dateFormatted: formatNiceDate(now),
    timeFormatted: formatNiceTime(now),
    details: details || (type === 'cooking' ? 'Plato Casero' : 'Delivery'),
    emoji: emoji || (type === 'cooking' ? '🍳' : '🛵'),
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

export function restoreMealHistoryItem(itemToRestore: MealHistoryItem): MealHistoryItem[] {
  const current = loadMealHistory();
  const withoutIt = current.filter(item => item.id !== itemToRestore.id);
  const updated = [itemToRestore, ...withoutIt].sort((a, b) => b.timestamp - a.timestamp);
  saveMealHistoryToStorage(updated);
  return updated;
}

export function clearMealHistory(): MealHistoryItem[] {
  saveMealHistoryToStorage([]);
  return [];
}

export function getRecentHistoryMealNames(history: MealHistoryItem[]): string[] {
  const fourDaysAgo = Date.now() - 4 * 24 * 60 * 60 * 1000;
  return history
    .filter(item => item.timestamp >= fourDaysAgo)
    .map(item => item.name.toLowerCase().trim());
}
