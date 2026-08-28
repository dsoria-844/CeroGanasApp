import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Flame, 
  Clock, 
  Check, 
  X, 
  Heart, 
  RotateCcw, 
  ExternalLink, 
  ChefHat, 
  Star, 
  Utensils, 
  Sparkles, 
  CheckCircle2, 
  Dices,
  Info
} from 'lucide-react';
import { MealCardItem, MoodFilter, MealHistoryItem, UserFavoriteMeal, Recipe } from '../types';
import { 
  getUnifiedCardDataset, 
  triggerHaptic, 
  triggerVictoryConfetti, 
  isMealFavorited,
  createFavoriteFromRecipe
} from '../utils/storage';

interface DecideTodayViewProps {
  exclusions: string[];
  history: MealHistoryItem[];
  favorites: UserFavoriteMeal[];
  onAcceptMeal: (mealName: string, type: 'delivery' | 'cooking', emoji: string, details?: string) => void;
  onAddFavorite: (meal: UserFavoriteMeal) => void;
  onDeleteFavorite: (id: string) => void;
  onOpenRecipeModal: (recipe: Recipe) => void;
  onOpenBlindMode: () => void;
}

const MOOD_PILLS: { id: MoodFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos', icon: '🍽️' },
  { id: 'quick', label: 'Cero Ganas (<15 min)', icon: '⚡' },
  { id: 'protein', label: 'Alto en Proteína', icon: '💪' },
  { id: 'cheat', label: 'Cheat Meal / Delivery', icon: '🍔' },
  { id: 'chef', label: 'Modo Chef', icon: '👨‍🍳' },
];

