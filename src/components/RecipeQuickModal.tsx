import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle2, Star, Lightbulb, Utensils, Sparkles } from 'lucide-react';
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

const recipeContentVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
};

const recipeItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 28,
    },
  },
};

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
    : ((activeRecipe as any).ingredientsSummary || []).map((name: string, i: number) => ({
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
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClick(600);
            onClose();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] p-6 sm:p-7 shadow-2xl overflow-y-auto space-y-5"
        >
          {/* Top close */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer shadow-2xs z-10"
            title="Cerrar receta"
          >
            <X className="w-4 h-4" />
          </motion.button>

          <motion.div
            variants={recipeContentVariants}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {/* Header */}
            <motion.div variants={recipeItemVariants} className="flex items-start gap-3.5 pr-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-3xl shadow-inner shrink-0">
                {activeRecipe.imageEmoji || '🍳'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    {activeRecipe.category || 'Casero'}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {totalTime} min
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.06]">
                    {activeRecipe.difficulty || 'Fácil'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                  {activeRecipe.name}
                </h3>
              </div>
            </motion.div>

            {/* Ingredients list */}
            {ingredients.length > 0 && (
              <motion.div variants={recipeItemVariants} className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ingredientes Necesarios ({ingredients.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ingredients.map((ing: any, idx: number) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200 transition-colors shadow-2xs"
                    >
                      <span className="text-base">{getPantryItemEmoji(ing.id || '')}</span>
                      <span className="truncate font-medium">{ing.name}</span>
                      {ing.amount && (
                        <span className="text-[10px] text-zinc-400 font-mono ml-auto shrink-0 font-semibold">
                          {ing.amount}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3 Steps instructions */}
            <motion.div variants={recipeItemVariants} className="space-y-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Preparación en 3 Pasos Rápidos</span>
              </h4>
              <div className="space-y-2">
                {steps.map((step: string, idx: number) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed shadow-2xs transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="font-normal">{step}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Chef Tip */}
            {recipe.chefTip && (
              <motion.div 
                variants={recipeItemVariants}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200 shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p>
                  <strong className="font-bold text-amber-900 dark:text-amber-100">Tip del Chef: </strong>
                  <span className="italic font-medium">"{recipe.chefTip}"</span>
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div variants={recipeItemVariants} className="flex items-center gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.88 }}
                onClick={toggleFav}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
                  isFav
                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-400'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-black/[0.08] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-zinc-750'
                }`}
              >
                <motion.div
                  key={isFav ? 'fav' : 'unfav'}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                </motion.div>
                <span className="hidden sm:inline">{isFav ? 'Favorito' : 'Guardar'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleAccept}
                className="flex-1 py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>¡Cocinaré este plato!</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
