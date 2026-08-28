import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Clock, 
  X, 
  Heart, 
  RotateCcw, 
  ExternalLink, 
  ChefHat, 
  Star, 
  Check, 
  Bike, 
  Sparkles, 
  Utensils, 
  Lightbulb, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Zap, 
  Flame, 
  Layers, 
  Filter,
  ShoppingBag,
  Cake
} from 'lucide-react';
import { MealCardItem, ModalityFilter, FoodCategoryFilter, MealHistoryItem, UserFavoriteMeal, Recipe } from '../types';
import { 
  getUnifiedCardDataset, 
  triggerHaptic, 
  triggerVictoryConfetti, 
  isMealFavorited,
  createFavoriteFromRecipe,
  loadDuelThreshold,
  getDeliverySearchUrl
} from '../utils/storage';
import { sound } from '../utils/audio';

interface DecideTodayViewProps {
  pantry: string[];
  exclusions: string[];
  history: MealHistoryItem[];
  favorites: UserFavoriteMeal[];
  onAcceptMeal: (mealName: string, type: 'delivery' | 'cooking', emoji: string, details?: string) => void;
  onAddFavorite: (meal: UserFavoriteMeal) => void;
  onDeleteFavorite: (id: string) => void;
  onOpenRecipeModal: (recipe: Recipe) => void;
  onOpenBlindMode: () => void;
  onNavigatePantry?: () => void;
}

// Fixed Modalities (Modalidades Fijas)
const MODALITIES: { id: ModalityFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todos los platos', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'cooking', label: 'Cocinar en Casa', icon: <ChefHat className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'delivery', label: 'Pedir Delivery', icon: <Bike className="w-3.5 h-3.5 text-amber-500" /> },
];

// Dropdown Categories (Categorías Desplegables)
const CATEGORIES: { id: FoodCategoryFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todas las categorías', icon: <Sparkles className="w-3.5 h-3.5 text-zinc-500" /> },
  { id: 'quick', label: 'Rápido (<15 min)', icon: <Clock className="w-3.5 h-3.5 text-blue-500" /> },
  { id: 'meat', label: 'Carnes & Parrilla', icon: <Flame className="w-3.5 h-3.5 text-rose-500" /> },
  { id: 'pasta', label: 'Pastas & Olla', icon: <Utensils className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'sandwiches', label: 'Sandwiches & Minutas', icon: <Layers className="w-3.5 h-3.5 text-orange-500" /> },
  { id: 'empanadas', label: 'Empanadas & Entradas', icon: <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> },
  { id: 'protein', label: 'Alto en Proteína', icon: <Utensils className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'desserts', label: 'Postres & Golosinas', icon: <Cake className="w-3.5 h-3.5 text-pink-500" /> },
  { id: 'cheat', label: 'Antojos', icon: <Flame className="w-3.5 h-3.5 text-purple-500" /> },
];

interface CardViewProps {
  card: MealCardItem;
  isTop: boolean;
  isFlipped: boolean;
  onToggleFlip: () => void;
  onSwipe: (direction: 'left' | 'right') => void;
  onToggleFavorite: (card: MealCardItem) => void;
  isFavorited: boolean;
  onOpenDelivery: (name: string) => void;
  exitDirection: 'left' | 'right' | null;
  pantry: string[];
  onNavigatePantry?: () => void;
}

