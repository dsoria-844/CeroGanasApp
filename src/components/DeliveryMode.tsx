import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCw, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Star,
  Plus
} from 'lucide-react';
import { DeliveryCategory, DeliveryOption, MealHistoryItem, UserFavoriteMeal } from '../types';
import { 
  getEligibleDeliveryOptions, 
  triggerHaptic, 
  triggerVictoryConfetti,
  decrementRerolls,
  resetRerollsToMax,
  isMealFavorited,
  createFavoriteFromDeliveryOption
} from '../utils/storage';
import { sound } from '../utils/audio';

interface DeliveryModeProps {
  onBack: () => void;
  onAcceptMeal: (mealName: string, type: 'delivery', emoji: string, details?: string) => void;
  exclusions: string[];
  history: MealHistoryItem[];
  favorites: UserFavoriteMeal[];
  onAddFavorite: (meal: UserFavoriteMeal) => void;
  onDeleteFavorite: (id: string) => void;
  onOpenFavoritesModal: () => void;
  remainingRerolls: number;
  onUpdateRerolls: (newCount: number) => void;
}

const CATEGORIES: { id: DeliveryCategory; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'cheat_meal', label: 'Cheat Meal' },
  { id: 'typical', label: 'Minutas / Típica' },
  { id: 'healthy', label: 'Saludable' },
  { id: 'economic', label: 'Económico' },
];

