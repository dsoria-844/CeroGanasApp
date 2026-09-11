import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'motion/react';
import { 
  Heart, 
  Star,
  X, 
  RotateCw, 
  ChefHat, 
  Bike, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  Check, 
  CheckCircle2,
  Volume2, 
  VolumeX, 
  Zap, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Flame,
  Utensils,
  UtensilsCrossed,
  Layers,
  Cake,
  Clock,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Dices,
  Info,
  ArrowLeft
} from 'lucide-react';
import { 
  MealCardItem, 
  ModalityFilter, 
  FoodCategoryFilter, 
  MealHistoryItem, 
  UserFavoriteMeal 
} from '../types';
import { 
  getUnifiedCardDataset, 
  triggerHaptic, 
  triggerVictoryConfetti, 
  isMealFavorited, 
  createFavoriteFromRecipe, 
  loadDuelThreshold, 
  loadDuelEnabled, 
  loadPreferredModality, 
  savePreferredModality, 
  getDeliverySearchUrl 
} from '../utils/storage';
import { sound } from '../utils/audio';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useRaffle } from '../hooks/useRaffle';
import { RaffleModal } from './RaffleModal';
import { CandidateReviewModal } from './CandidateReviewModal';
import { PlateDetailsSheet } from './PlateDetailsSheet';

interface DecideTodayViewProps {
  exclusions: string[];
  history: MealHistoryItem[];
  favorites: UserFavoriteMeal[];
  pantry: string[];
  onAcceptMeal: (mealName: string, type: 'delivery' | 'cooking', emoji: string, details?: string) => void;
  onAddFavorite: (favorite: UserFavoriteMeal) => void;
  onDeleteFavorite: (id: string) => void;
  onOpenBlindMode: () => void;
  onOpenRecipeModal?: (item: MealCardItem) => void;
  onNavigatePantry?: () => void;
  onNavigatePlan?: () => void;
}

// Modalidades Dropdown Options
const MODALITIES: { id: ModalityFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Modalidad', icon: <UtensilsCrossed className="w-3.5 h-3.5 text-zinc-500" /> },
  { id: 'cooking', label: 'Cocinar', icon: <ChefHat className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'delivery', label: 'Delivery', icon: <Bike className="w-3.5 h-3.5 text-amber-500" /> },
];

// Categorías Dropdown Options
const CATEGORIES: { id: FoodCategoryFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todas las categorías', icon: <Sparkles className="w-3.5 h-3.5 text-zinc-500" /> },
  { id: 'quick', label: 'Rápido (<15 min)', icon: <Clock className="w-3.5 h-3.5 text-blue-500" /> },
  { id: 'meat', label: 'Carnes y Parrilla', icon: <Flame className="w-3.5 h-3.5 text-rose-500" /> },
  { id: 'pasta', label: 'Pastas y Olla', icon: <Utensils className="w-3.5 h-3.5 text-amber-500" /> },
  { id: 'sandwiches', label: 'Sandwiches y Minutas', icon: <Layers className="w-3.5 h-3.5 text-orange-500" /> },
  { id: 'empanadas', label: 'Empanadas y Entradas', icon: <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> },
  { id: 'protein', label: 'Alto en Proteína', icon: <Utensils className="w-3.5 h-3.5 text-emerald-500" /> },
  { id: 'desserts', label: 'Postres y Golosinas', icon: <Cake className="w-3.5 h-3.5 text-pink-500" /> },
  { id: 'cheat', label: 'Antojos', icon: <Flame className="w-3.5 h-3.5 text-purple-500" /> },
];

// Format calories cleanly avoiding double "kcal" bug
const formatCalories = (rawCal?: string): string => {
  if (!rawCal) return '';
  const numOnly = rawCal.replace(/[^0-9]/g, '').trim();
  if (!numOnly) return '';
  return `~${numOnly} kcal`;
};

// Derive short, scannable vibe/attribute from existing dish data
const getCompactAttribute = (card: MealCardItem): string => {
  const combined = `${card.tags?.join(' ') || ''} ${card.vibe || ''} ${card.name || ''} ${card.categoryLabel || ''} ${card.recipe?.difficulty || ''}`.toLowerCase();

  if (combined.includes('picante') || combined.includes('picor') || combined.includes('ají') || combined.includes('aji')) {
    return '🌶️ Picante';
  }
  if (combined.includes('dulce') || combined.includes('postre') || combined.includes('chocolate') || combined.includes('chocotorta') || combined.includes('helado') || combined.includes('golosina') || combined.includes('dulce_de_leche')) {
    return '🍫 Dulce';
  }
  if (combined.includes('intenso') || combined.includes('ahumado') || combined.includes('espeso') || combined.includes('reconstituyente')) {
    return '🔥 Intenso';
  }
  if (combined.includes('parrilla') || combined.includes('asado') || combined.includes('brasas') || combined.includes('vacío') || combined.includes('vacio') || combined.includes('bife')) {
    return '🥩 Parrillero';
  }
  if (combined.includes('proteico') || combined.includes('proteína') || combined.includes('proteina')) {
    return '💪 Proteico';
  }
  if (combined.includes('rápido') || combined.includes('rapido') || combined.includes('express') || combined.includes('minuta')) {
    return '⚡ Rápido';
  }
  if (combined.includes('antojo') || combined.includes('cheat') || combined.includes('frit') || combined.includes('bacon')) {
    return '🍟 Antojo';
  }
  if (combined.includes('saludable') || combined.includes('healthy') || combined.includes('liviano') || combined.includes('fresco') || combined.includes('ensalada') || combined.includes('vegetariano')) {
    return '🥗 Liviano';
  }
  if (card.recipe?.difficulty) {
    if (card.recipe.difficulty === 'Fácil') return '✨ Fácil';
    if (card.recipe.difficulty === 'Rápida') return '⚡ Rápida';
    if (card.recipe.difficulty === 'Media') return '👨‍🍳 Media';
  }
  if (combined.includes('casero') || combined.includes('olla') || combined.includes('guiso')) {
    return '🍲 Casero';
  }
  if (combined.includes('clasico') || combined.includes('clásico') || combined.includes('tradicional') || combined.includes('típico') || combined.includes('tipico') || combined.includes('criollo')) {
    return '😋 Clásico';
  }

  if (card.vibe && card.vibe.length <= 14) {
    return card.vibe;
  }

  return '😋 Clásico';
};

