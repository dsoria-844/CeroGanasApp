import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft,
  Plus, 
  ChefHat, 
  Bike, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  Clock, 
  Lightbulb, 
  Search, 
  Filter, 
  X, 
  Eye, 
  RotateCcw,
  Utensils,
  Layers,
  Flame,
  Star,
  Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recipe, DeliveryOption } from '../types';
import { 
  loadCustomMeals, 
  saveCustomDeliveryMeal, 
  saveCustomRecipeMeal, 
  deleteAnyMeal,
  getAllCatalogMeals,
  restoreDeletedMeal,
  loadDeletedMealIds,
  triggerHaptic 
} from '../utils/storage';
import { sound } from '../utils/audio';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface UnifiedMealItem {
  id: string;
  name: string;
  type: 'cooking' | 'delivery';
  imageEmoji: string;
  timeEstimate: string;
  categoryLabel: string;
  tags: string[];
  ingredients: string[];
  isCustom: boolean;
  recipe?: Recipe;
  delivery?: DeliveryOption;
}

// Universal Food Categories for all dishes
const FOOD_CATEGORIES = [
  { id: 'Carnes & Minutas', label: '🥩 Carnes & Minutas' },
  { id: 'Pastas & Olla', label: '🍝 Pastas & Olla' },
  { id: 'Pizzas & Empanadas', label: '🍕 Pizzas & Empanadas' },
  { id: 'Hamburguesas & Sandwiches', label: '🍔 Hamburguesas & Sandwiches' },
  { id: 'Pollo & Aves', label: '🍗 Pollo & Aves' },
  { id: 'Pescados & Mariscos', label: '🐟 Pescados & Mariscos' },
  { id: 'Saludable & Ensaladas', label: '🥗 Saludable & Ensaladas' },
  { id: 'Tartas & Vegetariano', label: '🥑 Tartas & Vegetariano' },
  { id: 'Postres & Dulces', label: '🍰 Postres & Dulces' },
  { id: 'Otras Comidas', label: '🍲 Otras Comidas' },
];

const POPULAR_EMOJIS = ['🥩', '🍝', '🍕', '🍔', '🍗', '🐟', '🥗', '🥑', '🍰', '🍲', '🌮', '🍣', '🥪', '🥟', '🥘', '🍳', '🍛', '🍜'];