export const DeliveryMode: React.FC<DeliveryModeProps> = ({
  onBack,
  onAcceptMeal,
  exclusions,
  history,
  favorites,
  onAddFavorite,
  onDeleteFavorite,
  onOpenFavoritesModal,
  remainingRerolls,
  onUpdateRerolls,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DeliveryCategory>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayedOption, setDisplayedOption] = useState<DeliveryOption | null>(null);
  const [copied, setCopied] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const eligibleOptions = getEligibleDeliveryOptions(
    selectedCategory, 
    exclusions, 
    history, 
    onlyFavorites, 
    favorites
  );

  const handleSpin = () => {
    if (isSpinning || remainingRerolls <= 0) return;
    if (eligibleOptions.length === 0) return;

    sound.playClick(900);
    triggerHaptic('medium');
    setIsSpinning(true);
    setAccepted(false);

    let speed = 60;
    let elapsed = 0;
    const totalDuration = 2000;

    const availablePool = eligibleOptions.length > 1 && displayedOption 
      ? eligibleOptions.filter(o => o.id !== displayedOption.id) 
      : eligibleOptions;
    const finalPick = availablePool[Math.floor(Math.random() * availablePool.length)] || eligibleOptions[0];

    const runShuffle = () => {
      const randomItem = eligibleOptions[Math.floor(Math.random() * eligibleOptions.length)];
      setDisplayedOption(randomItem);
      sound.playTick(500 + Math.min(elapsed / 3, 500));
      triggerHaptic('light');

      elapsed += speed;
      if (elapsed < totalDuration) {
        speed = Math.floor(speed * 1.12);
        spinIntervalRef.current = setTimeout(runShuffle, speed);
      } else {
        setDisplayedOption(finalPick);
        setIsSpinning(false);
        sound.playSuccess();
        triggerHaptic('success');
        
        const newRemaining = decrementRerolls();
        onUpdateRerolls(newRemaining);
      }
    };

    runShuffle();
  };

  useEffect(() => {
    if (eligibleOptions.length > 0) {
      const isCurrentEligible = displayedOption && eligibleOptions.some(o => o.id === displayedOption.id);
      if (!isCurrentEligible) {
        setDisplayedOption(eligibleOptions[Math.floor(Math.random() * eligibleOptions.length)]);
      }
    } else {
      setDisplayedOption(null);
    }
  }, [selectedCategory, onlyFavorites, eligibleOptions.length]);

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearTimeout(spinIntervalRef.current);
    };
  }, []);

  const handleCategoryChange = (cat: DeliveryCategory) => {
    sound.playClick(750);
    setSelectedCategory(cat);
    const newEligible = getEligibleDeliveryOptions(cat, exclusions, history, onlyFavorites, favorites);
    if (newEligible.length > 0) {
      setDisplayedOption(newEligible[Math.floor(Math.random() * newEligible.length)]);
    }
  };

  const handleScopeToggle = (favsOnly: boolean) => {
    sound.playClick(800);
    setOnlyFavorites(favsOnly);
    triggerHaptic('light');
  };

  const handleToggleFavorite = () => {
    if (!displayedOption) return;
    const isFav = isMealFavorited(displayedOption.name, favorites);
    if (isFav) {
      sound.playClick(500);
      const existing = favorites.find(f => f.name.toLowerCase().trim() === displayedOption.name.toLowerCase().trim());
      if (existing) {
        onDeleteFavorite(existing.id);
        triggerHaptic('light');
      }
    } else {
      sound.playClick(1000);
      const newFav = createFavoriteFromDeliveryOption(displayedOption);
      onAddFavorite(newFav);
      triggerHaptic('success');
    }
  };

  const handleAccept = () => {
    if (!displayedOption) return;
    sound.playSuccess();
    triggerHaptic('success');
    triggerVictoryConfetti();
    setAccepted(true);
    onAcceptMeal(
      displayedOption.name,
      'delivery',
      displayedOption.imageEmoji,
      `Delivery (${displayedOption.category}) • ${displayedOption.deliveryTime}`
    );
  };

  const handleCopyName = () => {
    if (!displayedOption) return;
    sound.playClick(800);
    navigator.clipboard.writeText(displayedOption.name);
    setCopied(true);
    triggerHaptic('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchDelivery = () => {
    if (!displayedOption) return;
    sound.playClick(850);
    const query = encodeURIComponent(`${displayedOption.name} delivery cerca de mí`);
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isCurrentFavorite = displayedOption ? isMealFavorited(displayedOption.name, favorites) : false;

  return (
    <div className="w-full flex flex-col gap-5 max-w-lg mx-auto pb-16">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-delivery-back"
          onClick={() => {
            sound.playClick(700);
            onBack();
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/[0.08] dark:border-white/[0.08] shadow-xs btn-press cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full text-xs font-medium border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-xs flex items-center gap-1.5">
            <RotateCw className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{remainingRerolls} de 3 giros</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Pedir Delivery
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
          Ruleta Anti-Fatiga • Se omiten platos de los últimos 4 días
        </p>
      </div>

      {/* Scope Selector */}
      <div className="p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] flex items-center gap-1 max-w-sm">
        <button
          id="btn-scope-all"
          onClick={() => handleScopeToggle(false)}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center btn-press cursor-pointer ${
            !onlyFavorites
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <span>Catálogo</span>
        </button>

        <button
          id="btn-scope-favorites"
          onClick={() => handleScopeToggle(true)}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 btn-press cursor-pointer ${
            onlyFavorites
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs font-semibold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          <Star className="w-3 h-3 text-amber-500" />
          <span>Favoritos ({favorites.length})</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`btn-delivery-filter-${cat.id}`}
              onClick={() => handleCategoryChange(cat.id)}
              disabled={isSpinning}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs flex items-center shrink-0 btn-press cursor-pointer border ${
                isSelected
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent font-medium shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border-black/[0.08] dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Food Presentation Card */}
      {eligibleOptions.length === 0 ? (
        <div className="apple-card p-8 text-center space-y-3">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No hay opciones disponibles con este filtro
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Prueba cambiando la categoría o revisa los ingredientes excluidos.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium text-xs btn-press cursor-pointer"
            >
              Ver todas las opciones
            </button>
          </div>
        </div>
      ) : displayedOption ? (
        <motion.div
          key={displayedOption.id}
          initial={{ scale: 0.96, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          className="apple-card p-6 sm:p-7 space-y-5"
        >
          {/* Top badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium">
                {displayedOption.tags[0] || 'Delivery'}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                {displayedOption.deliveryTime}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                {displayedOption.priceLevel}
              </span>
            </div>

            <button
              id="btn-toggle-favorite-delivery"
              onClick={handleToggleFavorite}
              className="p-1.5 rounded-full text-zinc-400 hover:text-amber-500 transition-colors btn-press cursor-pointer"
              title="Guardar en favoritos"
            >
              <Star className={`w-4 h-4 ${isCurrentFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Food Presentation Hero */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-4xl shadow-xs shrink-0">
              {displayedOption.imageEmoji}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                {displayedOption.name}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {displayedOption.description}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {displayedOption.tags.map((tag, idx) => (
              <span key={idx} className="text-[11px] px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                #{tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            {accepted ? (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 text-center space-y-2 border border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center justify-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-semibold text-xs">
                  <Check className="w-4 h-4" />
                  <span>Elección confirmada y registrada en tu historial</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleCopyName}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-700 border border-black/[0.08] dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 btn-press cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar nombre'}</span>
                  </button>
                  <button
                    onClick={handleSearchDelivery}
                    className="px-4 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium flex items-center gap-1 btn-press cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buscar cerca</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  id="btn-delivery-accept"
                  onClick={handleAccept}
                  disabled={isSpinning}
                  className="w-full py-3 px-5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm btn-press cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Elegir esta opción</span>
                </button>

                <button
                  id="btn-delivery-spin"
                  onClick={handleSpin}
                  disabled={isSpinning || remainingRerolls <= 0}
                  className={`w-full py-3 px-5 rounded-2xl font-medium text-xs flex items-center justify-center gap-1.5 border btn-press cursor-pointer ${
                    remainingRerolls > 0
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-black/[0.08] dark:border-white/[0.08]'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-transparent cursor-not-allowed'
                  }`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>
                    {isSpinning
                      ? 'Girando...'
                      : remainingRerolls > 0
                      ? `Girar de nuevo (${remainingRerolls})`
                      : 'Sin giros'}
                  </span>
                </button>
              </div>
            )}

            {!accepted && remainingRerolls <= 0 && (
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-center space-y-0.5 border border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Has alcanzado el límite diario de 3 giros.
                </p>
                <button
                  onClick={() => {
                    sound.playClick(800);
                    const fresh = resetRerollsToMax();
                    onUpdateRerolls(fresh);
                  }}
                  className="text-[11px] text-zinc-500 hover:underline cursor-pointer"
                >
                  Reiniciar giros
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};