export type RoundFlowState = 
  | 'IDLE' 
  | 'SELECTING' 
  | 'READY_TO_DRAW' 
  | 'DRAWING' 
  | 'WINNER' 
  | 'COMPLETED';

export const DecideTodayView: React.FC<DecideTodayViewProps> = ({
  exclusions,
  history,
  favorites,
  pantry,
  onAcceptMeal,
  onAddFavorite,
  onDeleteFavorite,
  onOpenBlindMode,
  onOpenRecipeModal,
  onNavigatePantry,
  onNavigatePlan,
}) => {
  // View Mode: 'hub' (¿Querés que decida yo o vos?) vs 'deck' (20 cards)
  const [viewMode, setViewMode] = useState<'hub' | 'deck'>('hub');

  // Dropdown States
  const [selectedModality, setSelectedModality] = useState<ModalityFilter>(() => loadPreferredModality());
  const [selectedCategory, setSelectedCategory] = useState<FoodCategoryFilter>('all');
  const [isModalityOpen, setIsModalityOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const modalityDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Deck & Navigation State
  const [cardDeck, setCardDeck] = useState<MealCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const [likedCards, setLikedCards] = useState<MealCardItem[]>([]);
  const [rejectedCards, setRejectedCards] = useState<MealCardItem[]>([]);
  const [duelThreshold, setDuelThreshold] = useState<number>(5);
  const [isDuelFeatureEnabled, setIsDuelFeatureEnabled] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const isLockedRef = useRef<boolean>(false);
  const hasAutoRaffledRef = useRef<boolean>(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [interactionCount, setInteractionCount] = useState<number>(0);

  // Motion drag gesture values (Emil Kowalski physics)
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-8, 8]);

  // Shared Raffle Hook
  const {
    raffleState,
    isDuelActive,
    isPreparingRaffle,
    isSpinningDuel,
    duelWinner,
    duelCandidateCount,
    drawingCandidates,
    activeCandidate,
    activeCandidateIndex,
    shownWinnerIds,
    eligibleCandidates,
    remainingCount,
    canReroll,
    roundId,
    startRaffleWithPrep,
    startRaffleImmediately,
    rerollRaffle,
    resetRerolls,
    closeRaffle,
  } = useRaffle();

  const CANDIDATE_TARGET = 5;

  // Single Source of Truth for Round Functional State Machine
  const roundFlowState: RoundFlowState = useMemo(() => {
    if (raffleState === 'DRAWING') return 'DRAWING';
    if (raffleState === 'WINNER') return 'WINNER';
    if (viewMode === 'hub') return 'IDLE';
    if (likedCards.length >= CANDIDATE_TARGET) return 'READY_TO_DRAW';
    return 'SELECTING';
  }, [raffleState, viewMode, likedCards.length]);

  // Derived Functional State
  const hasEnoughCandidates = likedCards.length === CANDIDATE_TARGET;
  const canDraw = roundFlowState === 'READY_TO_DRAW';
  const canInteractWithDeck = roundFlowState === 'SELECTING' || roundFlowState === 'READY_TO_DRAW';
  const canRetry = roundFlowState === 'WINNER' && remainingCount > 0;

  const [isRaffleRequirementOpen, setIsRaffleRequirementOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const isRafflingRef = useRef<boolean>(false);
  const isFinishingRoundRef = useRef<boolean>(false);

  // Load 20 Random Meals Batch (preserve candidates when switching filters)
  const loadRandomBatch = useCallback((preserveLikes: boolean = false) => {
    const fullDataset = getUnifiedCardDataset(selectedModality, selectedCategory, exclusions, history, favorites);
    const shuffled = [...fullDataset].sort(() => Math.random() - 0.5);
    const batch20 = shuffled.slice(0, 20);
    setCardDeck(batch20);
    setCurrentIndex(0);
    setDirection(0);
    if (!preserveLikes) {
      setLikedCards([]);
      hasAutoRaffledRef.current = false;
    }
    setRejectedCards([]);
  }, [selectedModality, selectedCategory, exclusions, history, favorites]);

  // Centralized round completion & teardown (finishRound / RESET_ROUND):
  // Completes current round, saves final winner to history, resets candidates, clears locks & closes raffle.
  const finishRound = useCallback((winnerMeal?: MealCardItem | null) => {
    if (isFinishingRoundRef.current) return;
    isFinishingRoundRef.current = true;

    try {
      if (winnerMeal) {
        onAcceptMeal(
          winnerMeal.name,
          winnerMeal.type,
          winnerMeal.imageEmoji,
          `Sorteo • ${winnerMeal.timeEstimate}`
        );
      }
      closeRaffle();
      setIsReviewOpen(false);
      setIsDetailsOpen(false);
      isLockedRef.current = false;
      setIsLocked(false);
      isRafflingRef.current = false;
      hasAutoRaffledRef.current = false;
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      // RESET CANDIDATES SO NEXT ROUND STARTS COMPLETELY CLEAN (0/5)
      setLikedCards([]);
      setRejectedCards([]);
      // Reload a fresh batch of 20 cards starting at index 0 for the clean new round
      loadRandomBatch(false);
    } finally {
      setTimeout(() => {
        isFinishingRoundRef.current = false;
      }, 200);
    }
  }, [onAcceptMeal, closeRaffle, loadRandomBatch]);

  const handleCompleteRound = finishRound;

  // Handle individual candidate removal from review modal
  const handleRemoveCandidate = useCallback((candidateId: string) => {
    if (isLockedRef.current || isLocked || !canInteractWithDeck) return;
    sound.playTick(400);
    triggerHaptic('light');
    setLikedCards(prev => {
      const removed = prev.find(c => c.id === candidateId);
      if (removed) {
        setRejectedCards(rej => rej.some(r => r.id === candidateId) ? rej : [...rej, removed]);
      }
      return prev.filter(c => c.id !== candidateId);
    });
  }, [isLocked, isDuelActive, canInteractWithDeck]);

  // Lock body scroll when duel, requirement modal, review modal or details sheet is open
  useBodyScrollLock(isDuelActive || isRaffleRequirementOpen || isReviewOpen || isDetailsOpen);

  // Auto-cleanup: Ensure isLocked is never stuck when raffle is inactive and not transitioning
  useEffect(() => {
    if (!isDuelActive && !transitionTimerRef.current) {
      isLockedRef.current = false;
      setIsLocked(false);
      isRafflingRef.current = false;
    }
  }, [isDuelActive]);

  useEffect(() => {
    setSelectedModality(loadPreferredModality());
    setDuelThreshold(loadDuelThreshold());
    setIsDuelFeatureEnabled(loadDuelEnabled());
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalityDropdownRef.current && !modalityDropdownRef.current.contains(event.target as Node)) {
        setIsModalityOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Preserve likedCards across filter changes so selections are never silently wiped!
    loadRandomBatch(true);
  }, [selectedModality, selectedCategory, exclusions, history, favorites.length, loadRandomBatch]);

  const currentCard = currentIndex < cardDeck.length ? cardDeck[currentIndex] : null;
  const nextCard = currentIndex + 1 < cardDeck.length ? cardDeck[currentIndex + 1] : null;
  const isDraggingRef = useRef(false);

  // Reset x motion value on card changes
  useEffect(() => {
    x.set(0);
    isDraggingRef.current = false;
  }, [currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 0 && !isLockedRef.current && !isLocked && canInteractWithDeck) {
      x.set(0);
      sound.playClick(650);
      triggerHaptic('light');
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    x.set(0);
    setDirection(1);
    if (currentIndex + 1 < cardDeck.length) {
      sound.playClick(750);
      triggerHaptic('light');
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of 20 batch: load next batch of 20
      sound.playSuccess();
      triggerHaptic('medium');
      loadRandomBatch(likedCards.length > 0);
    }
  };

  const handleReject = () => {
    if (!currentCard || isLockedRef.current || isLocked || !canInteractWithDeck) return;
    setInteractionCount(prev => prev + 1);
    x.set(0);
    sound.playTick(450);
    triggerHaptic('light');
    setDirection(1);
    
    // Remove from liked if it was liked
    setLikedCards(prev => {
      const next = prev.filter(c => c.id !== currentCard.id);
      if (next.length < CANDIDATE_TARGET) {
        hasAutoRaffledRef.current = false;
      }
      return next;
    });
    
    // Toggle rejection or add to rejected
    setRejectedCards(prev => {
      if (prev.some(c => c.id === currentCard.id)) return prev;
      return [...prev, currentCard];
    });
    
    handleNext();
  };

  const handleLike = () => {
    if (!currentCard || isLockedRef.current || isLocked || !canInteractWithDeck) return;

    // Check if adding this card reaches target
    const isAlreadyLiked = likedCards.some(c => c.id === currentCard.id);
    if (!isAlreadyLiked && likedCards.length >= CANDIDATE_TARGET) return;

    const updatedLikes = isAlreadyLiked ? likedCards : [...likedCards, currentCard];

    // Advance to next card in deck (user decides when to trigger the raffle explicitly)
    handleNext();

    setInteractionCount(prev => prev + 1);
    x.set(0);
    setDirection(1);

    // Remove from rejected if it was rejected
    setRejectedCards(prev => prev.filter(c => c.id !== currentCard.id));
    setLikedCards(updatedLikes);

    const pitch = 600 + (updatedLikes.length * 80);
    sound.playClick(pitch);
    triggerHaptic('success');
  };

  const handleDragStart = () => {
    if (isLockedRef.current || isLocked || !canInteractWithDeck) return;
    isDraggingRef.current = true;
  };

  // Fluid swipe release gesture: Swipe left -> Paso, Swipe right -> Me tienta
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (isLockedRef.current || isLocked || !canInteractWithDeck) {
      x.set(0);
      isDraggingRef.current = false;
      return;
    }

    const swipeThreshold = 60;
    const velocityThreshold = 250;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swipe left -> Paso
      x.set(0);
      handleReject();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swipe right -> Me tienta
      x.set(0);
      handleLike();
    } else {
      x.set(0);
    }

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 120);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement?.tagName || ''))) return;
      if (viewMode !== 'deck' || isLockedRef.current || isLocked || !canInteractWithDeck || isRaffleRequirementOpen || isModalityOpen || isCategoryOpen) return;

      if (e.key === 'ArrowLeft' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleReject();
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L' || e.key === ' ') {
        e.preventDefault();
        handleLike();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentIndex, cardDeck, isLocked, canInteractWithDeck, isRaffleRequirementOpen, isModalityOpen, isCategoryOpen, currentCard, likedCards]);

  const handleOpenDelivery = (dishName: string) => {
    sound.playClick(850);
    const url = getDeliverySearchUrl(dishName);
    window.open(url, '_blank');
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
          id: `fav_${crypto.randomUUID()}`,
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

  const handleDirectSelect = () => {
    if (!currentCard || isLockedRef.current || isLocked) return;
    sound.playSuccess();
    triggerHaptic('success');
    triggerVictoryConfetti();
    startRaffleImmediately([currentCard]);
  };

  const handleDirectRaffle = () => {
    if (isLockedRef.current || isLocked || isRafflingRef.current || isSpinningDuel || !canDraw) {
      if (likedCards.length === 0) setIsRaffleRequirementOpen(true);
      return;
    }
    isRafflingRef.current = true;
    isLockedRef.current = true;
    setIsLocked(true);
    sound.playClick(900);
    triggerHaptic('medium');
    startRaffleImmediately(likedCards.slice(0, CANDIDATE_TARGET));
  };

  const isFavorited = currentCard ? isMealFavorited(currentCard.name, favorites) : false;
  
  const getCardStatus = (cardId: string): 'liked' | 'rejected' | 'pending' => {
    if (likedCards.some(c => c.id === cardId)) return 'liked';
    if (rejectedCards.some(c => c.id === cardId)) return 'rejected';
    return 'pending';
  };
  const currentCardStatus = currentCard ? getCardStatus(currentCard.id) : 'pending';
  const isCurrentlyLiked = currentCardStatus === 'liked';
  const isCurrentlyRejected = currentCardStatus === 'rejected';

  const currentModalityLabel = MODALITIES.find(m => m.id === selectedModality)?.label || 'Modalidad';
  const currentCategoryLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Todas las categorías';

  if (viewMode === 'hub') {
    return (
      <div className="w-full max-w-md mx-auto h-full flex flex-col justify-start pt-2 sm:pt-3 pb-2 gap-2.5 sm:gap-3 select-none">
        {/* Header / Chef Greeting */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
            ¿Qué comemos?
          </h2>
          
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            ¿Pensamos o lo resuelvo yo?
          </p>
        </div>

        {/* The Two Main Paths */}
        <div className="space-y-2.5">
          {/* NIVEL 1: Tengo Hambre (El Chef decide) - HERO OPTION */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              sound.playClick(1000);
              triggerHaptic('medium');
              onOpenBlindMode();
            }}
            className="relative p-3.5 sm:p-4 rounded-3xl bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500/40 hover:border-amber-500 shadow-lg shadow-amber-500/10 cursor-pointer transition-all space-y-2.5 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-500/30 shadow-sm shrink-0 bg-amber-500/20">
                  <img 
                    src="./sloth-thinking.jpg" 
                    alt="Chef Perezoso" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block whitespace-nowrap">
                    SI NO QUERÉS PENSAR
                  </span>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <span>¡Tengo Hambre!</span>
                    <Zap className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                  </h3>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500 text-zinc-950 shrink-0 shadow-xs">
                3 seg
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 text-left leading-relaxed">
              El chef decide por vos en 3 segundos.
            </p>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-md shadow-amber-500/25 transition-colors pointer-events-none"
            >
              <span>⚡ ¡Tengo Hambre!</span>
            </button>
          </motion.div>

          {/* NIVEL 2: Elegís vos (20 platos) */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              sound.playClick(800);
              triggerHaptic('light');
              setViewMode('deck');
            }}
            className="p-3 sm:p-3.5 rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.07] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] shadow-2xs hover:shadow-xs cursor-pointer transition-all space-y-2 group"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/15 group-hover:scale-105 transition-transform duration-300">
                  <Dices className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                    ELEGÍS VOS
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                    Elegís vos
                  </h3>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 border border-black/[0.04] dark:border-white/[0.04]">
                20 platos
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-left leading-relaxed">
              Mirás 20 opciones, descartás las que no van y la ruleta hace el resto.
            </p>

            <button
              type="button"
              className="w-full py-2 sm:py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-black/[0.05] dark:border-white/[0.06] transition-colors pointer-events-none"
            >
              <span>Elegir entre 20 platos</span>
            </button>
          </motion.div>
        </div>

        {/* NIVEL 3: Despensa Inteligente & Plan Semanal (Cards compactas horizontales) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {onNavigatePantry && (
            <button
              type="button"
              onClick={() => {
                sound.playClick(750);
                triggerHaptic('light');
                onNavigatePantry();
              }}
              className="p-2 sm:p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.15] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer btn-press group shadow-2xs min-w-0"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap select-none">Despensa Inteligente</span>
            </button>
          )}
          {onNavigatePlan && (
            <button
              type="button"
              onClick={() => {
                sound.playClick(750);
                triggerHaptic('light');
                onNavigatePlan();
              }}
              className="p-2 sm:p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.15] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer btn-press group shadow-2xs min-w-0"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Calendar className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap select-none">Plan Semanal</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-start py-1 sm:py-2 gap-2 sm:gap-2.5 select-none overscroll-none touch-none">
      {/* TOP BAR: Back to Hub, Title & Tengo Hambre */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={() => {
            if (isLocked || !canInteractWithDeck || isSpinningDuel) return;
            sound.playClick(700);
            isLockedRef.current = false;
            setIsLocked(false);
            setViewMode('hub');
          }}
          disabled={isLocked || !canInteractWithDeck || isSpinningDuel}
          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors shrink-0 ${
            isLocked || !canInteractWithDeck || isSpinningDuel
              ? 'opacity-40 pointer-events-none cursor-not-allowed text-zinc-400'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
          }`}
          title="Volver a opciones"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </button>

        <div className="text-center truncate px-1">
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate leading-none">
            Elegí entre 20 platos
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium leading-none mt-0.5">
            Sumá 5 para la ruleta
          </p>
        </div>

        <button
          onClick={() => {
            if (isLocked || !canInteractWithDeck || isSpinningDuel) return;
            sound.playClick(1000);
            onOpenBlindMode();
          }}
          disabled={isLocked || !canInteractWithDeck || isSpinningDuel}
          className={`px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 transition-colors btn-press shrink-0 ${
            isLocked || !canInteractWithDeck || isSpinningDuel
              ? 'opacity-40 pointer-events-none cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-black/[0.04]'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-pointer'
          }`}
          title="El chef decide por vos en 3 segundos"
        >
          <Zap className="w-3 h-3 fill-current text-amber-500" />
          <span>¡Tengo Hambre!</span>
        </button>
      </div>

      {/* DUAL DROPDOWNS: Modalidad & Categoría (Controles secundarios y compactos) */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        {/* Dropdown 1: Modalidades */}
        <div ref={modalityDropdownRef} className="relative">
          <button
            onClick={() => {
              if (isLocked || !canInteractWithDeck || isSpinningDuel) return;
              sound.playClick(750);
              setIsModalityOpen(prev => !prev);
              setIsCategoryOpen(false);
            }}
            disabled={isLocked || !canInteractWithDeck || isSpinningDuel}
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all shadow-2xs btn-press ${
              isLocked || !canInteractWithDeck || isSpinningDuel
                ? 'opacity-40 pointer-events-none cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-black/[0.04]'
                : selectedModality !== 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-semibold cursor-pointer'
                : 'bg-zinc-100/70 dark:bg-zinc-800/50 border-black/[0.06] dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              {MODALITIES.find(m => m.id === selectedModality)?.icon}
              <span className="truncate">{currentModalityLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isModalityOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isModalityOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl z-50 space-y-0.5"
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  Modalidad
                </div>
                {MODALITIES.map(mod => {
                  const isSelected = selectedModality === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        sound.playClick(isSelected ? 600 : 850);
                        setSelectedModality(mod.id);
                        savePreferredModality(mod.id);
                        setIsModalityOpen(false);
                        triggerHaptic('light');
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors btn-press cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {mod.icon}
                        <span>{mod.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dropdown 2: Categorías */}
        <div ref={categoryDropdownRef} className="relative">
          <button
            onClick={() => {
              if (isLocked || !canInteractWithDeck || isSpinningDuel) return;
              sound.playClick(750);
              setIsCategoryOpen(prev => !prev);
              setIsModalityOpen(false);
            }}
            disabled={isLocked || !canInteractWithDeck || isSpinningDuel}
            className={`w-full py-1.5 px-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all shadow-2xs btn-press ${
              isLocked || !canInteractWithDeck || isSpinningDuel
                ? 'opacity-40 pointer-events-none cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-black/[0.04]'
                : selectedCategory !== 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-semibold cursor-pointer'
                : 'bg-zinc-100/70 dark:bg-zinc-800/50 border-black/[0.06] dark:border-white/[0.06] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="truncate">{currentCategoryLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isCategoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl z-50 space-y-0.5"
              >
                <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  Categoría
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

      {/* PROGRESS TRACKER: Compact Deck Progress */}
      <div className="px-1 space-y-1 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Plato {cardDeck.length > 0 ? currentIndex + 1 : 0} de 20</span>
          </span>
          <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[10px]">
            Meta: 5 para ruleta
          </span>
        </div>

        {/* 20-Item Micro Indicator Strip */}
        {cardDeck.length > 0 && (
          <div className="flex items-center justify-between gap-1">
            {cardDeck.map((c, idx) => {
              const status = getCardStatus(c.id);
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={c.id || idx}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    isCurrent
                      ? 'ring-2 ring-zinc-900 dark:ring-white scale-y-125 z-10'
                      : 'opacity-70'
                  } ${
                    status === 'liked'
                      ? 'bg-emerald-500'
                      : status === 'rejected'
                      ? 'bg-rose-500'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* A) DECISIÓN ACTUAL: PLATO PROTAGONISTA (HERO CARD) */}
      <div className="relative w-full h-[215px] sm:h-[235px] flex items-center justify-center overflow-hidden rounded-3xl shrink-0 mt-1 sm:mt-1.5">
        {/* Next Card Stack Preview (Physical Deck Layering) */}
        {nextCard && (
          <div 
            className="absolute inset-x-3.5 sm:inset-x-4 top-2 bottom-1.5 rounded-3xl bg-zinc-100/90 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] shadow-xs pointer-events-none -z-10 transform scale-[0.96] translate-y-2 opacity-40 flex items-center justify-center overflow-hidden transition-all duration-300"
          >
            <div className="flex flex-col items-center justify-center opacity-20 scale-95">
              <span className="text-3xl sm:text-4xl">{nextCard.imageEmoji}</span>
              <span className="text-xs font-bold mt-1 text-zinc-800 dark:text-zinc-200">{nextCard.name}</span>
            </div>
          </div>
        )}

        {/* The Card with Fluid Spring Motion & Swipe Gestures */}
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          {currentCard ? (
            <motion.div 
              key={currentCard.id}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? 140 : dir < 0 ? -140 : 0,
                  opacity: 0,
                  scale: 0.94,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 340,
                    damping: 28,
                    mass: 0.8,
                  },
                },
                exit: (dir: number) => ({
                  x: dir > 0 ? -140 : dir < 0 ? 140 : 0,
                  opacity: 0,
                  scale: 0.94,
                  transition: {
                    duration: 0.18,
                    ease: [0.23, 1, 0.32, 1],
                  },
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full select-none"
            >
              <motion.div
                drag={isLocked || !canInteractWithDeck ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.65}
                dragSnapToOrigin={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{ x, rotate }}
                className={`relative w-full h-full ${
                  isLocked || !canInteractWithDeck
                    ? 'pointer-events-none cursor-default'
                    : 'cursor-grab active:cursor-grabbing touch-pan-y'
                }`}
              >
                {/* Single Clean Front Face (Protagonista Hero Card) */}
                <div 
                  className={`w-full h-full rounded-3xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-200 relative ${
                    currentCardStatus === 'liked'
                      ? 'bg-white dark:bg-zinc-900 border-2 border-emerald-500/80 shadow-emerald-500/10'
                      : currentCardStatus === 'rejected'
                      ? 'bg-white dark:bg-zinc-900 border-2 border-rose-500/70 shadow-rose-500/10'
                      : 'bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1]'
                  }`}
                >
                  {/* Subtle Ambient status wash background */}
                  {currentCardStatus === 'liked' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                  )}
                  {currentCardStatus === 'rejected' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-transparent pointer-events-none" />
                  )}

                  {/* Top Badges: Modalidad y Ver detalles */}
                  <div className="flex items-center justify-between relative z-10 shrink-0">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                      currentCard.type === 'cooking'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    }`}>
                      {currentCard.type === 'cooking' ? <ChefHat className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                      <span>{currentCard.type === 'cooking' ? 'Cocinar' : 'Delivery'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLocked && canInteractWithDeck) {
                          sound.playClick(600);
                          triggerHaptic('light');
                          setIsDetailsOpen(true);
                        }
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      disabled={isLocked || !canInteractWithDeck}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 py-1 px-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Ver detalles del plato"
                    >
                      <span>Ver detalles</span>
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Dish Center Info: El plato como protagonista directo */}
                  <div className="flex flex-col items-center justify-center text-center my-auto relative z-10 py-1">
                    {/* Apoyo visual: emoji prominente inmediatamente sobre el nombre */}
                    <div className="text-5xl sm:text-[54px] leading-none mb-2 filter drop-shadow-sm select-none transform hover:scale-105 transition-transform">
                      {currentCard.imageEmoji}
                    </div>

                    {/* Nombre del plato */}
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug line-clamp-2 px-2 mb-2">
                      {currentCard.name}
                    </h3>

                    {/* Métricas agrupadas en píldora: Tiempo · Atributo · Calorías */}
                    <div className="inline-flex items-center justify-center gap-2 bg-zinc-50/80 dark:bg-zinc-800/60 px-3 py-1 rounded-full border border-black/[0.05] dark:border-white/[0.05] flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{currentCard.timeEstimate}</span>
                      </span>

                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-650" />

                      <span className="inline-flex items-center text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <span>{getCompactAttribute(currentCard)}</span>
                      </span>

                      {currentCard.caloriesApprox && formatCalories(currentCard.caloriesApprox) && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-650" />
                          <span className="inline-flex items-center text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                            <span>{formatCalories(currentCard.caloriesApprox)}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom zone: Swipe hint contextual */}
                  {interactionCount < 3 && (
                    <div className="h-3 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-medium px-2 relative z-10 shrink-0">
                      <span>← Desliza para Paso</span>
                      <span>Desliza para Me tienta →</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div className="w-full h-full apple-card p-4 sm:p-5 text-center flex flex-col justify-center items-center space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl border border-amber-500/30">
                {likedCards.length >= 2 ? '🎰' : '🍽️'}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                  {likedCards.length >= 2 
                    ? `Tenés ${likedCards.length} candidatos` 
                    : 'Se terminaron los 20.'}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                  {likedCards.length >= 2 
                    ? '¿Hacemos el sorteo para que la ruleta decida?' 
                    : 'No te preocupes, podés ver 20 opciones distintas.'}
                </p>
              </div>

              <div className="space-y-1.5 pt-1 w-full max-w-xs mx-auto">
                {likedCards.length >= 2 && (
                  <button
                    onClick={handleDirectRaffle}
                    className="w-full py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 btn-press cursor-pointer transition-colors"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Sortear entre los {likedCards.length}</span>
                  </button>
                )}

                <button
                  onClick={() => loadRandomBatch(likedCards.length > 0)}
                  className="w-full py-1.5 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 text-xs font-semibold btn-press cursor-pointer border border-black/[0.06] dark:border-white/[0.06] transition-colors"
                >
                  Ver otros 20
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* B) ACCIONES: PASO (X) & ME TIENTA (HEART) - TOUCH TARGETS PROTAGONISTAS */}
      {currentCard && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 shrink-0">
          <motion.button
            whileTap={isLocked || !canInteractWithDeck ? undefined : { scale: 0.96 }}
            id="btn-action-reject"
            onClick={handleReject}
            disabled={isLocked || !canInteractWithDeck}
            className={`h-13 sm:h-14 rounded-2xl flex items-center justify-center gap-2.5 font-black text-base sm:text-lg btn-press transition-all border shadow-sm ${
              isLocked || !canInteractWithDeck
                ? 'pointer-events-none opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-black/[0.04]'
                : isCurrentlyRejected
                ? 'bg-rose-600 text-white border-rose-600 shadow-rose-500/20 cursor-pointer'
                : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 border-black/[0.06] dark:border-white/[0.08] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/40 cursor-pointer'
            }`}
            title="Paso (Tecla D o Flecha Izquierda)"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span>Paso</span>
          </motion.button>

          <motion.button
            whileTap={isLocked || !canInteractWithDeck || (!isCurrentlyLiked && likedCards.length >= CANDIDATE_TARGET) ? undefined : { scale: 0.96 }}
            id="btn-action-like"
            onClick={handleLike}
            disabled={isLocked || !canInteractWithDeck || (!isCurrentlyLiked && likedCards.length >= CANDIDATE_TARGET)}
            className={`h-13 sm:h-14 rounded-2xl flex items-center justify-center gap-2.5 font-black text-base sm:text-lg btn-press transition-all border shadow-md ${
              isLocked || !canInteractWithDeck || (!isCurrentlyLiked && likedCards.length >= CANDIDATE_TARGET)
                ? 'pointer-events-none opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-black/[0.04]'
                : isCurrentlyLiked
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25 ring-2 ring-emerald-400/30 cursor-pointer'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/30 cursor-pointer'
            }`}
            title="Me tienta (Tecla L, Flecha Derecha o Espacio)"
          >
            <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isCurrentlyLiked ? 'fill-white' : 'fill-current'}`} />
            <span>Me tienta</span>
          </motion.button>
        </div>
      )}

      {/* C) ESTADO DE LA RULETA: RESUMEN DE CANDIDATOS / RULETA */}
      <div
        className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 shrink-0 ${
          likedCards.length >= CANDIDATE_TARGET
            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/40 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
            : likedCards.length > 0
            ? 'bg-zinc-100/80 dark:bg-zinc-800/80 border-black/[0.06] dark:border-white/[0.08]'
            : 'bg-zinc-100/50 dark:bg-zinc-900/40 border-black/[0.04] dark:border-white/[0.05]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Indicador de Candidatos + Dots + Contador */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span
              className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                likedCards.length >= CANDIDATE_TARGET
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              CANDIDATOS
            </span>

            {/* 5 Dots de decisión */}
            <div className="flex items-center gap-1.5">
              {[...Array(CANDIDATE_TARGET)].map((_, i) => {
                const isFilled = i < likedCards.length;
                return (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      likedCards.length >= CANDIDATE_TARGET
                        ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 scale-105'
                        : isFilled
                        ? 'bg-amber-500 shadow-xs shadow-amber-500/40'
                        : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  />
                );
              })}
            </div>

            {/* Contador numérico: X de 5 */}
            <span
              className={`text-xs font-black ${
                likedCards.length >= CANDIDATE_TARGET
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-zinc-700 dark:text-zinc-200'
              }`}
            >
              {likedCards.length >= CANDIDATE_TARGET ? (
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  <span>5 de 5</span>
                </span>
              ) : (
                `${likedCards.length} de ${CANDIDATE_TARGET}`
              )}
            </span>
          </div>

          {/* Miniaturas de candidatos seleccionados con acceso a revisión */}
          {likedCards.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (!isLocked && canInteractWithDeck) {
                  sound.playClick(700);
                  setIsReviewOpen(true);
                }
              }}
              disabled={isLocked || !canInteractWithDeck}
              className="flex items-center gap-1.5 py-0.5 shrink-0 cursor-pointer group hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
              title="Revisar tus candidatos"
            >
              <div className="flex items-center -space-x-1.5 overflow-hidden">
                {likedCards.map((c) => (
                  <div
                    key={c.id}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-2xs shrink-0 transition-transform group-hover:scale-105 ${
                      likedCards.length >= CANDIDATE_TARGET
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400/60'
                        : 'bg-amber-100 dark:bg-amber-950/60 border-amber-400/50'
                    }`}
                    title={c.name}
                  >
                    {c.imageEmoji}
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 underline underline-offset-2">
                Revisar
              </span>
            </button>
          )}
        </div>

        {/* Fila inferior: Mensaje de estado + Botón CTA de Sorteo */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-black/[0.04] dark:border-white/[0.04]">
          {/* Mensaje de estado dinámico por candidato */}
          <div className="text-xs truncate">
            {likedCards.length >= CANDIDATE_TARGET ? (
              <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <span>✨ ¡Lista para la ruleta!</span>
              </span>
            ) : likedCards.length === 4 ? (
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                Te falta 1 candidato
              </span>
            ) : likedCards.length === 3 ? (
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                Te faltan 2 candidatos
              </span>
            ) : likedCards.length === 2 ? (
              <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                Te faltan 3 candidatos
              </span>
            ) : likedCards.length === 1 ? (
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                Te faltan 4 candidatos
              </span>
            ) : (
              <span className="font-medium text-zinc-400 dark:text-zinc-500">
                Elegí 5 candidatos para la ruleta
              </span>
            )}
          </div>

          {/* Botón CTA principal de la zona */}
          <button
            id="btn-tray-raffle"
            onClick={handleDirectRaffle}
            disabled={isLocked || !canDraw || isSpinningDuel || isRafflingRef.current}
            className={`px-4 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm btn-press transition-all shrink-0 ${
              !canDraw || isSpinningDuel || isRafflingRef.current
                ? 'pointer-events-none opacity-40 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 cursor-pointer active:scale-95'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Sortear entre 5</span>
          </button>
        </div>
      </div>

      {/* DESKTOP KEYBOARD SHORTCUTS HINT BAR */}
      <div className="hidden sm:flex items-center justify-center gap-3 pt-0.5 text-[10px] text-zinc-400 font-medium select-none shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">D</kbd>
          <span>Paso</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">→</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">L</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">Espacio</kbd>
          <span>Me tienta</span>
        </span>
      </div>

      {/* UNIFIED RAFFLE MODAL */}
      <RaffleModal
        isOpen={isDuelActive}
        winner={duelWinner}
        isPreparing={isPreparingRaffle}
        isSpinning={isSpinningDuel}
        candidates={drawingCandidates.length > 0 ? drawingCandidates : likedCards}
        activeCandidate={activeCandidate}
        activeCandidateIndex={activeCandidateIndex}
        shownWinnerIds={shownWinnerIds}
        remainingCandidateCount={remainingCount}
        canReroll={canReroll}
        candidateCount={duelCandidateCount || likedCards.length}
        onClose={() => finishRound()}
        onAcceptMeal={(winner) => {
          sound.playSuccess();
          triggerHaptic('success');
          finishRound(winner);
        }}
        onOpenRecipeModal={(winner) => {
          sound.playClick(800);
          finishRound(winner);
          if (onOpenRecipeModal) onOpenRecipeModal(winner);
        }}
        onOpenDelivery={(winner) => {
          handleOpenDelivery(winner.name);
          finishRound(winner);
        }}
        onReroll={() => {
          rerollRaffle();
        }}
        onResetRerolls={() => {
          resetRerolls();
        }}
      />

      {/* CANDIDATE REVIEW MODAL (REVISIÓN Y GESTIÓN DE CANDIDATOS) */}
      <CandidateReviewModal
        isOpen={isReviewOpen}
        candidates={likedCards}
        maxCandidates={CANDIDATE_TARGET}
        onClose={() => setIsReviewOpen(false)}
        onRemoveCandidate={handleRemoveCandidate}
        isLocked={isLocked || !canInteractWithDeck}
      />

      {/* PLATE DETAILS SHEET (FICHA RÁPIDA DE DECISIÓN) */}
      <PlateDetailsSheet
        isOpen={isDetailsOpen}
        plate={currentCard}
        isCandidate={currentCard ? likedCards.some(c => c.id === currentCard.id) : false}
        canAddCandidate={likedCards.length < CANDIDATE_TARGET}
        isLocked={isLocked || !canInteractWithDeck}
        onClose={() => setIsDetailsOpen(false)}
        onLike={handleLike}
        onRemoveCandidate={handleRemoveCandidate}
      />

      {/* NO LIKED CARDS / RAFFLE REQUIREMENT MODAL */}
      <AnimatePresence>
        {isRaffleRequirementOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none touch-none overscroll-none"
            style={{ touchAction: 'none', overscrollBehavior: 'none' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden touch-none select-none"
              style={{ touchAction: 'none', overscrollBehavior: 'none' }}
            >
              {/* Subtle glowing ambient background effect */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => {
                  sound.playClick(600);
                  setIsRaffleRequirementOpen(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors btn-press cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Badge */}
              <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Sorteo de platos elegidos</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight pt-1">
                  ¡Aún no has elegido platos!
                </h2>
              </div>

              {/* Sloth Confused Image */}
              <div className="relative mx-auto w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-md border border-black/[0.06] dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center p-2">
                <img
                  src="./sloth-confused.jpg"
                  alt="Perezoso confundido"
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              </div>

              {/* Explanation Text */}
              <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed px-1">
                <p>
                  Para sortear, elegí al menos <strong>{duelThreshold} platos</strong> con el botón <strong>«Me interesa»</strong>.
                </p>
                <p className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-500/20 p-2.5 rounded-xl font-medium">
                  💡 ¿No querés elegir? Tocá <strong>«¡Tengo Hambre!»</strong> y decidí al instante.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    sound.playClick(1000);
                    setIsRaffleRequirementOpen(false);
                    onOpenBlindMode();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 btn-press cursor-pointer transition-colors"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>¡Tengo Hambre! (sorteo directo)</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick(600);
                    setIsRaffleRequirementOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-black/[0.06] dark:border-white/[0.06] btn-press cursor-pointer transition-colors"
                >
                  <span>Entendido, seguiré eligiendo</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
