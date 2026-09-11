import { MealHistoryItem } from '../../types';
import { safeGet, safeSet, STORAGE_KEYS, generateUUID, formatNiceDate, formatNiceTime } from './persistence';

export function loadMealHistory(): MealHistoryItem[] {
  const loaded = safeGet<MealHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
  return Array.isArray(loaded) ? loaded : [];
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

  // Debounce protection: ignore duplicate rapid clicks within 1.5s
  if (current.length > 0) {
    const last = current[0];
    const isSameName = (last.name || '').toLowerCase().trim() === (name || '').toLowerCase().trim();
    if (isSameName && typeof last.timestamp === 'number' && (now - last.timestamp) < 1500) {
      return current;
    }
  }

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
  const updated = (current || []).filter(item => item && item.id !== id);
  saveMealHistoryToStorage(updated);
  return updated;
}

export function restoreMealHistoryItem(itemToRestore: MealHistoryItem): MealHistoryItem[] {
  const current = loadMealHistory();
  const withoutIt = (current || []).filter(item => item && item.id !== itemToRestore.id);
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
  return (history || [])
    .filter(item => item && typeof item.timestamp === 'number' && item.timestamp >= fourDaysAgo)
    .map(item => (item.name || '').toLowerCase().trim());
}