export const DecideTodayView: React.FC<DecideTodayViewProps> = ({
  exclusions,
  history,
  favorites,
  onAcceptMeal,
  onAddFavorite,
  onDeleteFavorite,
  onOpenRecipeModal,
  onOpenBlindMode,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodFilter>('all');
  const [cardDeck, setCardDeck] = useState<MealCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [likedCards, setLikedCards] = useState<MealCardItem[]>([]);
  
  // Duel / Face-Off Modal State
  const [isDuelActive, setIsDuelActive] = useState<boolean>(false);
  const [duelWinner, setDuelWinner] = useState<MealCardItem | null>(null);
  const [isSpinningDuel, setIsSpinningDuel] = useState<boolean>(false);
  const duelTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Motion values for swipe drag
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-200, 200], [-18, 18]);
  const cardOpacity = useTransform(dragX, [-250, -100, 0, 100, 250], [0.5, 0.9, 1, 0.9, 0.5]);
  const likeBadgeOpacity = useTransform(dragX, [20, 100], [0, 1]);
  const nopeBadgeOpacity = useTransform(dragX, [-20, -100], [0, 1]);

  // Load cards when mood changes or exclusions change
  useEffect(() => {
    const deck = getUnifiedCardDataset(selectedMood, exclusions, history, favorites);
    setCardDeck(deck);
    setCurrentIndex(0);
  }, [selectedMood, exclusions, history, favorites.length]);

  const currentCard = currentIndex < cardDeck.length ? cardDeck[currentIndex] : null;

  // Swipe Action Handler
  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentCard) return;

    if (direction === 'right') {
      // User is tempted!
      triggerHaptic('success');
      const updatedLikes = [...likedCards, currentCard];
      setLikedCards(updatedLikes);

      if (updatedLikes.length === 2) {
        // Trigger Duel Modal!
        startDuel(updatedLikes[0], updatedLikes[1]);
      }
    } else {
      // User discarded
      triggerHaptic('light');
    }

    setCurrentIndex(prev => prev + 1);
  };

  // Start Duel between 2 liked cards
  const startDuel = (meal1: MealCardItem, meal2: MealCardItem) => {
    setIsDuelActive(true);
    setIsSpinningDuel(true);
    triggerHaptic('medium');

    let counter = 0;
    const totalFlips = 14;
    const intervalTime = 90;

    if (duelTimerRef.current) clearInterval(duelTimerRef.current);

    duelTimerRef.current = setInterval(() => {
      counter++;
      const pick = counter % 2 === 0 ? meal1 : meal2;
      setDuelWinner(pick);
      triggerHaptic('light');

      if (counter >= totalFlips) {
        if (duelTimerRef.current) clearInterval(duelTimerRef.current);
        const finalWinner = Math.random() > 0.5 ? meal1 : meal2;
        setDuelWinner(finalWinner);
        setIsSpinningDuel(false);
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
    triggerHaptic('medium');
    const deck = getUnifiedCardDataset(selectedMood, exclusions, history, favorites);
    setCardDeck(deck);
    setCurrentIndex(0);
    setLikedCards([]);
  };

  const handleToggleFavorite = (card: MealCardItem) => {
    const isFav = isMealFavorited(card.name, favorites);
    if (isFav) {
      const existing = favorites.find(f => f.name.toLowerCase().trim() === card.name.toLowerCase().trim());
      if (existing) onDeleteFavorite(existing.id);
      triggerHaptic('light');
    } else {
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
    const query = encodeURIComponent(dishName);
    window.open(`https://www.google.com/search?q=${query}+delivery+pedir`, '_blank');
  };

  const isCurrentCardFavorited = currentCard ? isMealFavorited(currentCard.name, favorites) : false;

  return (
    <div className="w-full flex flex-col gap-5 max-w-xl mx-auto pb-12">
      {/* Mood / Energy Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MOOD_PILLS.map(pill => {
          const isSelected = selectedMood === pill.id;
          return (
            <button
              key={pill.id}
              id={`btn-mood-${pill.id}`}
              onClick={() => {
                setSelectedMood(pill.id);
                triggerHaptic('light');
              }}
              className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress & Tentación Counter Banner */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">
            Duelo de Elección:
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-amber-300">
            💚 {likedCards.length}/2 tentaciones elegidas
          </span>
        </div>

        {likedCards.length === 1 && (
          <span className="text-[11px] font-medium text-emerald-400 animate-pulse">
            ¡Elige 1 más para el sorteo final!
          </span>
        )}
      </div>

      {/* SWIPEABLE CARD CONTAINER */}
      <div className="relative w-full h-[460px] sm:h-[480px] flex items-center justify-center">
        {currentCard ? (
          <motion.div
            key={currentCard.id}
            style={{ x: dragX, rotate: cardRotate, opacity: cardOpacity }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={(_, info) => {
              if (info.offset.x > 90) {
                handleSwipe('right');
              } else if (info.offset.x < -90) {
                handleSwipe('left');
              }
            }}
            className="absolute inset-0 w-full h-full rounded-3xl bg-zinc-900 border border-zinc-800 p-6 sm:p-7 shadow-2xl flex flex-col justify-between cursor-grab active:cursor-grabbing select-none overflow-hidden"
          >
            {/* Visual Swipe Badges on Drag */}
            <motion.div
              style={{ opacity: likeBadgeOpacity }}
              className="absolute top-5 right-5 z-20 px-4 py-1.5 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-bold text-sm font-mono tracking-wider rotate-12 shadow-lg"
            >
              💚 ME TIENTA
            </motion.div>

            <motion.div
              style={{ opacity: nopeBadgeOpacity }}
              className="absolute top-5 left-5 z-20 px-4 py-1.5 rounded-2xl bg-red-500/20 border-2 border-red-400 text-red-300 font-bold text-sm font-mono tracking-wider -rotate-12 shadow-lg"
            >
              ❌ PASO
            </motion.div>

            {/* Top Category & Time Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border ${
                  currentCard.type === 'delivery'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                }`}>
                  {currentCard.categoryLabel}
                </span>

                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  {currentCard.timeEstimate}
                </span>
              </div>

              {/* Quick favorite star toggle */}
              <button
                id="btn-card-star"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(currentCard);
                }}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isCurrentCardFavorited
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Guardar en mis favoritos"
              >
                <Star className={`w-4 h-4 ${isCurrentCardFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            </div>

            {/* Central Visual: Emoji & Name */}
            <div className="flex flex-col items-center text-center space-y-3 my-auto py-2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-950 border border-zinc-800/90 flex items-center justify-center text-6xl shadow-inner">
                {currentCard.imageEmoji}
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-light text-zinc-50 tracking-tight leading-tight">
                  {currentCard.name}
                </h3>
                {currentCard.caloriesApprox && (
                  <p className="text-xs font-mono text-zinc-400">
                    🔥 {currentCard.caloriesApprox}
                  </p>
                )}
              </div>

              <p className="text-xs text-zinc-300 italic font-serif max-w-sm">
                "{currentCard.vibe}"
              </p>
            </div>

            {/* Key Ingredients Summary */}
            <div className="space-y-2 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>Ingredientes clave:</span>
                {currentCard.type === 'cooking' && currentCard.recipe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentCard.recipe) onOpenRecipeModal(currentCard.recipe);
                    }}
                    className="text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Ver pasos</span>
                    <Utensils className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {currentCard.ingredientsSummary.slice(0, 4).map((ing, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Deck Finished Empty State */
          <div className="w-full h-full rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-3xl">
              🎉
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-zinc-100">
                ¡Has visto todas las opciones de este filtro!
              </h3>
              <p className="text-xs text-zinc-400">
                {likedCards.length > 0
                  ? `Marcaste ${likedCards.length} opciones como tentadoras.`
                  : 'Reinicia las tarjetas o cambia de estado de ánimo.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleResetDeck}
                className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Volver a barajar</span>
              </button>

              <button
                onClick={onOpenBlindMode}
                className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>⚡ Modo A Ciegas</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TINDER SWIPE ACTION BUTTONS */}
      {currentCard && (
        <div className="flex items-center justify-center gap-6 pt-2">
          {/* Reject / Swipe Left Button */}
          <button
            id="btn-swipe-nope"
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-red-500/30 hover:border-red-500 text-red-400 hover:bg-red-500/10 flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer"
            title="Descartar (Swipe Izquierda)"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Quick Details / Recipe Modal Button */}
          {currentCard.type === 'cooking' && currentCard.recipe && (
            <button
              onClick={() => {
                if (currentCard.recipe) onOpenRecipeModal(currentCard.recipe);
              }}
              className="w-11 h-11 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 flex items-center justify-center transition-all cursor-pointer"
              title="Ver receta"
            >
              <ChefHat className="w-5 h-5 text-amber-400" />
            </button>
          )}

          {/* Like / Swipe Right Button */}
          <button
            id="btn-swipe-like"
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer"
            title="Me tienta (Swipe Derecha)"
          >
            <Heart className="w-7 h-7 fill-emerald-400/20" />
          </button>
        </div>
      )}

      {/* DUEL / TIE-BREAKER FINAL MODAL */}
      <AnimatePresence>
        {isDuelActive && duelWinner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl space-y-6 text-center overflow-hidden"
            >
              {/* Close */}
              <button
                onClick={() => {
                  setIsDuelActive(false);
                  setLikedCards([]);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sorteo Final entre tus Tentaciones</span>
                </div>
                <h3 className="text-2xl font-light text-zinc-100 pt-1">
                  {isSpinningDuel ? 'Definiendo al ganador...' : '¡Tenemos Plato Ganador!'}
                </h3>
              </div>

              {/* Winner Visual Card */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className={`text-6xl ${isSpinningDuel ? 'animate-spin' : 'animate-bounce'}`}>
                  {duelWinner.imageEmoji}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                    {isSpinningDuel ? 'Sorteando...' : '🏆 SELECCIÓN GANADORA'}
                  </span>
                  <h4 className="text-2xl font-semibold text-zinc-50">
                    {duelWinner.name}
                  </h4>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                    ⏱️ {duelWinner.timeEstimate}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800">
                    {duelWinner.categoryLabel}
                  </span>
                </div>
              </div>

              {/* Contextual Action Buttons */}
              {!isSpinningDuel && (
                <div className="space-y-2.5 pt-2">
                  {duelWinner.type === 'delivery' ? (
                    <button
                      id="btn-duel-delivery"
                      onClick={() => handleOpenDelivery(duelWinner.name)}
                      className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer shadow-lg"
                    >
                      <span>🛵 Abrir en app de delivery / Buscar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    duelWinner.recipe && (
                      <button
                        onClick={() => {
                          setIsDuelActive(false);
                          if (duelWinner.recipe) onOpenRecipeModal(duelWinner.recipe);
                        }}
                        className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver Receta en 3 Pasos</span>
                      </button>
                    )
                  )}

                  <button
                    onClick={() => {
                      triggerHaptic('success');
                      onAcceptMeal(
                        duelWinner.name,
                        duelWinner.type,
                        duelWinner.imageEmoji,
                        `Duelo de Tentaciones • ${duelWinner.timeEstimate}`
                      );
                      setIsDuelActive(false);
                      setLikedCards([]);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Hoy como esto! Guardar en Historial</span>
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
