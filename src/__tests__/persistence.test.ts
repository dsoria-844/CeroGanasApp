import { describe, it, expect, beforeEach } from 'vitest';
import { safeGet, safeSet, STORAGE_KEYS, generateUUID } from '../utils/storage/persistence';

describe('Storage Persistence Layer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('safely reads valid JSON', () => {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(['arroz', 'huevos']));
    const result = safeGet<string[]>(STORAGE_KEYS.PANTRY, []);
    expect(result).toEqual(['arroz', 'huevos']);
  });

  it('safely falls back to default on corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEYS.PANTRY, '{invalid_json');
    const result = safeGet<string[]>(STORAGE_KEYS.PANTRY, ['fallback']);
    expect(result).toEqual(['fallback']);
  });

  it('safely degrades to fallback array when stored value is an object or primitive', () => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify({ broken: true }));
    const result = safeGet<any[]>(STORAGE_KEYS.HISTORY, []);
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('migrates legacy unversioned keys automatically without data loss', () => {
    const legacyKey = STORAGE_KEYS.HISTORY.replace('_v1', '');
    localStorage.setItem(legacyKey, JSON.stringify([{ id: 'leg_1', name: 'Pastel de Papa' }]));

    const migrated = safeGet<any[]>(STORAGE_KEYS.HISTORY, []);
    expect(migrated).toHaveLength(1);
    expect(migrated[0].name).toBe('Pastel de Papa');
    expect(localStorage.getItem(STORAGE_KEYS.HISTORY)).toBe(JSON.stringify([{ id: 'leg_1', name: 'Pastel de Papa' }]));
  });

  it('generates unique IDs with optional prefix', () => {
    const id1 = generateUUID('test_');
    const id2 = generateUUID('test_');
    expect(id1.startsWith('test_')).toBe(true);
    expect(id1).not.toBe(id2);
  });
});
