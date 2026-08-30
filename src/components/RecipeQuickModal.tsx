import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle2, Star, Lightbulb, Utensils } from 'lucide-react';
import { Recipe, UserFavoriteMeal } from '../types';
import { getPantryItemEmoji, triggerHaptic, isMealFavorited, createFavoriteFromRecipe } from '../utils/storage';
import { sound } from '../utils/audio';

interface RecipeQuickModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onAcceptMeal: (mealName: string, type: 'cooking', emoji: string, details?: string) => void;
  favorites: UserFavoriteMeal[];
  onAddFavorite: (meal: UserFavoriteMeal) => void;
  onDeleteFavorite: (id: string) => void;
}

export const RecipeQuickModal: React.FC<RecipeQuickModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onAcceptMeal,
  favorites,
  onAddFavorite,
  onDeleteFavorite,
}) => {
  if (!isOpen || !recipe) return null;

  // Defensive unwrapping in case a card or nested recipe was passed
  const activeRecipe: Recipe = (recipe as any).recipe || recipe;
  const ingredients = activeRecipe.allIngredientsFormatted && activeRecipe.allIngredientsFormatted.length > 0
    ? activeRecipe.allIngredientsFormatted
    : (activeRecipe.ingredientsSummary || []).map((name: string, i: number) => ({
        id: `ing_${i}`,
        name,
        amount: 'Al gusto'
      }));

  const steps = activeRecipe.steps && activeRecipe.steps.length > 0
    ? activeRecipe.steps
    : [
        'Preparar y organizar los ingredientes en la mesa de trabajo.',
        'Cocinar a fuego medio siguiendo la técnica recomendada.',
        'Servir caliente y disfrutar de este riquísimo plato casero.'
      ];

  const totalTime = (activeRecipe.prepTime || 10) + (activeRecipe.cookTime || 15);

  const isFav = isMealFavorited(activeRecipe.name, favorites);

  const toggleFav = () => {
    if (isFav) {
      sound.playClick(500);
      const existing = favorites.find(f => f.name.toLowerCase().trim() === activeRecipe.name.toLowerCase().trim());
      if (existing) onDeleteFavorite(existing.id);
      triggerHaptic('light');
    } else {
      sound.playClick(1000);
      const newFav = createFavoriteFromRecipe(activeRecipe);
      onAddFavorite(newFav);
      triggerHaptic('success');
    }
  };

  const handleAccept = () => {
    sound.playSuccess();
    triggerHaptic('success');
    onAcceptMeal(
      activeRecipe.name,
      'cooking',
      activeRecipe.imageEmoji || '🍳',
      `Cocina (${activeRecipe.difficulty || 'Fácil'}) • ${totalTime} min`
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] p-6 sm:p-7 shadow-2xl overflow-y-auto space-y-5"
        >
          {/* Top close */}
          <button
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors btn-press cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5 pr-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-3xl shadow-inner shrink-0">
              {activeRecipe.imageEmoji || '🍳'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-semibold px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.04] dark:border-white/[0.06]">
                  {activeRecipe.category || 'Casero'}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {totalTime} min
                </span>
                <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.06]">
                  {activeRecipe.difficulty || 'Fácil'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {activeRecipe.name}
              </h3>
            </div>
          </div>

          {/* Ingredients list */}
          {ingredients.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                <span>Ingredientes Necesarios</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ingredients.map((ing: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200"
                  >
                    <span>{getPantryItemEmoji(ing.id || '')}</span>
                    <span className="truncate font-medium">{ing.name}</span>
                    {ing.amount && (
                      <span className="text-[10px] text-zinc-400 font-mono ml-auto shrink-0">
                        {ing.amount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3 Steps instructions */}
          <div className="space-y-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
              Preparación en 3 Pasos Rápidos
            </h4>
            <div className="space-y-2">
              {steps.map((step: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed"
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-semibold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chef Tip */}
          {recipe.chefTip && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong className="font-semibold">Tip: </strong>
                <span className="italic">"{recipe.chefTip}"</span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <button
              onClick={toggleFav}
              className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-1.5 btn-press cursor-pointer ${
                isFav
                  ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-400'
                  : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-black/[0.08] dark:border-white/[0.08]'
              }`}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isFav ? 'Favorito' : 'Guardar'}</span>
            </button>

            <button
              onClick={handleAccept}
              className="flex-1 py-3 px-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 shadow-md btn-press cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Cocinaré este plato!</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
