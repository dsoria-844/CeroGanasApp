import React, { useState, useEffect, useRef } from 'react';
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
  Dices,
  Info
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
}) => {
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
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [duelThreshold, setDuelThreshold] = useState<number>(5);
  const [isDuelFeatureEnabled, setIsDuelFeatureEnabled] = useState<boolean>(false);

  // Motion drag gesture values (Emil Kowalski physics)
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-8, 8]);

  // Shared Raffle Hook
  const {
    isDuelActive,
    isPreparingRaffle,
    isSpinningDuel,
    duelWinner,
    startRaffleWithPrep,
    startRaffleImmediately,
    closeRaffle,
  } = useRaffle();

  const [isRaffleRequirementOpen, setIsRaffleRequirementOpen] = useState<boolean>(false);

  // Lock body scroll when duel or requirement modal is open
  useBodyScrollLock(isDuelActive || isRaffleRequirementOpen);

  useEffect(() => {
    setSelectedModality(loadPreferredModality());
    setDuelThreshold(loadDuelThreshold());
    setIsDuelFeatureEnabled(loadDuelEnabled());
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

  // Load 20 Random Meals Batch
  const loadRandomBatch = (resetLikes: boolean = false) => {
    const fullDataset = getUnifiedCardDataset(selectedModality, selectedCategory, exclusions, history, favorites);
    const shuffled = [...fullDataset].sort(() => Math.random() - 0.5);
    const batch20 = shuffled.slice(0, 20);
    setCardDeck(batch20);
    setCurrentIndex(0);
    setDirection(0);
    setIsFlipped(false);
    if (resetLikes) {
      setLikedCards([]);
      setRejectedCards([]);
    }
  };

  useEffect(() => {
    loadRandomBatch(true);
  }, [selectedModality, selectedCategory, exclusions, history, favorites.length]);

  const currentCard = currentIndex < cardDeck.length ? cardDeck[currentIndex] : null;
  const nextCard = currentIndex + 1 < cardDeck.length ? cardDeck[currentIndex + 1] : null;
  const isDraggingRef = useRef(false);

  // Reset x motion value on card changes
  useEffect(() => {
    x.set(0);
    isDraggingRef.current = false;
  }, [currentIndex]);

  const handleToggleFlip = () => {
    if (isDraggingRef.current) return;
    sound.playClick(850);
    triggerHaptic('light');
    setIsFlipped(prev => !prev);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      x.set(0);
      sound.playClick(650);
      triggerHaptic('light');
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    x.set(0);
    setIsFlipped(false);
    setDirection(1);
    if (currentIndex + 1 < cardDeck.length) {
      sound.playClick(750);
      triggerHaptic('light');
      setCurrentIndex(prev => prev + 1);
    } else {
      // End of 20 batch: load next batch of 20
      sound.playSuccess();
      triggerHaptic('medium');
      loadRandomBatch(false);
    }
  };

  const handleReject = () => {
    if (!currentCard) return;
    x.set(0);
    sound.playTick(450);
    triggerHaptic('light');
    setDirection(1);
    
    // Remove from liked if it was liked
    setLikedCards(prev => prev.filter(c => c.id !== currentCard.id));
    
    // Toggle rejection or add to rejected
    setRejectedCards(prev => {
      if (prev.some(c => c.id === currentCard.id)) return prev;
      return [...prev, currentCard];
    });
    
    handleNext();
  };

  const handleLike = () => {
    if (!currentCard) return;
    x.set(0);
    sound.playClick(950);
    triggerHaptic('success');
    setDirection(1);

    // Remove from rejected if it was rejected
    setRejectedCards(prev => prev.filter(c => c.id !== currentCard.id));

    // Add to likedCards if not already present
    const isAlreadyLiked = likedCards.some(c => c.id === currentCard.id);
    const updatedLikes = isAlreadyLiked ? likedCards : [...likedCards, currentCard];
    setLikedCards(updatedLikes);

    const isFeatureEnabled = loadDuelEnabled();
    const threshold = loadDuelThreshold();
    if (isFeatureEnabled && updatedLikes.length >= threshold) {
      startRaffleWithPrep(updatedLikes);
    } else {
      handleNext();
    }
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  // Fluid swipe release gesture handler for pure carousel navigation (Emil Kowalski velocity handoff)
  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 70;
    const velocityThreshold = 300;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      // Swipe left -> Next card
      x.set(0);
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Swipe right -> Previous card
      x.set(0);
      handlePrev();
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
      if (isDuelActive || isRaffleRequirementOpen || isModalityOpen || isCategoryOpen) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFlip();
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleLike();
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleReject();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleDirectSelect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cardDeck, isFlipped, isDuelActive, isRaffleRequirementOpen, isModalityOpen, isCategoryOpen, currentCard]);

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
    if (!currentCard) return;
    sound.playSuccess();
    triggerHaptic('success');
    triggerVictoryConfetti();
    startRaffleImmediately([currentCard]);
  };

  const handleDirectRaffle = () => {
    sound.playClick(900);
    triggerHaptic('medium');
    if (likedCards.length === 0) {
      setIsRaffleRequirementOpen(true);
      return;
    }
    startRaffleWithPrep(likedCards);
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

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col min-h-0 py-1 gap-2 sm:gap-2.5 select-none overscroll-none touch-none">
      {/* TOP BAR: Title & Tengo Hambre */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
            <span>¿Qué comemos hoy?</span>
          </h2>
          <p className="text-[10.5px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            {isDuelFeatureEnabled 
              ? '20 opciones al azar · Elegí las que te gusten para el sorteo' 
              : '20 opciones al azar · Descartá, marcá las que te gusten o elegí directo'}
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick(1000);
            onOpenBlindMode();
          }}
          className="px-3 sm:px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 btn-press cursor-pointer shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>¡Tengo Hambre!</span>
        </button>
      </div>

      {/* DUAL DROPDOWNS: Modalidad & Categoría */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        {/* Dropdown 1: Modalidades */}
        <div ref={modalityDropdownRef} className="relative">
          <button
            onClick={() => {
              sound.playClick(750);
              setIsModalityOpen(prev => !prev);
              setIsCategoryOpen(false);
            }}
            className={`w-full py-2 px-3 rounded-2xl text-xs font-medium border flex items-center justify-between transition-all shadow-2xs btn-press cursor-pointer ${
              selectedModality !== 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-semibold'
                : 'bg-white dark:bg-zinc-950 border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
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
              sound.playClick(750);
              setIsCategoryOpen(prev => !prev);
              setIsModalityOpen(false);
            }}
            className={`w-full py-2 px-3 rounded-2xl text-xs font-medium border flex items-center justify-between transition-all shadow-2xs btn-press cursor-pointer ${
              selectedCategory !== 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent font-semibold'
                : 'bg-white dark:bg-zinc-950 border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
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

      {/* PROGRESS TRACKER & 20-CARD INDICATORS */}
      <div className="apple-card p-2 sm:p-2.5 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="px-2.5 py-0.5 sm:py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200">
              Plato {cardDeck.length > 0 ? currentIndex + 1 : 0}/{cardDeck.length}
            </span>
            {likedCards.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                <span>{likedCards.length}</span>
              </span>
            )}
            {rejectedCards.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-500/30 flex items-center gap-1">
                <X className="w-3 h-3 text-rose-500 stroke-[3]" />
                <span>{rejectedCards.length}</span>
              </span>
            )}
          </div>

          {/* Direct Raffle Button (Always available) */}
          <button
            id="btn-direct-raffle"
            onClick={handleDirectRaffle}
            disabled={cardDeck.length === 0}
            className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-xs btn-press cursor-pointer shrink-0 transition-colors"
            title="Sortear entre platos elegidos"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Sortear ({likedCards.length})</span>
          </button>
        </div>

        {/* 20-Item Micro Indicator Strip */}
        {cardDeck.length > 0 && (
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {cardDeck.map((c, idx) => {
              const status = getCardStatus(c.id);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={c.id || idx}
                  onClick={() => {
                    sound.playClick(700);
                    triggerHaptic('light');
                    setIsFlipped(false);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 sm:h-2 flex-1 rounded-full transition-all cursor-pointer ${
                    isCurrent
                      ? 'ring-2 ring-zinc-900 dark:ring-white scale-y-125 z-10'
                      : 'opacity-80 hover:opacity-100'
                  } ${
                    status === 'liked'
                      ? 'bg-emerald-500'
                      : status === 'rejected'
                      ? 'bg-rose-500'
                      : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                  title={`Plato ${idx + 1}: ${c.name} (${status === 'liked' ? 'Me interesa' : status === 'rejected' ? 'Descartado' : 'Sin decidir'})`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* CENTRAL DISH CARD WITH STACKED DECK DEPTH, DRAG GESTURES & FULL-HEIGHT LATERAL RAILS */}
      <div className="relative w-full flex-1 min-h-[300px] max-h-[580px] flex items-center justify-center overflow-hidden rounded-3xl my-0.5">
        {/* Next Card Stack Preview (Physical Deck Layering) */}
        {nextCard && !isFlipped && (
          <div 
            className="absolute inset-x-3.5 sm:inset-x-4 top-2.5 bottom-1 rounded-3xl bg-zinc-100/90 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] shadow-xs pointer-events-none -z-10 transform scale-[0.96] translate-y-2 opacity-50 flex items-center justify-center overflow-hidden transition-all duration-300"
          >
            <div className="flex flex-col items-center justify-center opacity-25 scale-90">
              <span className="text-5xl">{nextCard.imageEmoji}</span>
              <span className="text-xs font-bold mt-1 text-zinc-800 dark:text-zinc-200">{nextCard.name}</span>
            </div>
          </div>
        )}

        {/* Full-Height Lateral Tap Strip: Previous (Left Border from Top to Bottom) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={currentIndex === 0}
          className="absolute left-0 top-0 bottom-0 z-30 w-14 sm:w-16 flex items-center justify-start pl-2 sm:pl-3 bg-gradient-to-r from-black/[0.03] dark:from-white/[0.03] to-transparent hover:from-black/[0.07] dark:hover:from-white/[0.07] active:from-black/[0.12] disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer group select-none rounded-l-3xl"
          title="Plato anterior (Flecha Izquierda)"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:scale-110 group-hover:-translate-x-0.5 group-hover:text-zinc-950 dark:group-hover:text-white group-active:scale-95 transition-all opacity-35 group-hover:opacity-100 sm:opacity-55">
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
        </button>

        {/* Full-Height Lateral Tap Strip: Next (Right Border from Top to Bottom) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-0 top-0 bottom-0 z-30 w-14 sm:w-16 flex items-center justify-end pr-2 sm:pr-3 bg-gradient-to-l from-black/[0.03] dark:from-white/[0.03] to-transparent hover:from-black/[0.07] dark:hover:from-white/[0.07] active:from-black/[0.12] transition-all cursor-pointer group select-none rounded-r-3xl"
          title="Siguiente plato (Flecha Derecha)"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.12] shadow-sm flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:scale-110 group-hover:translate-x-0.5 group-hover:text-zinc-950 dark:group-hover:text-white group-active:scale-95 transition-all opacity-35 group-hover:opacity-100 sm:opacity-55">
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </button>

        {/* The Card with Spring Motion, Drag Gestures & 3D Flip */}
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          {currentCard ? (
            <motion.div 
              key={currentCard.id}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? 120 : dir < 0 ? -120 : 0,
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
                  x: dir > 0 ? -120 : dir < 0 ? 120 : 0,
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
              className="w-full h-full [perspective:1000px] select-none"
            >
              <motion.div
                drag={isFlipped ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                dragSnapToOrigin={true}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{ x, rotate }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                onClick={handleToggleFlip}
                className="relative w-full h-full [transform-style:preserve-3d] cursor-grab active:cursor-grabbing touch-pan-y"
              >
              {/* FRONT FACE (PORTADA) */}
              <div 
                className={`absolute inset-0 w-full h-full rounded-3xl p-3.5 sm:p-5 px-5 sm:px-7 pb-18 sm:pb-22 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.35),0_24px_48px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.06] dark:ring-white/[0.08] flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                  currentCardStatus === 'liked'
                    ? 'bg-white dark:bg-zinc-900 border-2 border-emerald-500/80 shadow-emerald-500/10'
                    : currentCardStatus === 'rejected'
                    ? 'bg-white dark:bg-zinc-900 border-2 border-rose-500/70 shadow-rose-500/10'
                    : 'bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1]'
                }`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                  zIndex: isFlipped ? 0 : 2,
                  opacity: isFlipped ? 0 : 1,
                  pointerEvents: isFlipped ? 'none' : 'auto',
                }}
              >

                {/* Subtle Ambient status wash background */}
                {currentCardStatus === 'liked' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                )}
                {currentCardStatus === 'rejected' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Top Badges & Status & Favorite Button */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                      currentCard.type === 'cooking'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    }`}>
                      {currentCard.type === 'cooking' ? <ChefHat className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Bike className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                      <span>{currentCard.type === 'cooking' ? 'Cocinar' : 'Delivery'}</span>
                    </span>

                    {/* Status Pill */}
                    {currentCardStatus === 'liked' && (
                      <span className="text-[9.5px] sm:text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3 h-3 stroke-[3] text-emerald-600 dark:text-emerald-400" />
                        <span>Elegido</span>
                      </span>
                    )}
                    {currentCardStatus === 'rejected' && (
                      <span className="text-[9.5px] sm:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/40 flex items-center gap-1 animate-in fade-in">
                        <X className="w-3 h-3 stroke-[3] text-rose-600 dark:text-rose-400" />
                        <span>Descartado</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFlip();
                      }}
                      className="p-1.5 sm:p-2 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all btn-press cursor-pointer"
                      title="Ver información y receta"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(currentCard);
                      }}
                      className={`p-1.5 sm:p-2 rounded-full border transition-all btn-press cursor-pointer ${
                        isFavorited
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-black/[0.06] dark:border-white/[0.06]'
                      }`}
                      title={isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Dish Center Info */}
                <div className="flex flex-col items-center justify-center text-center my-auto py-2 sm:py-3 relative z-10">
                  <div className="text-6xl sm:text-7xl md:text-8xl mb-2 sm:mb-3 filter drop-shadow-md select-none transform hover:scale-105 transition-transform">
                    {currentCard.imageEmoji}
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mb-1.5 sm:mb-2 line-clamp-2">
                    {currentCard.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-[320px] line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {currentCard.description}
                  </p>

                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-4 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{currentCard.timeEstimate}</span>
                    </span>

                    {currentCard.caloriesApprox && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>~{currentCard.caloriesApprox} kcal</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                      <span>{currentCard.vibe}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom hint */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium relative z-10">
                  <RotateCw className="w-3 h-3" />
                  <span>Toca para ver receta e ingredientes</span>
                </div>
              </div>

              {/* BACK FACE (RECETA / DETALLES) */}
              <div 
                className={`absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 px-7 sm:px-8 pb-24 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.35),0_24px_48px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.06] dark:ring-white/[0.08] flex flex-col justify-between overflow-y-auto transition-all duration-200 ${
                  currentCardStatus === 'liked'
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-2 border-emerald-500/80'
                    : currentCardStatus === 'rejected'
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-2 border-rose-500/70'
                    : 'bg-zinc-50 dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.1]'
                }`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  zIndex: isFlipped ? 2 : 0,
                  opacity: isFlipped ? 1 : 0,
                  pointerEvents: isFlipped ? 'auto' : 'none',
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentCard.imageEmoji}</span>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                          {currentCard.name}
                        </h4>
                        <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                          {currentCard.type === 'cooking' ? 'Receta casera' : 'Detalles de delivery'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFlip();
                      }}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-200/60 dark:bg-zinc-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cooking Recipe Details */}
                  {currentCard.type === 'cooking' && currentCard.recipe ? (
                    <div className="space-y-3 text-left">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                          Ingredientes
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {(
                            currentCard.recipe.allIngredientsFormatted?.map(ing => ing.name) ||
                            currentCard.ingredientsSummary ||
                            []
                          ).map((ing, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-black/[0.06] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                          Pasos de Cocina
                        </p>
                        <div className="space-y-1.5">
                          {(currentCard.recipe.steps || []).slice(0, 3).map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-tight">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-left">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                          Información
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          {currentCard.description}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDelivery(currentCard.name);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm btn-press cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buscar en la app de delivery</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-center pt-2 text-[10px] text-zinc-400">
                  Toca para volver a la portada
                </div>
              </div>
            </motion.div>
          </motion.div>
          ) : (
            <div className="apple-card p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                No hay más platos en esta categoría
              </p>
              <button
                onClick={() => loadRandomBatch(true)}
                className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold btn-press cursor-pointer"
              >
                Cargar 20 platos nuevos
              </button>
            </div>
          )}
        </AnimatePresence>

        {/* FLOATING ACTION BUTTONS OVER THE CARD (3 CLEAN & SPACIOUS BUTTONS) */}
        {currentCard && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 sm:bottom-2.5 left-2.5 sm:left-3 right-2.5 sm:right-3 z-30 flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          >
            {/* Reject Button (Rojo intuitivo) */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleReject}
              className={`flex-1 h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-xs btn-press cursor-pointer transition-all border ${
                isCurrentlyRejected
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/30 ring-2 ring-rose-500/40'
                  : 'bg-rose-50/90 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60'
              }`}
              title="Descartar este plato (Tecla D)"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>{isCurrentlyRejected ? 'Descartado' : 'Descartar'}</span>
            </motion.button>

            {/* Like Button (Verde intuitivo) */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleLike}
              className={`flex-[1.1] h-10 sm:h-11 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 font-bold text-[11px] sm:text-xs btn-press cursor-pointer transition-all border ${
                isCurrentlyLiked
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500/40'
                  : 'bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
              title="Marcar como «Me interesa» (Tecla L)"
            >
              <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] ${isCurrentlyLiked ? 'fill-current' : ''}`} />
              <span>{isCurrentlyLiked ? 'Te interesa' : 'Me interesa'}</span>
            </motion.button>

            {/* Direct Select Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              id="btn-direct-choose"
              onClick={handleDirectSelect}
              className="flex-1 h-10 sm:h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-md shadow-amber-500/20 btn-press cursor-pointer transition-colors"
              title="Elegir este plato ahora (Tecla Enter)"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              <span>Elegir</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* DESKTOP KEYBOARD SHORTCUTS HINT BAR */}
      <div className="hidden sm:flex items-center justify-center gap-3 pt-0.5 text-[10px] text-zinc-400 font-medium select-none shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">→</kbd>
          <span>Navegar</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">Espacio</kbd>
          <span>Receta</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">L</kbd>
          <span>Me interesa</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[9px] border border-black/[0.06] dark:border-white/[0.08]">D</kbd>
          <span>Descartar</span>
        </span>
      </div>

      {/* UNIFIED RAFFLE MODAL */}
      <RaffleModal
        isOpen={isDuelActive}
        winner={duelWinner}
        isPreparing={isPreparingRaffle}
        isSpinning={isSpinningDuel}
        candidateCount={likedCards.length}
        onClose={closeRaffle}
        onAcceptMeal={(winner) => {
          sound.playSuccess();
          triggerHaptic('success');
          onAcceptMeal(
            winner.name,
            winner.type,
            winner.imageEmoji,
            `Sorteo • ${winner.timeEstimate}`
          );
          closeRaffle();
          setLikedCards([]);
        }}
        onOpenRecipeModal={(winner) => {
          sound.playClick(800);
          closeRaffle();
          setLikedCards([]);
          if (onOpenRecipeModal) onOpenRecipeModal(winner);
        }}
        onOpenDelivery={(winner) => handleOpenDelivery(winner.name)}
        onReroll={() => {
          const candidatePool = likedCards.length > 1 
            ? likedCards 
            : cardDeck.filter(c => !rejectedCards.some(r => r.id === c.id));
          startRaffleImmediately(candidatePool.length > 0 ? candidatePool : cardDeck);
        }}
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
