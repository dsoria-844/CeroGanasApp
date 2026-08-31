import confetti from 'canvas-confetti';
import { ModalityFilter } from '../../types';

export const STORAGE_KEYS = {
  PANTRY: 'que_como_pantry_v1',
  HISTORY: 'que_como_history_v1',
  FAVORITES: 'que_como_favorites_v1',
  EXCLUSIONS: 'que_como_exclusions_v1',
  CUSTOM_PANTRY: 'que_como_custom_pantry_v1',
  WEEKLY_PLAN: 'que_como_weekly_plan_v1',
  DUEL_THRESHOLD: 'que_como_duel_threshold_v1',
  DUEL_ENABLED: 'que_como_duel_enabled_v1',
  PREFERRED_MODALITY: 'que_como_preferred_modality_v1',
  DEFAULT_DELIVERY_APP: 'que_como_default_delivery_app_v1',
  CUSTOM_MEALS: 'que_como_custom_meals_v1',
  DELETED_MEALS: 'que_como_deleted_meals_v1',
};

export function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`[Storage] Error reading ${key}:`, e);
  }
  return fallback;
}

export function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[Storage] Error writing ${key}:`, e);
  }
}

export function generateUUID(prefix: string = ''): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}${crypto.randomUUID()}`;
    }
  } catch {
    // fallback if crypto.randomUUID not available
  }
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(25);
      else if (type === 'success') navigator.vibrate([15, 30, 20]);
      else if (type === 'warning') navigator.vibrate([30, 50, 30]);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function triggerVictoryConfetti() {
  try {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6', '#ec4899'],
      disableForReducedMotion: true,
    });
  } catch {
    // Canvas confetti might fail in some test envs
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatNiceDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffDays === 0) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${days[date.getDay()]}`;
  } else {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }
}

export function formatNiceTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Settings helpers
export function loadDuelThreshold(): number {
  return safeGet<number>(STORAGE_KEYS.DUEL_THRESHOLD, 5);
}

export function saveDuelThreshold(count: number): void {
  safeSet(STORAGE_KEYS.DUEL_THRESHOLD, count);
}

export function loadDuelEnabled(): boolean {
  return safeGet<boolean>(STORAGE_KEYS.DUEL_ENABLED, false);
}

export function saveDuelEnabled(enabled: boolean): void {
  safeSet(STORAGE_KEYS.DUEL_ENABLED, enabled);
}

export function loadPreferredModality(): ModalityFilter {
  return safeGet<ModalityFilter>(STORAGE_KEYS.PREFERRED_MODALITY, 'all');
}

export function savePreferredModality(modality: ModalityFilter): void {
  safeSet(STORAGE_KEYS.PREFERRED_MODALITY, modality);
}

export function loadExclusions(): string[] {
  return safeGet<string[]>(STORAGE_KEYS.EXCLUSIONS, []);
}

export function saveExclusionsToStorage(exclusions: string[]): void {
  safeSet(STORAGE_KEYS.EXCLUSIONS, exclusions);
}
