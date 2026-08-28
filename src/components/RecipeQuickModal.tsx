import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, ChefHat, CheckCircle2, Star, Lightbulb, Utensils } from 'lucide-react';
import { Recipe, UserFavoriteMeal } from '../types';
import { getPantryItemEmoji, triggerHaptic, isMealFavorited, createFavoriteFromRecipe } from '../utils/storage';

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

  const isFav = isMealFavorited(recipe.name, favorites);

  const toggleFav = () => {
    if (isFav) {
      const existing = favorites.find(f => f.name.toLowerCase().trim() === recipe.name.toLowerCase().trim());
      if (existing) onDeleteFavorite(existing.id);
      triggerHaptic('light');
    } else {
      const newFav = createFavoriteFromRecipe(recipe);
      onAddFavorite(newFav);
      triggerHaptic('success');
    }
  };

  const handleAccept = () => {
    triggerHaptic('success');
    onAcceptMeal(
      recipe.name,
      'cooking',
      recipe.imageEmoji,
      `Cocina (${recipe.difficulty}) • ${recipe.prepTime + recipe.cookTime} min`
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg max-h-[90vh] rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl overflow-y-auto space-y-6"
        >
          {/* Top close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 pr-8">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl shrink-0">
              {recipe.imageEmoji}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
                  {recipe.category}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recipe.prepTime + recipe.cookTime} min
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                  {recipe.difficulty}
                </span>
              </div>
              <h3 className="text-xl font-medium text-zinc-100">
                {recipe.name}
              </h3>
            </div>
          </div>

          {/* Ingredients list */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-850">
            <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ingredientes Necesarios</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.allIngredientsFormatted.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-200"
                >
                  <span>{getPantryItemEmoji(ing.id)}</span>
                  <span className="truncate">{ing.name}</span>
                  {ing.amount && (
                    <span className="text-[10px] text-zinc-500 font-mono ml-auto shrink-0">
                      {ing.amount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3 Steps instructions */}
          <div className="space-y-3 pt-2 border-t border-zinc-850">
            <h4 className="text-xs uppercase tracking-widest text-zinc-400 font-mono">
              Preparación en 3 Pasos Rápidos
            </h4>
            <div className="space-y-2.5">
              {recipe.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed"
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center font-mono text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chef Tip */}
          {recipe.chefTip && (
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="italic font-serif">
                <strong className="text-zinc-200 not-italic font-sans">Tip: </strong>
                "{recipe.chefTip}"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
            <button
              onClick={toggleFav}
              className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                isFav
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isFav ? 'Favorito' : 'Guardar'}</span>
            </button>

            <button
              onClick={handleAccept}
              className="flex-1 py-3 px-5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
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