export const CreateMealView: React.FC = () => {
  const [catalog, setCatalog] = useState<{ delivery: DeliveryOption[]; recipes: Recipe[]; customCount: number }>({
    delivery: [],
    recipes: [],
    customCount: 0,
  });
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'cooking' | 'delivery' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form / Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'cooking' | 'delivery'>('cooking');

  // Preview Modal State
  const [previewMeal, setPreviewMeal] = useState<UnifiedMealItem | null>(null);

  // Lock scroll only when preview modal is open
  useBodyScrollLock(previewMeal !== null);

  // Form Inputs
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🍲');
  const [timeEstimate, setTimeEstimate] = useState('20');
  const [mealCategory, setMealCategory] = useState<string>('Carnes & Minutas');
  const [tagsInput, setTagsInput] = useState('');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Media' | 'Difícil'>('Fácil');
  const [step1, setStep1] = useState('');
  const [step2, setStep2] = useState('');
  const [step3, setStep3] = useState('');
  const [chefTip, setChefTip] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [deliveryCategory, setDeliveryCategory] = useState<'typical' | 'cheat_meal' | 'healthy' | 'economic'>('typical');

  // Notifications & Undo
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{ id: string; name: string } | null>(null);
  const formScrollRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (isFormOpen && formScrollRef.current) {
      formScrollRef.current.scrollTop = 0;
    }
  }, [isFormOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshCatalog = () => {
    setCatalog(getAllCatalogMeals());
    setDeletedIds(loadDeletedMealIds());
  };

  useEffect(() => {
    refreshCatalog();
  }, []);

  // Build unified meal list
  const customMeals = loadCustomMeals();
  const customDeliveryIds = new Set((customMeals.customDelivery || []).map(d => d.id));
  const customRecipeIds = new Set((customMeals.customRecipes || []).map(r => r.id));

  const allMeals: UnifiedMealItem[] = [
    ...catalog.recipes.map(r => ({
      id: r.id,
      name: r.name,
      type: 'cooking' as const,
      imageEmoji: r.imageEmoji,
      timeEstimate: `${r.prepTime + r.cookTime} min`,
      categoryLabel: `Cocina (${r.difficulty})`,
      tags: r.tags,
      ingredients: r.allIngredientsFormatted.map(i => i.name),
      isCustom: customRecipeIds.has(r.id),
      recipe: r,
    })),
    ...catalog.delivery.map(d => ({
      id: d.id,
      name: d.name,
      type: 'delivery' as const,
      imageEmoji: d.imageEmoji,
      timeEstimate: d.deliveryTime,
      categoryLabel: d.category === 'cheat_meal' ? 'Delivery Antojo' : d.category === 'healthy' ? 'Delivery Saludable' : 'Delivery Típico',
      tags: d.tags,
      ingredients: d.ingredients,
      isCustom: customDeliveryIds.has(d.id),
      delivery: d,
    })),
  ];

  // Filtering
  const filteredMeals = allMeals.filter(meal => {
    if (activeFilter === 'cooking' && meal.type !== 'cooking') return false;
    if (activeFilter === 'delivery' && meal.type !== 'delivery') return false;
    if (activeFilter === 'custom' && !meal.isCustom) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = meal.name.toLowerCase().includes(q);
      const matchTag = meal.tags.some(t => t.toLowerCase().includes(q));
      const matchIng = meal.ingredients.some(i => i.toLowerCase().includes(q));
      if (!matchName && !matchTag && !matchIng) return false;
    }
    return true;
  });

  const handleOpenCreateForm = () => {
    sound.playClick(900);
    triggerHaptic('light');
    setEditingMealId(null);
    setName('');
    setEmoji('🍲');
    setTimeEstimate('20');
    setMealCategory('Carnes & Minutas');
    setTagsInput('');
    setDifficulty('Fácil');
    setStep1('');
    setStep2('');
    setStep3('');
    setChefTip('');
    setIngredientInput('');
    setIngredientsList([]);
    setDescription('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (meal: UnifiedMealItem) => {
    sound.playClick(800);
    triggerHaptic('light');
    setEditingMealId(meal.id);
    setActiveType(meal.type);
    setName(meal.name);
    setEmoji(meal.imageEmoji);
    setMealCategory(meal.recipe?.category || 'Carnes & Minutas');
    setTagsInput(meal.tags.join(', '));
    setIngredientsList(meal.ingredients);

    if (meal.type === 'cooking' && meal.recipe) {
      setTimeEstimate(String(meal.recipe.prepTime + meal.recipe.cookTime));
      setDifficulty(meal.recipe.difficulty);
      setStep1(meal.recipe.steps[0] || '');
      setStep2(meal.recipe.steps[1] || '');
      setStep3(meal.recipe.steps[2] || '');
      setChefTip(meal.recipe.chefTip || '');
    } else if (meal.type === 'delivery' && meal.delivery) {
      setTimeEstimate(meal.delivery.deliveryTime.replace(/\D/g, '') || '25');
      setDeliveryCategory(meal.delivery.category);
      setDescription(meal.delivery.description);
    }

    setIsFormOpen(true);
  };

  const handleAddIngredient = () => {
    if (!ingredientInput.trim()) return;
    if (!ingredientsList.includes(ingredientInput.trim())) {
      setIngredientsList([...ingredientsList, ingredientInput.trim()]);
    }
    setIngredientInput('');
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredientsList(ingredientsList.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playSuccess();
    triggerHaptic('success');

    const id = editingMealId || `custom_${Date.now()}`;
    const parsedTags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    if (activeType === 'cooking') {
      const steps = [
        step1.trim() || 'Preparar y saltear los ingredientes principales en sartén u olla.',
        step2.trim() || 'Cocinar a fuego medio condimentando a gusto.',
        step3.trim() || 'Servir caliente en plato hondo con queso o condimentos.',
      ];

      const newRecipe: Recipe = {
        id,
        name: name.trim(),
        prepTime: Math.max(5, Math.floor(parseInt(timeEstimate) / 2) || 10),
        cookTime: Math.max(5, Math.floor(parseInt(timeEstimate) / 2) || 10),
        difficulty,
        category: mealCategory,
        requiredIngredients: ingredientsList.map(i => i.toLowerCase().replace(/\s+/g, '_')),
        optionalIngredients: [],
        allIngredientsFormatted: ingredientsList.map(ing => ({
          id: ing.toLowerCase().replace(/\s+/g, '_'),
          name: ing,
        })),
        steps,
        tags: ['casero', 'personalizado', mealCategory.toLowerCase(), ...parsedTags],
        caloriesApprox: '~450 kcal',
        nutritionHighlight: 'Plato casero guardado en Cero Ganas',
        imageEmoji: emoji || '🍳',
        chefTip: chefTip.trim() || 'Tu toque especial casero.',
      };

      saveCustomRecipeMeal(newRecipe);
    } else {
      const newDelivery: DeliveryOption = {
        id,
        name: name.trim(),
        category: deliveryCategory,
        priceLevel: '$$',
        deliveryTime: `${timeEstimate || '25-35'} min`,
        tags: ['delivery', 'personalizado', mealCategory.toLowerCase(), ...parsedTags],
        description: description.trim() || 'Opción de delivery agregada por ti.',
        ingredients: ingredientsList.map(i => i.toLowerCase().replace(/\s+/g, '_')),
        imageEmoji: emoji || '🛵',
        caloriesApprox: '~600 kcal',
        vibe: description.trim() || 'Listo para pedir cuando no tengas ganas de cocinar.',
      };

      saveCustomDeliveryMeal(newDelivery);
    }

    setIsFormOpen(false);
    refreshCatalog();
    showToast(editingMealId ? 'Plato modificado correctamente' : '¡Plato creado con éxito!');
  };

  const handleDelete = (id: string, mealName: string) => {
    sound.playClick(400);
    triggerHaptic('medium');
    deleteAnyMeal(id);
    setUndoItem({ id, name: mealName });
    refreshCatalog();
    showToast(`"${mealName}" ha sido eliminado`);
  };

  const handleUndoDelete = () => {
    if (!undoItem) return;
    sound.playSuccess();
    triggerHaptic('success');
    restoreDeletedMeal(undoItem.id);
    refreshCatalog();
    showToast(`"${undoItem.name}" restaurado`);
    setUndoItem(null);
  };

  const handleRestoreAll = () => {
    sound.playClick(700);
    triggerHaptic('light');
    deletedIds.forEach(id => restoreDeletedMeal(id));
    refreshCatalog();
    showToast('Todos los platos eliminados han sido restaurados');
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* Toast Notification with Undo */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-2xl bg-zinc-900/95 text-white dark:bg-white/95 dark:text-zinc-900 text-xs font-semibold shadow-2xl flex items-center gap-3 backdrop-blur-md border border-white/10 dark:border-black/10"
          >
            <span className="truncate max-w-[220px] sm:max-w-xs">{toastMessage}</span>
            {undoItem && (
              <button
                onClick={handleUndoDelete}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1 btn-press cursor-pointer shrink-0 shadow-xs"
              >
                <Undo2 className="w-3 h-3" />
                <span>Deshacer</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          /* ============================================================ */
          /* DEDICATED FULL-VIEW: CREATE / EDIT MEAL FORM                */
          /* ============================================================ */
          <motion.div
            key="create-meal-form-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="space-y-4"
          >
            {/* Navigation Header */}
            <div className="apple-card p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(700);
                    setIsFormOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs btn-press cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Mis Platos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(600);
                    setIsFormOpen(false);
                  }}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 btn-press cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-amber-500" />
                  <span>{editingMealId ? 'Editar Plato' : 'Crear Nuevo Plato'}</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {editingMealId
                    ? 'Modifica los datos del plato y mira el resultado en vivo'
                    : 'Agrega un nuevo plato a tu catálogo de comidas'}
                </p>
              </div>
            </div>

            {/* Form & Live Preview Card */}
            <div className="apple-card p-4 sm:p-7 space-y-5">
              {/* Segmented Mode Switch with Sliding Spring Pill */}
              <div>
                <div className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] relative">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(700);
                      setActiveType('cooking');
                    }}
                    className={`relative z-10 flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeType === 'cooking' ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {activeType === 'cooking' && (
                      <motion.div
                        layoutId="segmented-meal-type-fullview"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-xs border border-emerald-500/20"
                      />
                    )}
                    <ChefHat className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Cocinar en Casa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick(700);
                      setActiveType('delivery');
                    }}
                    className={`relative z-10 flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeType === 'delivery' ? 'text-amber-700 dark:text-amber-300' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {activeType === 'delivery' && (
                      <motion.div
                        layoutId="segmented-meal-type-fullview"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-xs border border-amber-500/20"
                      />
                    )}
                    <Bike className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Pedir Delivery</span>
                  </button>
                </div>
              </div>

              {/* Live Card Preview Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-4 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-3xl shadow-xs shrink-0">
                  {emoji || '🍲'}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {name.trim() || 'Nombre del plato'}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      activeType === 'cooking'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    }`}>
                      {activeType === 'cooking' ? 'Cocinar' : 'Delivery'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {mealCategory} • {timeEstimate || 20} min {activeType === 'cooking' ? `• ${difficulty}` : ''}
                  </p>
                  {ingredientsList.length > 0 && (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                      {ingredientsList.slice(0, 4).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider px-2 py-1 rounded-md bg-zinc-200/50 dark:bg-zinc-800 shrink-0">
                  Vista Previa
                </span>
              </div>

              {/* The Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Nombre + Emoji Input & Quick Emoji Selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Nombre del Plato *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={50}
                        placeholder="Ej. Tarta de zapallitos, Milanesas..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                      />
                    </div>

                    <div className="w-20 space-y-1 shrink-0">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center block">
                        Emoji
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={emoji}
                        onChange={e => setEmoji(e.target.value)}
                        className="w-full py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-center text-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* 1-Tap Quick Emoji Picker Bar */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-zinc-400">Sugerencias rápidas de emoji:</span>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                      {POPULAR_EMOJIS.map(em => (
                        <motion.button
                          key={em}
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => {
                            sound.playTick(700);
                            setEmoji(em);
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all border cursor-pointer ${
                            emoji === em
                              ? 'bg-amber-500/20 border-amber-500 shadow-xs scale-105'
                              : 'bg-zinc-50 dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {em}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Categoría Universal + Tiempo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                      <span>Categoría *</span>
                    </label>
                    <select
                      value={mealCategory}
                      onChange={e => setMealCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    >
                      {FOOD_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Tiempo estimado (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="999"
                      maxLength={3}
                      value={timeEstimate}
                      onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.value.length > 3) {
                          e.target.value = e.target.value.slice(0, 3);
                        }
                      }}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setTimeEstimate(val);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Row 3: Dificultad o Estilo de Delivery + Etiquetas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeType === 'cooking' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Dificultad
                      </label>
                      <select
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      >
                        <option value="Fácil">Fácil</option>
                        <option value="Media">Media</option>
                        <option value="Difícil">Difícil</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Estilo de Delivery
                      </label>
                      <select
                        value={deliveryCategory}
                        onChange={e => setDeliveryCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      >
                        <option value="typical">Típico / Clásico</option>
                        <option value="cheat_meal">Antojo / Cheat Meal</option>
                        <option value="healthy">Saludable</option>
                        <option value="economic">Económico</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Etiquetas (opcional)
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      placeholder="rápido, cena, fin de semana..."
                      value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ingredientes clave con Spring Chips */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Ingredientes Clave
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={30}
                      placeholder="Escribe ingrediente y pulsa Enter..."
                      value={ingredientInput}
                      onChange={e => setIngredientInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddIngredient();
                        }
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                    />
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={handleAddIngredient}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold btn-press cursor-pointer shrink-0 shadow-xs"
                    >
                      + Agregar
                    </motion.button>
                  </div>

                  {ingredientsList.length > 0 && (
                    <motion.div layout className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                      <AnimatePresence>
                        {ingredientsList.map((ing, idx) => (
                          <motion.span
                            key={ing}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium border border-black/[0.04] dark:border-white/[0.04] shadow-2xs"
                          >
                            <span>{ing}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="text-zinc-400 hover:text-red-500 cursor-pointer p-0.5 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                {/* Pasos de Preparación (Cocinar) o Descripción (Delivery) */}
                {activeType === 'cooking' ? (
                  <div className="space-y-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Pasos de Cocina (3 Pasos Simples)
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="Paso 1: Saltear y preparar ingredientes..."
                      value={step1}
                      onChange={e => setStep1(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="Paso 2: Cocinar a fuego medio y condimentar..."
                      value={step2}
                      onChange={e => setStep2(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="Paso 3: Servir caliente..."
                      value={step3}
                      onChange={e => setStep3(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <input
                      type="text"
                      maxLength={120}
                      placeholder="Tip del chef (opcional)..."
                      value={chefTip}
                      onChange={e => setChefTip(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Descripción del Delivery
                    </label>
                    <textarea
                      rows={3}
                      maxLength={250}
                      placeholder="Detalles para pedir por app de delivery..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none resize-none"
                    />
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => {
                      sound.playClick(600);
                      setIsFormOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold btn-press cursor-pointer"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs btn-press cursor-pointer shadow-sm shadow-amber-500/20"
                  >
                    {editingMealId ? 'Guardar Cambios' : 'Crear Plato'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        ) : (
          /* ============================================================ */
          /* CATALOG VIEW (LIST OF MEALS WITH CRUD ACTIONS)              */
          /* ============================================================ */
          <motion.div
            key="catalog-list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Header & Main Actions */}
            <div className="apple-card p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <Utensils className="w-6 h-6 text-amber-500" />
                    <span>Mis Platos & Recetas</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Administra el catálogo completo de platos. Puedes editar, borrar o agregar nuevos.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleOpenCreateForm}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 btn-press cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Crear Nuevo Plato</span>
                </motion.button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Buscar plato por nombre, ingrediente o etiqueta..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all', label: `Todos (${allMeals.length})` },
                    { id: 'cooking', label: `Cocinar (${allMeals.filter(m => m.type === 'cooking').length})` },
                    { id: 'delivery', label: `Delivery (${allMeals.filter(m => m.type === 'delivery').length})` },
                    { id: 'custom', label: `Mis Creaciones (${allMeals.filter(m => m.isCustom).length})` },
                  ].map(f => {
                    const isSelected = activeFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          sound.playClick(750);
                          setActiveFilter(f.id as any);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all btn-press cursor-pointer border ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-bold shadow-xs'
                            : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {deletedIds.length > 0 && (
                  <button
                    onClick={handleRestoreAll}
                    className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 btn-press cursor-pointer"
                    title="Restaurar platos originales eliminados"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar eliminados ({deletedIds.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Meals List with Spring Layout Transitions */}
            <motion.div layout className="space-y-2.5">
              {filteredMeals.length === 0 ? (
                <div className="apple-card p-10 text-center space-y-2 text-zinc-400">
                  <Utensils className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    No se encontraron platos
                  </p>
                  <p className="text-xs">
                    Prueba con otro término de búsqueda o agrega un nuevo plato con el botón superior.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredMeals.map(meal => (
                    <motion.div
                      key={meal.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="apple-card p-3.5 sm:p-4.5 flex items-center justify-between gap-3 hover:shadow-md transition-shadow group"
                    >
                      {/* Left Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-2xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          {meal.imageEmoji}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                              {meal.name}
                            </h4>

                            <span className={`text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              meal.type === 'cooking'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            }`}>
                              {meal.type === 'cooking' ? '🍳 Cocina' : '🛵 Delivery'}
                            </span>

                            {meal.isCustom && (
                              <span className="text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>Creado</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-zinc-400" />
                              <span>{meal.timeEstimate}</span>
                            </span>
                            <span>•</span>
                            <span className="truncate">{meal.categoryLabel}</span>
                            {meal.ingredients.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400 truncate max-w-[180px] hidden sm:inline">
                                  {meal.ingredients.slice(0, 3).join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Icons (CRUD: View, Edit, Delete) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* View Details Button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            sound.playClick(600);
                            setPreviewMeal(meal);
                          }}
                          className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
                          title="Ver detalles completos"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>

                        {/* Edit Button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenEditForm(meal)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 btn-press cursor-pointer"
                          title="Editar plato"
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>

                        {/* Delete Button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(meal.id, meal.name)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 btn-press cursor-pointer"
                          title="Eliminar plato del catálogo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL PREVIEW MODAL */}
      <AnimatePresence>
        {previewMeal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewMeal(null);
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-hidden overscroll-none touch-none"
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] p-6 space-y-4 shadow-2xl overscroll-contain touch-auto"
            >
              <button
                onClick={() => setPreviewMeal(null)}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 btn-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-4xl mx-auto shadow-xs">
                  {previewMeal.imageEmoji}
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  {previewMeal.name}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">
                  {previewMeal.categoryLabel} • {previewMeal.timeEstimate}
                </p>
              </div>

              {previewMeal.recipe && (
                <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                    Pasos de Cocina:
                  </span>
                  <div className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                    {previewMeal.recipe.steps.map((step, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewMeal.delivery && (
                <div className="space-y-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                    Descripción:
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {previewMeal.delivery.description}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setPreviewMeal(null);
                    handleOpenEditForm(previewMeal);
                  }}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold btn-press cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar este plato</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
