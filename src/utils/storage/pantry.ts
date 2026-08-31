import { PantryCategory, PantryItem } from '../../types';
import { PANTRY_ITEMS } from '../../data/mealsData';
import { safeGet, safeSet, STORAGE_KEYS, generateUUID } from './persistence';

let pantryCache: Map<string, PantryItem> | null = null;

export function invalidatePantryCache() {
  pantryCache = null;
}

export function getPantryCache(): Map<string, PantryItem> {
  if (!pantryCache) {
    pantryCache = new Map(getAllPantryItems().map((p) => [p.id, p]));
  }
  return pantryCache;
}

export function loadSavedPantry(): string[] {
  return safeGet<string[]>(STORAGE_KEYS.PANTRY, ['huevos', 'arroz', 'cebolla', 'aceite']);
}

export function savePantryToStorage(pantryIds: string[]) {
  safeSet(STORAGE_KEYS.PANTRY, pantryIds);
}

export function loadCustomPantryItems(): PantryItem[] {
  return safeGet<PantryItem[]>(STORAGE_KEYS.CUSTOM_PANTRY, []);
}

export function saveCustomPantryItems(items: PantryItem[]) {
  safeSet(STORAGE_KEYS.CUSTOM_PANTRY, items);
  invalidatePantryCache();
}

export function inferPantryItemCategory(name: string): { category: PantryCategory; emoji: string } {
  const lower = name.toLowerCase().trim();

  // Proteins
  if (/pollo|pechuga|carne|vacio|asado|lomo|molida|cerdo|pescado|merluza|atun|salmon|mariscos|camaron|huevo|huevos|tofu|soja|lentejas|garbanzos|porotos|jamon|panceta|salchicha|chorizo/.test(lower)) {
    let emoji = '🥩';
    if (/pollo|pechuga/.test(lower)) emoji = '🍗';
    if (/pescado|merluza|salmon/.test(lower)) emoji = '🐟';
    if (/atun/.test(lower)) emoji = '🥫';
    if (/huevo|huevos/.test(lower)) emoji = '🥚';
    if (/camaron|mariscos/.test(lower)) emoji = '🦐';
    if (/jamon|panceta/.test(lower)) emoji = '🥓';
    if (/tofu|soja/.test(lower)) emoji = '🧈';
    return { category: 'proteins', emoji };
  }

  // Carbs
  if (/arroz|fideo|fideos|pasta|pan|harina|papa|papas|batata|choclo|maiz|tapa|tapas|avena|polenta|galletita|trigo|cuscus|quinoa/.test(lower)) {
    let emoji = '🍚';
    if (/fideo|fideos|pasta/.test(lower)) emoji = '🍝';
    if (/pan/.test(lower)) emoji = '🍞';
    if (/papa|papas|batata/.test(lower)) emoji = '🥔';
    if (/choclo|maiz/.test(lower)) emoji = '🌽';
    if (/tapa|tapas/.test(lower)) emoji = '🥟';
    return { category: 'carbs', emoji };
  }

  // Veggies & Greens
  if (/tomate|cebolla|ajo|zanahoria|morron|pimiento|lechuga|espinaca|acelga|zapallo|calabaza|zucchini|berenjena|palta|limon|champiñon|hongos|pepino|brocoli|coliflor|rucula|puerro|verdeo/.test(lower)) {
    let emoji = '🥗';
    if (/tomate/.test(lower)) emoji = '🍅';
    if (/cebolla|verdeo|puerro/.test(lower)) emoji = '🧅';
    if (/ajo/.test(lower)) emoji = '🧄';
    if (/zanahoria/.test(lower)) emoji = '🥕';
    if (/morron|pimiento/.test(lower)) emoji = '🫑';
    if (/espinaca|acelga|lechuga|rucula/.test(lower)) emoji = '🥬';
    if (/zapallo|calabaza/.test(lower)) emoji = '🎃';
    if (/berenjena/.test(lower)) emoji = '🍆';
    if (/palta/.test(lower)) emoji = '🥑';
    if (/limon/.test(lower)) emoji = '🍋';
    if (/champiñon|hongos/.test(lower)) emoji = '🍄';
    if (/pepino/.test(lower)) emoji = '🥒';
    if (/brocoli/.test(lower)) emoji = '🥦';
    return { category: 'veggies', emoji };
  }

  // Extras / Condiments / Dairy
  let emoji = '🧂';
  if (/queso|mozzarella|crema|leche|manteca|yogur/.test(lower)) emoji = '🧀';
  if (/aceite|oliva/.test(lower)) emoji = '🫒';
  if (/salsa|pure de tomate|ketchup|mostaza|mayonesa/.test(lower)) emoji = '🥫';
  if (/oregano|pimienta|sal|pimenton|provenzal|comino|curry/.test(lower)) emoji = '🌿';

  return { category: 'extras', emoji };
}

export function addCustomPantryItem(name: string, forcedCategory?: PantryCategory): { item: PantryItem; all: PantryItem[] } {
  const customItems = loadCustomPantryItems();
  const normalizedName = name.trim();
  const id = `custom_${generateUUID()}`;

  const { category, emoji } = inferPantryItemCategory(normalizedName);

  const newItem: PantryItem = {
    id,
    name: normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1).toLowerCase(),
    category: forcedCategory || category,
    emoji,
    isCommon: false,
  };

  const updatedCustom = [newItem, ...customItems];
  saveCustomPantryItems(updatedCustom);

  return {
    item: newItem,
    all: getAllPantryItems(),
  };
}

export function deleteCustomPantryItem(id: string): PantryItem[] {
  const customItems = loadCustomPantryItems();
  const updated = customItems.filter(item => item.id !== id);
  saveCustomPantryItems(updated);
  return getAllPantryItems();
}

export function getAllPantryItems(): PantryItem[] {
  const customItems = loadCustomPantryItems();
  return [...customItems, ...PANTRY_ITEMS];
}

export function getPantryItemName(id: string): string {
  const cache = getPantryCache();
  const item = cache.get(id);
  if (item) return item.name;
  return id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ');
}

export function getPantryItemEmoji(id: string): string {
  const cache = getPantryCache();
  const item = cache.get(id);
  return item ? item.emoji : '🥄';
}