const CardView: React.FC<CardViewProps> = ({
  card,
  isTop,
  isFlipped,
  onToggleFlip,
  onSwipe,
  onToggleFavorite,
  isFavorited,
  onOpenDelivery,
  exitDirection,
  pantry,
  onNavigatePantry,
}) => {
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(dragX, [30, 90], [0, 1]);
  const nopeOpacity = useTransform(dragX, [-30, -90], [0, 1]);

  const isCooking = card.type === 'cooking';

  // Pantry matching calculation
  const recipeIngredients = card.recipe?.allIngredientsFormatted || [];
  const matchedIngredients = recipeIngredients.filter(ing => 
    pantry.includes(ing.id) || pantry.includes(ing.name.toLowerCase().trim())
  );
  const missingIngredients = recipeIngredients.filter(ing => 
    !pantry.includes(ing.id) && !pantry.includes(ing.name.toLowerCase().trim())
  );

  const variants = {
    initial: isTop 
      ? { scale: 1, y: 0, opacity: 1 } 
      : { scale: 0.95, y: 8, opacity: 0.65 },
    animate: { 
      scale: 1, 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', damping: 24, stiffness: 300 } 
    },
    exit: (customDirection: 'left' | 'right' | null) => ({
      x: customDirection === 'right' ? 400 : -400,
      opacity: 0,
      rotate: customDirection === 'right' ? 18 : -18,
      transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
    }),
  };

  return (
    <motion.div
      custom={exitDirection}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={isTop ? { x: dragX, rotate: cardRotate, perspective: 1200 } : { perspective: 1200 }}
      drag={isTop && !isFlipped ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (!isFlipped) {
          if (info.offset.x > 75 || info.velocity.x > 400) {
            onSwipe('right');
          } else if (info.offset.x < -75 || info.velocity.x < -400) {
            onSwipe('left');
          }
        }
      }}
      className={`absolute inset-0 w-full h-full select-none ${
        isTop ? 'z-10' : 'pointer-events-none z-0'
      }`}
    >
      {/* Visual Drag Badges */}
      {isTop && !isFlipped && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-5 right-5 z-30 px-3.5 py-1 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold text-xs tracking-wide pointer-events-none shadow-md flex items-center gap-1"
          >
            <span>Me interesa</span>
            <Check className="w-3.5 h-3.5" />
          </motion.div>

          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-5 left-5 z-30 px-3.5 py-1 rounded-full bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-semibold text-xs tracking-wide pointer-events-none shadow-md flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Descartar</span>
          </motion.div>
        </>
      )}

      {/* 3D FLIPPABLE CONTAINER */}
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full relative"
      >
        {/* ================= FRONT FACE ================= */}
        <div
          onClick={onToggleFlip}
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden', 
            transform: 'rotateY(0deg)' 
          }}
          className="apple-card bg-white dark:bg-zinc-900 absolute inset-0 w-full h-full p-6 sm:p-7 flex flex-col justify-between overflow-hidden cursor-pointer shadow-lg border border-black/[0.08] dark:border-white/[0.08]"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs ${
                isCooking 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
              }`}>
                {isCooking ? <ChefHat className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                <span>{isCooking ? 'Cocinar en Casa' : 'Pedir Delivery'}</span>
              </span>

              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {card.timeEstimate}
              </span>
            </div>

            <button
              id="btn-card-star"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(card);
              }}
              className="p-2 rounded-full text-zinc-400 hover:text-amber-500 transition-colors btn-press cursor-pointer"
              title="Guardar en favoritos"
            >
              <Star className={`w-4 h-4 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Central Visual: Dish Hero */}
          <div className="flex flex-col items-center text-center space-y-3 my-auto py-2 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-5xl sm:text-6xl shadow-xs group-hover:scale-105 transition-transform">
              {card.imageEmoji}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                {card.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isCooking 
                  ? `${card.categoryLabel} • ${card.caloriesApprox || 'Casero'}`
                  : `${card.deliveryOption?.tags[0] || 'Delivery'} • ${card.caloriesApprox || 'Listo para pedir'}`}
              </p>
            </div>

            {/* Hint to Flip */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium shadow-2xs group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
              <RotateCw className="w-3.5 h-3.5 text-zinc-500" />
              <span>Toca en cualquier parte para girar</span>
            </div>
          </div>

          {/* Footer Info */}
          <div className="space-y-2 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold">
                {isCooking ? 'Ingredientes clave:' : 'Ingredientes principales:'}
              </span>

              <span className="text-zinc-900 dark:text-zinc-100 font-semibold hover:underline flex items-center gap-1">
                <span>{isCooking ? 'Ver Receta' : 'Ver Detalles'}</span>
                <RotateCw className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {card.ingredientsSummary.slice(0, 4).map((ing, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ================= BACK FACE (RECIPE & PANTRY DETAILS) ================= */}
        <div
          onClick={onToggleFlip}
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)' 
          }}
          className="apple-card bg-white dark:bg-zinc-900 absolute inset-0 w-full h-full p-6 sm:p-7 flex flex-col justify-between overflow-y-auto scrollbar-none cursor-pointer shadow-lg border border-black/[0.08] dark:border-white/[0.08]"
        >
          {/* Back Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{card.imageEmoji}</span>
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                  {card.name}
                </h4>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {isCooking ? `Receta Casera • ${card.timeEstimate}` : `Delivery • ${card.timeEstimate}`}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick(600);
                onToggleFlip();
              }}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 btn-press cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Volver a la portada"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px]">Volver</span>
            </button>
          </div>

          {/* Recipe Steps & Smart Pantry Connection */}
          <div className="py-3 space-y-3 flex-1 overflow-y-auto scrollbar-none">
            {isCooking && card.recipe ? (
              <div className="space-y-3">
                {/* Despensa Inteligente Connection Module */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      <span>Despensa Inteligente:</span>
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {matchedIngredients.length}/{recipeIngredients.length} en stock
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {recipeIngredients.map((ing, idx) => {
                      const hasIt = pantry.includes(ing.id) || pantry.includes(ing.name.toLowerCase().trim());
                      return (
                        <span
                          key={idx}
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            hasIt
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-500/20'
                          }`}
                        >
                          <span>{hasIt ? '✓' : '⚠️'}</span>
                          <span>{ing.name}</span>
                        </span>
                      );
                    })}
                  </div>

                  {onNavigatePantry && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick(750);
                        onNavigatePantry();
                      }}
                      className="w-full mt-1 py-1.5 px-3 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 btn-press cursor-pointer"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Ver mi Despensa Completa</span>
                    </button>
                  )}
                </div>

                {/* 3 Steps */}
                <div className="space-y-2">
                  <h5 className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">
                    Preparación en 3 Pasos:
                  </h5>
                  {card.recipe.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] flex items-start gap-2.5 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>

                {/* Chef Tip */}
                {card.recipe.chefTip && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p>
                      <strong className="font-semibold">Tip: </strong>
                      <span className="italic">"{card.recipe.chefTip}"</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Delivery Info */
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Descripción del Plato
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Ingredientes del plato:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {card.ingredientsSummary.map((ing, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Back Footer Action */}
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0">
            {isCooking ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick(600);
                  onToggleFlip();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs btn-press cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Volver a la portada del plato</span>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDelivery(card.name);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs btn-press cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Bike className="w-4 h-4" />
                <span>Buscar en Apps de Delivery</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const DecideTodayView: React.FC<DecideTodayViewProps> = ({
  pantry,
  exclusions,
  history,
  favorites,
  onAcceptMeal,
  onAddFavorite,
  onDeleteFavorite,
  onOpenBlindMode,
  onNavigatePantry,
}) => {
  // Fixed Modality: 'all' | 'cooking' | 'delivery'
  const [selectedModality, setSelectedModality] = useState<ModalityFilter>('all');
  
  // Dropdown Category: 'all' | 'quick' | 'meat' | ... | 'desserts' | 'cheat'
  const [selectedCategory, setSelectedCategory] = useState<FoodCategoryFilter>('all');

  const [cardDeck, setCardDeck] = useState<MealCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [likedCards, setLikedCards] = useState<MealCardItem[]>([]);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [duelThreshold, setDuelThreshold] = useState<number>(2);

  // Dropdown UI state
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sorteo / Duel State
  const [isDuelActive, setIsDuelActive] = useState<boolean>(false);
  const [duelWinner, setDuelWinner] = useState<MealCardItem | null>(null);
  const [isSpinningDuel, setIsSpinningDuel] = useState<boolean>(false);
  const duelTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDuelThreshold(loadDuelThreshold());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const deck = getUnifiedCardDataset(selectedModality, selectedCategory, exclusions, history, favorites);
    setCardDeck(deck);
    setCurrentIndex(0);
    setExitDirection(null);
    setIsFlipped(false);
  }, [selectedModality, selectedCategory, exclusions, history, favorites.length]);

  const currentCard = currentIndex < cardDeck.length ? cardDeck[currentIndex] : null;
  const nextCard = currentIndex + 1 < cardDeck.length ? cardDeck[currentIndex + 1] : null;

  const handleToggleFlip = () => {
    sound.playClick(850);
    triggerHaptic('light');
    setIsFlipped(prev => !prev);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentCard) return;

    setExitDirection(direction);
    setIsFlipped(false);

    if (direction === 'right') {
      sound.playClick(950);
      triggerHaptic('success');
      const updatedLikes = [...likedCards, currentCard];
      setLikedCards(updatedLikes);

      const targetThreshold = loadDuelThreshold();
      if (updatedLikes.length >= targetThreshold) {
        startRaffle(updatedLikes);
      }
    } else {
      sound.playTick(450);
      triggerHaptic('light');
    }

    setCurrentIndex(prev => prev + 1);
  };

  const startRaffle = (candidates: MealCardItem[]) => {
    if (candidates.length === 0) return;
    setIsDuelActive(true);
    setIsSpinningDuel(true);
    triggerHaptic('medium');

    let counter = 0;
    const totalFlips = 16;
    const intervalTime = 85;

    if (duelTimerRef.current) clearInterval(duelTimerRef.current);

    duelTimerRef.current = setInterval(() => {
      counter++;
      const pick = candidates[counter % candidates.length];
      setDuelWinner(pick);
      sound.playTick(600 + (counter * 25));
      triggerHaptic('light');

      if (counter >= totalFlips) {
        if (duelTimerRef.current) clearInterval(duelTimerRef.current);
        const finalWinner = candidates[Math.floor(Math.random() * candidates.length)];
        setDuelWinner(finalWinner);
        setIsSpinningDuel(false);
        sound.playSuccess();
        triggerHaptic('success');
        triggerVictoryConfetti();
      }
    }, intervalTime);
  };

  useEffect(() => {
    return () => {
      if (duelTimerRef.current) clearInterval(duelTimerRef.current);
    };
  }, []);

  const handleResetDeck = () => {
    sound.playClick(700);
    triggerHaptic('medium');
    const deck = getUnifiedCardDataset(selectedModality, selectedCategory, exclusions, history, favorites);
    setCardDeck(deck);
    setCurrentIndex(0);
    setLikedCards([]);
    setExitDirection(null);
    setIsFlipped(false);
  };

  const handleToggleFavorite = (card: MealCardItem) => {
    const isFav = isMealFavorited(card.name, favorites);
    if (isFav) {
      sound.playClick(500);
      const existing = favorites.find(f => f.name.toLowerCase().trim() === card.name.toLowerCase().trim());
      if (existing) onDeleteFavorite(existing.id);
      triggerHaptic('light');
    } else {
      sound.playClick(1000);
      if (card.recipe) {
        onAddFavorite(createFavoriteFromRecipe(card.recipe));
      } else {
        const newFav: UserFavoriteMeal = {
          id: `fav_${Date.now()}`,
          name: card.name,
          category: card.deliveryOption?.category || 'typical',
          priceLevel: card.deliveryOption?.priceLevel || '$$',
          deliveryTime: card.timeEstimate,
          tags: card.tags,
          description: card.description,
          ingredients: card.ingredientsSummary,
          imageEmoji: card.imageEmoji,
          caloriesApprox: card.caloriesApprox,
          vibe: card.vibe,
          source: card.type,
          createdAt: Date.now(),
        };
        onAddFavorite(newFav);
      }
      triggerHaptic('success');
    }
  };

  const handleOpenDelivery = (dishName: string) => {
    sound.playClick(800);
    const url = getDeliverySearchUrl(dishName);
    window.open(url, '_blank');
  };

  const currentCategoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Categorías';

  return (
    <div className="w-full flex flex-col gap-4 max-w-md mx-auto pb-12">
      {/* TOP HEADER: ¿QUÉ COMEMOS HOY? & BOTÓN ¡TENGO HAMBRE! */}
      <div className="flex items-center justify-between gap-3 pt-1 pb-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            ¿QUÉ COMEMOS HOY?
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Desliza o presiona las flechas para elegir tu plato
          </p>
        </div>

        <button
          id="btn-main-blind-mode"
          onClick={() => {
            sound.playClick(1000);
            onOpenBlindMode();
          }}
          className="px-3.5 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center gap-1.5 shadow-xs btn-press cursor-pointer shrink-0"
          title="Decisión Inmediata: ¡Tengo Hambre!"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span>¡Tengo Hambre!</span>
        </button>
      </div>

      {/* FILTER CONTROLS (MODALITY FIXED ON TOP, CATEGORY DROPDOWN DIRECTLY UNDERNEATH) */}
      <div className="space-y-2 p-3 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/70 border border-black/[0.04] dark:border-white/[0.06] relative z-20">
        {/* Row 1: Fixed Modality Selector */}
        <div className="flex items-center gap-1.5">
          {MODALITIES.map(mod => {
            const isSelected = selectedModality === mod.id;
            return (
              <button
                key={mod.id}
                id={`btn-modality-${mod.id}`}
                onClick={() => {
                  sound.playClick(isSelected ? 600 : 800);
                  setSelectedModality(mod.id);
                  triggerHaptic('light');
                }}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 btn-press cursor-pointer border ${
                  isSelected
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-semibold shadow-xs'
                    : 'bg-white dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {mod.icon}
                <span className="truncate">{mod.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Categories Dropdown directly underneath */}
        <div ref={dropdownRef} className="relative w-full">
          <button
            onClick={() => {
              sound.playClick(750);
              setIsCategoryOpen(prev => !prev);
            }}
            className={`w-full py-2 px-3.5 rounded-xl text-xs font-medium border flex items-center justify-between transition-all shadow-xs btn-press cursor-pointer ${
              selectedCategory !== 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-semibold'
                : 'bg-white dark:bg-zinc-950 border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold">{currentCategoryLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Floating Dropdown Popover */}
          <AnimatePresence>
            {isCategoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                className="absolute left-0 right-0 top-full mt-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl z-50 space-y-0.5"
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  Filtrar por Categoría
                </div>
                {CATEGORIES.map(cat => {
                  const isCatSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        sound.playClick(isCatSelected ? 600 : 850);
                        setSelectedCategory(cat.id);
                        setIsCategoryOpen(false);
                        triggerHaptic('light');
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors btn-press cursor-pointer ${
                        isCatSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {cat.icon}
                        <span>{cat.label}</span>
                      </div>
                      {isCatSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Counter & Sorteo Threshold Notice */}
      <div className="flex items-center justify-between px-1 text-xs">
        <span className="text-zinc-600 dark:text-zinc-400 font-medium">
          Sorteo: {likedCards.length}/{duelThreshold} opciones seleccionadas
        </span>

        {likedCards.length > 0 && likedCards.length < duelThreshold && (
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold animate-pulse">
            Elige {duelThreshold - likedCards.length} más para sortear
          </span>
        )}
      </div>

      {/* SWIPEABLE CARD CONTAINER WITH FLOATING LATERAL ARROWS (STRICT FIXED HEIGHT) */}
      <div className="relative w-full h-[460px] min-h-[460px] max-h-[460px] flex items-center justify-center z-10 overflow-hidden">
        {/* Floating Lateral Navigation Arrows */}
        {currentCard && (
          <>
            <button
              onClick={() => handleSwipe('left')}
              className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] text-zinc-600 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 hover:scale-110 shadow-md flex items-center justify-center btn-press cursor-pointer transition-all"
              title="Descartar plato (Deslizar izquierda)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleSwipe('right')}
              className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:scale-110 shadow-md flex items-center justify-center btn-press cursor-pointer transition-all"
              title="Me interesa (Deslizar derecha)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Next Card behind (COMPLETELY HIDDEN while active card is flipped to prevent show-through) */}
        {nextCard && !isFlipped && (
          <CardView
            key={nextCard.id}
            card={nextCard}
            isTop={false}
            isFlipped={false}
            onToggleFlip={() => {}}
            onSwipe={handleSwipe}
            onToggleFavorite={handleToggleFavorite}
            isFavorited={isMealFavorited(nextCard.name, favorites)}
            onOpenDelivery={handleOpenDelivery}
            exitDirection={null}
            pantry={pantry}
            onNavigatePantry={onNavigatePantry}
          />
        )}

        <AnimatePresence mode="popLayout" custom={exitDirection}>
          {currentCard ? (
            <CardView
              key={currentCard.id}
              card={currentCard}
              isTop={true}
              isFlipped={isFlipped}
              onToggleFlip={handleToggleFlip}
              onSwipe={handleSwipe}
              onToggleFavorite={handleToggleFavorite}
              isFavorited={isMealFavorited(currentCard.name, favorites)}
              onOpenDelivery={handleOpenDelivery}
              exitDirection={exitDirection}
              pantry={pantry}
              onNavigatePantry={onNavigatePantry}
            />
          ) : (
            <div className="apple-card w-full h-full p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Has visto todas las opciones
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {likedCards.length > 0
                    ? `Guardaste ${likedCards.length} opciones en tus tentaciones.`
                    : 'Vuelve a barajar o prueba con otro filtro.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={handleResetDeck}
                  className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center gap-1.5 btn-press cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Barajar de nuevo</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick(900);
                    onOpenBlindMode();
                  }}
                  className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium text-xs btn-press cursor-pointer"
                >
                  <span>¡Tengo Hambre!</span>
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ACTION BUTTONS (RIGID UNMOVABLE FOOTER) */}
      {currentCard && (
        <div className="pt-2 flex items-center justify-center gap-3 shrink-0 h-14">
          {/* Reject Button */}
          <button
            id="btn-swipe-nope"
            onClick={() => handleSwipe('left')}
            className="flex-1 h-12 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1] text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center gap-2 shadow-xs btn-press cursor-pointer font-semibold text-xs transition-colors"
            title="Descartar plato"
          >
            <X className="w-4 h-4 stroke-[2]" />
            <span>Descartar</span>
          </button>

          {/* Flip Card / Recipe Button (FIXED WIDTH TO PREVENT SHIFT) */}
          <button
            id="btn-swipe-flip"
            onClick={handleToggleFlip}
            className={`w-32 h-12 rounded-2xl border flex items-center justify-center gap-1.5 shadow-xs btn-press cursor-pointer font-semibold text-xs shrink-0 transition-colors ${
              isFlipped
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-black/[0.08] dark:border-white/[0.08]'
            }`}
            title="Dar vuelta la tarjeta para ver la receta"
          >
            <RotateCw className="w-4 h-4 stroke-[2]" />
            <span>{isFlipped ? 'Ver Portada' : 'Ver Receta'}</span>
          </button>

          {/* Like Button */}
          <button
            id="btn-swipe-like"
            onClick={() => handleSwipe('right')}
            className="flex-1 h-12 px-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center gap-2 shadow-sm btn-press cursor-pointer font-semibold text-xs transition-colors"
            title="Elegir opción para el sorteo"
          >
            <Heart className="w-4 h-4 fill-current stroke-[2]" />
            <span>Me interesa</span>
          </button>
        </div>
      )}

      {/* FINAL RAFFLE / DUEL MODAL */}
      <AnimatePresence>
        {isDuelActive && duelWinner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="apple-card relative w-full max-w-sm p-6 sm:p-7 space-y-5 text-center overflow-hidden"
            >
              {/* Close */}
              <button
                onClick={() => {
                  sound.playClick(600);
                  setIsDuelActive(false);
                  setLikedCards([]);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 btn-press cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Sorteo Final ({likedCards.length} opciones)
                </span>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {isSpinningDuel ? 'Sorteando tu comida...' : '¡Plato Ganador!'}
                </h3>
              </div>

              {/* Winner Visual */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="text-5xl">
                  {duelWinner.imageEmoji}
                </div>

                <div className="space-y-0.5">
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block ${
                    duelWinner.type === 'cooking'
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                  }`}>
                    {duelWinner.type === 'cooking' ? '🍳 Cocinar en Casa' : '🛵 Pedir Delivery'}
                  </span>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {duelWinner.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {duelWinner.timeEstimate} • {duelWinner.categoryLabel}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!isSpinningDuel && (
                <div className="space-y-2 pt-1">
                  {duelWinner.type === 'delivery' ? (
                    <button
                      id="btn-duel-delivery"
                      onClick={() => handleOpenDelivery(duelWinner.name)}
                      className="w-full py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 btn-press cursor-pointer"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Buscar en apps de delivery</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    duelWinner.recipe && (
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 text-left space-y-1">
                        <strong className="font-semibold">Paso 1: </strong>{duelWinner.recipe.steps[0]}
                      </div>
                    )
                  )}

                  <button
                    onClick={() => {
                      sound.playSuccess();
                      triggerHaptic('success');
                      onAcceptMeal(
                        duelWinner.name,
                        duelWinner.type,
                        duelWinner.imageEmoji,
                        `Sorteo • ${duelWinner.timeEstimate}`
                      );
                      setIsDuelActive(false);
                      setLikedCards([]);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5 btn-press cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar en historial de comidas</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
