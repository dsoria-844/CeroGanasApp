import React, { useState, useEffect, useRef } from 'react';
import { 
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
  Star
} from 'lucide-react';
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

  // Lock scroll when any modal in this view is open
  useBodyScrollLock(isFormOpen || previewMeal !== null);

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

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const formScrollRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (isFormOpen && formScrollRef.current) {
      formScrollRef.current.scrollTop = 0;
    }
  }, [isFormOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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
  const customDeliveryIds = new Set(customMeals.delivery.map(d => d.id));
  const customRecipeIds = new Set(customMeals.recipes.map(r => r.id));

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
    refreshCatalog();
    showToast(`"${mealName}" ha sido eliminado`);
  };

  const handleRestoreAll = () => {
    sound.playSuccess();
    triggerHaptic('success');
    deletedIds.forEach(id => restoreDeletedMeal(id));
    refreshCatalog();
    showToast('Platos originales restaurados');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header & Create Action */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <Utensils className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Gestión de Platos</span>
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
            Catálogo completo ({allMeals.length} platos disponibles)
          </p>
        </div>

        <button
          onClick={handleOpenCreateForm}
          className="px-4 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center gap-1.5 shadow-xs btn-press cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Plato</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="apple-card p-4 sm:p-5 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, ingrediente o etiqueta..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-1 flex-wrap">
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all btn-press cursor-pointer border ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-semibold shadow-xs'
                      : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.08]'
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

      {/* Meals List */}
      <div className="space-y-3">
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
          filteredMeals.map(meal => (
            <div
              key={meal.id}
              className="apple-card p-4 sm:p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow group"
            >
              {/* Left Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-2xl shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  {meal.imageEmoji}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                      {meal.name}
                    </h4>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      meal.type === 'cooking'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    }`}>
                      {meal.type === 'cooking' ? '🍳 Cocinar' : '🛵 Delivery'}
                    </span>

                    {meal.isCustom && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>Creado por mí</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{meal.timeEstimate}</span>
                    </span>
                    <span>•</span>
                    <span className="truncate">{meal.categoryLabel}</span>
                    {meal.ingredients.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-400 truncate max-w-[200px] hidden sm:inline">
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
                <button
                  onClick={() => {
                    sound.playClick(600);
                    setPreviewMeal(meal);
                  }}
                  className="p-2 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 btn-press cursor-pointer"
                  title="Ver detalles completos"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEditForm(meal)}
                  className="p-2 rounded-full text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 btn-press cursor-pointer"
                  title="Editar plato"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(meal.id, meal.name)}
                  className="p-2 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 btn-press cursor-pointer"
                  title="Eliminar plato del catálogo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: CREATE / EDIT FORM (MOBILE-FIRST COMPACT REDESIGN) */}
      {isFormOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFormOpen(false);
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-md overflow-hidden select-none overscroll-none touch-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl flex flex-col overflow-hidden overscroll-contain touch-auto"
          >
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {editingMealId ? 'Editar Plato' : 'Crear Nuevo Plato'}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {editingMealId ? 'Modifica los datos del plato' : 'Agrega un plato a tu catálogo'}
                </p>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 btn-press cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Mode Switch */}
            <div className="px-4 sm:px-5 pt-3 shrink-0">
              <div className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveType('cooking')}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeType === 'cooking'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-500/20'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Cocinar en Casa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveType('delivery')}
                  className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeType === 'delivery'
                      ? 'bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-500/20'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Pedir Delivery</span>
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form ref={formScrollRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {/* Row 1: Nombre + Emoji */}
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Nombre del Plato *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Tarta de zapallitos, Milanesas..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="w-16 space-y-1 shrink-0">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider text-center block">
                    Emoji
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                    className="w-full py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-center text-lg text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Categoría Universal (OBLIGATORIA PARA TODOS LOS PLATOS) + Tiempo */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                    <span>Categoría *</span>
                  </label>
                  <select
                    value={mealCategory}
                    onChange={e => setMealCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none"
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
                    Tiempo (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={timeEstimate}
                    onChange={e => setTimeEstimate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Dificultad o Tipo de Delivery */}
              <div className="grid grid-cols-2 gap-2">
                {activeType === 'cooking' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Dificultad
                    </label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Difícil">Difícil</option>
                      <option value="Media">Media</option>
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
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
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
                    placeholder="rápido, cena..."
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ingredientes clave */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Ingredientes Clave
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Escribe ingrediente y pulsa Enter..."
                    value={ingredientInput}
                    onChange={e => setIngredientInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIngredient();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold btn-press cursor-pointer shrink-0"
                  >
                    + Agregar
                  </button>
                </div>

                {ingredientsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 max-h-20 overflow-y-auto">
                    {ingredientsList.map((ing, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium"
                      >
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Pasos de Preparación (Cocinar) o Descripción (Delivery) */}
              {activeType === 'cooking' ? (
                <div className="space-y-1.5 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Pasos de Cocina
                  </label>
                  <input
                    type="text"
                    placeholder="Paso 1: Saltear y preparar ingredientes..."
                    value={step1}
                    onChange={e => setStep1(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Paso 2: Cocinar a fuego medio y condimentar..."
                    value={step2}
                    onChange={e => setStep2(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Paso 3: Servir caliente..."
                    value={step3}
                    onChange={e => setStep3(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Tip del chef (opcional)..."
                    value={chefTip}
                    onChange={e => setChefTip(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-1 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Descripción del Delivery
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles para pedir por app de delivery..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Bottom Sticky Action Bar */}
              <div className="pt-3 pb-1 flex items-center justify-end gap-2 border-t border-black/[0.06] dark:border-white/[0.06] sticky bottom-0 bg-white dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold btn-press cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs btn-press cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  {editingMealId ? 'Guardar Cambios' : 'Crear Plato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL PREVIEW */}
      {previewMeal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewMeal(null);
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-hidden overscroll-none touch-none"
        >
          <div 
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
              <button
                onClick={() => {
                  setPreviewMeal(null);
                  handleOpenEditForm(previewMeal);
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold btn-press cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar este plato</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
