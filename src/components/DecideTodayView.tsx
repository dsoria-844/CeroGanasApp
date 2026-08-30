import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
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
  { id: 'all', label: 'Tipo', icon: <Sparkles className="w-3.5 h-3.5 text-zinc-500" /> },
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
  const [likedCards, setLikedCards] = useState<MealCardItem[]>([]);
  const [rejectedCards, setRejectedCards] = useState<MealCardItem[]>([]);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [duelThreshold, setDuelThreshold] = useState<number>(5);
  const [isDuelFeatureEnabled, setIsDuelFeatureEnabled] = useState<boolean>(false);

  // Sorteo / Duel State
  const [isDuelActive, setIsDuelActive] = useState<boolean>(false);
  const [duelOrigin, setDuelOrigin] = useState<'raffle' | 'direct'>('raffle');
  const [isPreparingRaffle, setIsPreparingRaffle] = useState<boolean>(false);
  const [isRaffleRequirementOpen, setIsRaffleRequirementOpen] = useState<boolean>(false);
  const [duelWinner, setDuelWinner] = useState<MealCardItem | null>(null);
  const [isSpinningDuel, setIsSpinningDuel] = useState<boolean>(false);
  const duelTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleToggleFlip = () => {
    sound.playClick(850);
    triggerHaptic('light');
    setIsFlipped(prev => !prev);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      sound.playClick(650);
      triggerHaptic('light');
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
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
    sound.playTick(450);
    triggerHaptic('light');
    
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
    sound.playClick(950);
    triggerHaptic('success');

    // Remove from rejected if it was rejected
    setRejectedCards(prev => prev.filter(c => c.id !== currentCard.id));

    // Add to likedCards if not already present
    const isAlreadyLiked = likedCards.some(c => c.id === currentCard.id);
    const updatedLikes = isAlreadyLiked ? likedCards : [...likedCards, currentCard];
    setLikedCards(updatedLikes);

    const isFeatureEnabled = loadDuelEnabled();
    const threshold = loadDuelThreshold();
    if (isFeatureEnabled && updatedLikes.length >= threshold) {
      // Trigger Sorteo Final with 2-second preparation
      setDuelOrigin('raffle');
      setIsDuelActive(true);
      setIsPreparingRaffle(true);
      sound.playClick(900);
      triggerHaptic('medium');

      setTimeout(() => {
        setIsPreparingRaffle(false);
        startRaffle(updatedLikes);
      }, 2000); // Strict 2 seconds wait
    } else {
      handleNext();
    }
  };

  const startRaffle = (candidates: MealCardItem[]) => {
    if (candidates.length === 0) return;
    setIsDuelActive(true);
    setIsSpinningDuel(true);
    triggerHaptic('medium');

    let counter = 0;
    const totalFlips = 18;
    const intervalTime = 85;

    if (duelTimerRef.current) clearInterval(duelTimerRef.current);

    duelTimerRef.current = setInterval(() => {
      counter++;
      const pick = candidates[counter % candidates.length];
      setDuelWinner(pick);
      sound.playTick(600 + (counter * 20));
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

  const handleDirectSelect = () => {
    if (!currentCard) return;
    sound.playSuccess();
    triggerHaptic('success');
    triggerVictoryConfetti();
    setDuelWinner(currentCard);
    setDuelOrigin('direct');
    setIsPreparingRaffle(false);
    setIsSpinningDuel(false);
    setIsDuelActive(true);
  };

  const handleDirectRaffle = () => {
    sound.playClick(900);
    triggerHaptic('medium');
    if (likedCards.length === 0) {
      setIsRaffleRequirementOpen(true);
      return;
    }
    setDuelOrigin('raffle');
    setIsDuelActive(true);
    setIsPreparingRaffle(true);

    setTimeout(() => {
      setIsPreparingRaffle(false);
      startRaffle(likedCards);
    }, 2000);
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
    <div className="w-full max-w-md mx-auto space-y-2.5 sm:space-y-3 pb-1 select-none overscroll-contain">
      {/* TOP BAR: Title & Tengo Hambre */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
            <span>¿Qué comemos hoy?</span>
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
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
          className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 btn-press cursor-pointer shrink-0"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>¡Tengo Hambre!</span>
        </button>
      </div>

      {/* DUAL DROPDOWNS: Modalidad & Categoría */}
      <div className="grid grid-cols-2 gap-2">
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
      <div className="apple-card p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200">
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
                  className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
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

      {/* CENTRAL DISH CARD WITH LATERAL ARROWS & FLOATING ACTION BUTTONS */}
      <div className="relative w-full h-[450px] sm:h-[475px] min-h-[420px] max-h-[490px] flex items-center justify-center overflow-hidden rounded-3xl">
        {/* Previous Arrow Button */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-black/[0.1] dark:border-white/[0.15] shadow-xl backdrop-blur-md flex items-center justify-center text-zinc-800 dark:text-zinc-100 hover:scale-110 active:scale-95 disabled:opacity-20 disabled:scale-100 disabled:cursor-not-allowed btn-press cursor-pointer transition-all"
          title="Plato anterior"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* Next Arrow Button */}
        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-black/[0.1] dark:border-white/[0.15] shadow-xl backdrop-blur-md flex items-center justify-center text-zinc-800 dark:text-zinc-100 hover:scale-110 active:scale-95 btn-press cursor-pointer transition-all"
          title="Siguiente plato"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* The Card with 3D Flip */}
        {currentCard ? (
          <div 
            onClick={handleToggleFlip}
            className="w-full h-full cursor-pointer [perspective:1000px]"
          >
            <motion.div
              key={currentCard.id}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full h-full [transform-style:preserve-3d] select-none"
            >
              {/* FRONT FACE (PORTADA) */}
              <div 
                className={`absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 pb-24 shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-200 ${
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
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                      currentCard.type === 'cooking'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    }`}>
                      {currentCard.type === 'cooking' ? <ChefHat className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                      <span>{currentCard.type === 'cooking' ? 'Cocinar' : 'Delivery'}</span>
                    </span>

                    {/* Status Pill */}
                    {currentCardStatus === 'liked' && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3 h-3 stroke-[3] text-emerald-600 dark:text-emerald-400" />
                        <span>Elegido</span>
                      </span>
                    )}
                    {currentCardStatus === 'rejected' && (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/40 flex items-center gap-1 animate-in fade-in">
                        <X className="w-3 h-3 stroke-[3] text-rose-600 dark:text-rose-400" />
                        <span>Descartado</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFlip();
                      }}
                      className="p-2 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all btn-press cursor-pointer"
                      title="Ver información y receta"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(currentCard);
                      }}
                      className={`p-2 rounded-full border transition-all btn-press cursor-pointer ${
                        isFavorited
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-black/[0.06] dark:border-white/[0.06]'
                      }`}
                      title={isFavorited ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Dish Center Info */}
                <div className="flex flex-col items-center justify-center text-center my-auto py-2 relative z-10">
                  <div className="text-7xl mb-3 filter drop-shadow-md select-none transform hover:scale-105 transition-transform">
                    {currentCard.imageEmoji}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mb-2">
                    {currentCard.name}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] line-clamp-2 leading-relaxed">
                    {currentCard.description}
                  </p>

                  <div className="flex items-center justify-center gap-2 mt-3.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{currentCard.timeEstimate}</span>
                    </span>

                    {currentCard.caloriesApprox && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>~{currentCard.caloriesApprox} kcal</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.04]">
                      <span>{currentCard.vibe}</span>
                    </span>
                  </div>
                </div>

                {/* Bottom hint */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium relative z-10">
                  <RotateCw className="w-3 h-3" />
                  <span>Toca para ver receta e ingredientes</span>
                </div>
              </div>

              {/* BACK FACE (RECETA / DETALLES) */}
              <div 
                className={`absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 pb-24 shadow-xl flex flex-col justify-between overflow-y-auto transition-all duration-200 ${
                  currentCardStatus === 'liked'
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-2 border-emerald-500/80 shadow-emerald-500/10'
                    : currentCardStatus === 'rejected'
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-2 border-rose-500/70 shadow-rose-500/10'
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
                          {currentCard.type === 'cooking' ? 'Receta Casera' : 'Detalles de Delivery'}
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
          </div>
        ) : (
          <div className="apple-card p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              No hay más platos en esta categoría
            </p>
            <button
              onClick={() => loadRandomBatch(true)}
              className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold"
            >
              Cargar 20 platos nuevos
            </button>
          </div>
        )}

        {/* FLOATING ACTION BUTTONS OVER THE CARD (3 CLEAN & SPACIOUS BUTTONS) */}
        {currentCard && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3.5 right-3.5 z-30 flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/[0.1] shadow-xl"
          >
            {/* Reject Button */}
            <button
              onClick={handleReject}
              className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs btn-press cursor-pointer transition-all ${
                isCurrentlyRejected
                  ? 'bg-rose-600 text-white dark:bg-rose-600 dark:text-white shadow-sm shadow-rose-500/20 ring-2 ring-rose-500/50'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40'
              }`}
              title="Descartar este plato y avanzar"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>{isCurrentlyRejected ? 'Descartado' : 'Descartar'}</span>
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex-[1.1] h-11 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs btn-press cursor-pointer shadow-sm transition-all ${
                isCurrentlyLiked
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 font-bold shadow-emerald-500/20 ring-2 ring-emerald-500/50'
                  : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              }`}
              title="Marcar como 'Me interesa' para el sorteo final"
            >
              <Heart className={`w-4 h-4 stroke-[2.5] ${isCurrentlyLiked ? 'fill-current' : ''}`} />
              <span>{isCurrentlyLiked ? 'Te interesa' : 'Me interesa'}</span>
            </button>

            {/* Direct Select Button */}
            <button
              id="btn-direct-choose"
              onClick={handleDirectSelect}
              className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 btn-press cursor-pointer transition-colors"
              title="Elegir este plato directamente hoy"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Elegir</span>
            </button>
          </div>
        )}
      </div>

      {/* FINAL RAFFLE MODAL (WITH 2-SECOND PREPARATION) */}
      <AnimatePresence>
        {isDuelActive && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none touch-none overscroll-none"
            style={{ touchAction: 'none', overscrollBehavior: 'none' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-5 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden touch-none select-none"
              style={{ touchAction: 'none', overscrollBehavior: 'none' }}
            >
              {/* Subtle glowing ambient background effect */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close */}
              <button
                onClick={() => {
                  sound.playClick(600);
                  setIsDuelActive(false);
                  setIsPreparingRaffle(false);
                  setLikedCards([]);
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors btn-press cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
                  {duelOrigin === 'direct' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                      <span>Elegido directamente</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                      <span>Sorteo Final ({likedCards.length} opciones)</span>
                    </>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight pt-1">
                  {duelOrigin === 'direct' ? '¡Plato elegido!' : '¡Sorteo Final!'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {duelOrigin === 'direct'
                    ? 'Has seleccionado este plato para comer hoy.'
                    : isPreparingRaffle 
                    ? `Reuniendo tus ${likedCards.length} opciones...` 
                    : 'Sorteo aleatorio entre tus platos seleccionados.'}
                </p>
              </div>

              {/* 2-SECOND SKELETON / PREPARING STATE */}
              {isPreparingRaffle ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-4 space-y-4 flex flex-col items-center justify-center"
                >
                  <div className="relative w-44 h-44 rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/30 bg-zinc-100 dark:bg-zinc-800 animate-pulse">
                    <img
                      src="./sloth-thinking.jpg"
                      alt="Preparando el sorteo..."
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center animate-spin">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Preparando sorteo...
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide animate-pulse">
                    Reuniendo tus {likedCards.length} opciones favoritas...
                  </p>
                </motion.div>
              ) : duelWinner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 280 }}
                  className="space-y-5"
                >
                  {/* Decree Card (Normalized) */}
                  <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] space-y-3 relative overflow-hidden">
                    <div className="text-5xl sm:text-6xl">
                      {duelWinner.imageEmoji}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold block">
                        {isSpinningDuel 
                          ? 'Sorteando tu comida...' 
                          : duelOrigin === 'direct'
                          ? 'Plato elegido:' 
                          : 'Salió sorteado:'}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                        {duelWinner.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block ${
                        duelWinner.type === 'cooking'
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      }`}>
                        {duelWinner.type === 'cooking' ? '🍳 Cocinar en Casa' : '🛵 Pedir Delivery'}
                      </span>
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                        ⏱️ {duelWinner.timeEstimate}
                      </span>
                      <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                        {duelWinner.categoryLabel}
                      </span>
                      {duelWinner.caloriesApprox && (
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-black/[0.06] dark:border-white/[0.08]">
                          🔥 {duelWinner.caloriesApprox}
                        </span>
                      )}
                    </div>

                    {duelWinner.vibe && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 italic pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                        "{duelWinner.vibe}"
                      </p>
                    )}
                  </div>

                  {/* Normalized Contextual Action Buttons */}
                  {!isSpinningDuel && (
                    <div className="space-y-2.5 pt-1">
                      {duelWinner.type === 'delivery' ? (
                        <button
                          id="btn-duel-delivery"
                          onClick={() => handleOpenDelivery(duelWinner.name)}
                          className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 btn-press cursor-pointer shadow-md shadow-amber-500/20"
                        >
                          <span>🛵 Abrir en app de delivery / Buscar</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        duelWinner.recipe && onOpenRecipeModal && (
                          <button
                            id="btn-duel-view-recipe"
                            onClick={() => {
                              sound.playClick(800);
                              setIsDuelActive(false);
                              setLikedCards([]);
                              onOpenRecipeModal(duelWinner);
                            }}
                            className="w-full py-3.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 font-medium text-xs flex items-center justify-center gap-2 border border-black/[0.08] dark:border-white/[0.08] btn-press cursor-pointer"
                          >
                            <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ver Receta en 3 Pasos</span>
                          </button>
                        )
                      )}

                      <button
                        id="btn-duel-accept"
                        onClick={() => {
                          sound.playSuccess();
                          triggerHaptic('success');
                          onAcceptMeal(
                            duelWinner.name,
                            duelWinner.type,
                            duelWinner.imageEmoji,
                            duelOrigin === 'direct'
                              ? `Elección directa • ${duelWinner.timeEstimate}`
                              : `Sorteo • ${duelWinner.timeEstimate}`
                          );
                          setIsDuelActive(false);
                          setLikedCards([]);
                        }}
                        className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 shadow-md btn-press cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Acepto el plato!</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <span>Sorteo de Platos Elegidos</span>
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
                  Para realizar este sorteo debes seleccionar al menos <strong>{duelThreshold} platos</strong> con el botón <strong>"Me interesa"</strong> o deslizando hacia la derecha.
                </p>
                <p className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-500/20 p-2.5 rounded-xl font-medium">
                  💡 ¿No deseas elegir platos? Presiona el botón <strong>"¡Tengo Hambre!"</strong> en la barra superior para realizar un sorteo directo inmediato.
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
                  <span>¡Tengo Hambre! (Sorteo directo)</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick(600);
                    setIsRaffleRequirementOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-black/[0.06] dark:border-white/[0.06] btn-press cursor-pointer transition-colors"
                >
                  <span>Entendido, seguiré eligiendo platos</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
