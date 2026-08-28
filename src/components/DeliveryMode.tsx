import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCw, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
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

const CATEGORIES: { id: DeliveryCategory; label: string; icon: string; desc: string }[] = [
  { id: 'all', label: 'Todo', icon: '✨', desc: 'Cualquier antojo' },
  { id: 'cheat_meal', label: 'Cheat Meal / Fast Food', icon: '🍔', desc: 'Burgers, pizzas, tacos' },
  { id: 'typical', label: 'Minutas / Típica', icon: '🥩', desc: 'Milanesas, pastas, empanadas' },
  { id: 'healthy', label: 'Saludable / Liviano', icon: '🥗', desc: 'Sushi, poke, ensaladas' },
  { id: 'economic', label: 'Económico', icon: '💰', desc: 'Rápido y al mejor precio' },
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

  // Get eligible options based on current category, exclusions, recent 4-day history, and favorites scope
  const eligibleOptions = getEligibleDeliveryOptions(
    selectedCategory, 
    exclusions, 
    history, 
    onlyFavorites, 
    favorites
  );

  // Spin the wheel
  const handleSpin = () => {
    if (isSpinning || remainingRerolls <= 0) return;
    if (eligibleOptions.length === 0) return;

    triggerHaptic('medium');
    setIsSpinning(true);
    setAccepted(false);

    let speed = 60;
    let elapsed = 0;
    const totalDuration = 2000; // 2 seconds spin

    // Pick final random item different from current if possible
    const availablePool = eligibleOptions.length > 1 && displayedOption 
      ? eligibleOptions.filter(o => o.id !== displayedOption.id) 
      : eligibleOptions;
    const finalPick = availablePool[Math.floor(Math.random() * availablePool.length)] || eligibleOptions[0];

    const runShuffle = () => {
      const randomItem = eligibleOptions[Math.floor(Math.random() * eligibleOptions.length)];
      setDisplayedOption(randomItem);
      triggerHaptic('light');

      elapsed += speed;
      if (elapsed < totalDuration) {
        speed = Math.floor(speed * 1.12);
        spinIntervalRef.current = setTimeout(runShuffle, speed);
      } else {
        setDisplayedOption(finalPick);
        setIsSpinning(false);
        triggerHaptic('success');
        
        const newRemaining = decrementRerolls();
        onUpdateRerolls(newRemaining);
      }
    };

    runShuffle();
  };

  useEffect(() => {
    if (eligibleOptions.length > 0) {
      // If current displayed option is not in eligible options, select a valid one
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
    setSelectedCategory(cat);
    const newEligible = getEligibleDeliveryOptions(cat, exclusions, history, onlyFavorites, favorites);
    if (newEligible.length > 0) {
      setDisplayedOption(newEligible[Math.floor(Math.random() * newEligible.length)]);
    }
  };

  const handleScopeToggle = (favsOnly: boolean) => {
    setOnlyFavorites(favsOnly);
    triggerHaptic('light');
  };

  const handleToggleFavorite = () => {
    if (!displayedOption) return;
    const isFav = isMealFavorited(displayedOption.name, favorites);
    if (isFav) {
      const existing = favorites.find(f => f.name.toLowerCase().trim() === displayedOption.name.toLowerCase().trim());
      if (existing) {
        onDeleteFavorite(existing.id);
        triggerHaptic('light');
      }
    } else {
      const newFav = createFavoriteFromDeliveryOption(displayedOption);
      onAddFavorite(newFav);
      triggerHaptic('success');
    }
  };

  const handleAccept = () => {
    if (!displayedOption) return;
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
    navigator.clipboard.writeText(displayedOption.name);
    setCopied(true);
    triggerHaptic('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchDelivery = () => {
    if (!displayedOption) return;
    const query = encodeURIComponent(`${displayedOption.name} delivery cerca de mí`);
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isCurrentFavorite = displayedOption ? isMealFavorited(displayedOption.name, favorites) : false;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-delivery-back"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al menú</span>
        </button>

        {/* Rerolls indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-mono border flex items-center gap-2 ${
            remainingRerolls > 0 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
              : 'bg-zinc-950 border-zinc-800 text-zinc-400'
          }`}>
            <RotateCw className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{remainingRerolls} de 3 giros</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-light text-zinc-50 tracking-tight">
          Pedir Delivery
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-mono">
          Ruleta Anti-Fatiga • Se omiten platos de los últimos 4 días
        </p>
      </div>

      {/* Filter Mode Selection: All Catalog vs Only User Favorites */}
      <div className="p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-1.5 max-w-md">
        <button
          id="btn-scope-all"
          onClick={() => handleScopeToggle(false)}
          className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            !onlyFavorites
              ? 'bg-zinc-100 text-zinc-950 shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>🌐 Todo el catálogo</span>
        </button>

        <button
          id="btn-scope-favorites"
          onClick={() => handleScopeToggle(true)}
          className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
            onlyFavorites
              ? 'bg-amber-500 text-zinc-950 shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-zinc-950' : 'text-amber-400'}`} />
          <span>Solo mis favoritos ({favorites.length})</span>
        </button>
      </div>

      {/* Category Tags Filter (Sophisticated Pills) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`btn-delivery-filter-${cat.id}`}
                onClick={() => handleCategoryChange(cat.id)}
                disabled={isSpinning}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 font-medium shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roulette / Food Presentation Card */}
      {eligibleOptions.length === 0 ? (
        <div className="p-10 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
          <div className="text-3xl">
            {onlyFavorites ? '⭐' : '🤷‍♂️'}
          </div>
          <h3 className="text-lg font-medium text-zinc-100">
            {onlyFavorites 
              ? favorites.length === 0 
                ? 'Aún no tienes platos en favoritos' 
                : 'Ningún favorito coincide con esta categoría / filtros'
              : 'No hay opciones disponibles'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {onlyFavorites
              ? favorites.length === 0
                ? 'Agrega tus platos favoritos para que la ruleta gire exclusivamente entre tus comidas predilectas.'
                : 'Prueba cambiando la categoría o revisa tus ingredientes excluidos.'
              : 'Tus exclusiones o el historial de los últimos 4 días filtraron todas las opciones de esta categoría.'}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            {onlyFavorites ? (
              <>
                <button
                  onClick={onOpenFavoritesModal}
                  className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gestionar Favoritos</span>
                </button>
                <button
                  onClick={() => setOnlyFavorites(false)}
                  className="px-5 py-2.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium text-xs hover:text-white transition-colors cursor-pointer"
                >
                  Ver todo el catálogo
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-5 py-2.5 rounded-full bg-zinc-100 text-zinc-950 font-medium text-xs hover:bg-white transition-colors cursor-pointer"
              >
                Ver todas las opciones
              </button>
            )}
          </div>
        </div>
      ) : displayedOption ? (
        <motion.div
          key={displayedOption.id}
          initial={{ scale: 0.98, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`relative overflow-hidden rounded-3xl border p-8 bg-zinc-900 transition-all ${
            isSpinning 
              ? 'border-zinc-500 shadow-2xl animate-pulse' 
              : accepted 
              ? 'border-zinc-600 bg-zinc-900/90' 
              : 'border-zinc-800 shadow-xl'
          }`}
        >
          {/* Top details badges */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800 text-[10px] uppercase font-mono tracking-wider">
                {displayedOption.tags[0] || 'Delivery'}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                <Clock className="w-3 h-3 text-zinc-400" />
                {displayedOption.deliveryTime}
              </span>
              <span className="text-xs text-zinc-300 font-mono bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800">
                {displayedOption.priceLevel}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Instant Favorite Toggle Button */}
              <button
                id="btn-toggle-favorite-delivery"
                onClick={handleToggleFavorite}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCurrentFavorite
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
                title={isCurrentFavorite ? 'En tus favoritos (clic para quitar)' : 'Guardar en mis favoritos'}
              >
                <Star className={`w-3.5 h-3.5 ${isCurrentFavorite ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                <span className="hidden sm:inline">
                  {isCurrentFavorite ? 'En mis favoritos' : 'Guardar en favoritos'}
                </span>
              </button>

              <span className="text-xs text-zinc-400 font-mono">
                {displayedOption.caloriesApprox}
              </span>
            </div>
          </div>

          {/* Food Presentation Hero */}
          <div className="flex items-start gap-5 mb-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-4xl sm:text-5xl shrink-0 ${
              isSpinning ? 'rotate-12 scale-110 transition-transform' : ''
            }`}>
              {displayedOption.imageEmoji}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-light text-zinc-50 tracking-tight leading-snug">
                {displayedOption.name}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {displayedOption.description}
              </p>
            </div>
          </div>

          {/* Vibe note */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-300 flex items-center gap-2.5 mb-6">
            <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="italic font-serif leading-relaxed text-zinc-300">"{displayedOption.vibe}"</span>
          </div>

          {/* Tags cloud */}
          <div className="flex flex-wrap gap-2 mb-8">
            {displayedOption.tags.map((tag, idx) => (
              <span key={idx} className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-950 text-zinc-400 border border-zinc-800/80">
                #{tag}
              </span>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3">
            {accepted ? (
              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-zinc-100 font-medium text-sm">
                  <CheckCircle2 className="w-5 h-5 text-zinc-200" />
                  <span>¡Elección confirmada y registrada en tu historial!</span>
                </div>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Esta comida quedará excluida de la ruleta durante los próximos 4 días para asegurar variedad.
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={handleCopyName}
                    className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-zinc-200" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar nombre'}</span>
                  </button>
                  <button
                    onClick={handleSearchDelivery}
                    className="px-5 py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buscar opciones cerca</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Accept Button */}
                <button
                  id="btn-delivery-accept"
                  onClick={handleAccept}
                  disabled={isSpinning}
                  className="w-full py-3.5 px-6 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Elijo esta opción!</span>
                </button>

                {/* Spin / Reroll Button */}
                <button
                  id="btn-delivery-spin"
                  onClick={handleSpin}
                  disabled={isSpinning || remainingRerolls <= 0}
                  className={`w-full py-3.5 px-6 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 border hover:scale-[1.01] active:scale-98 transition-all cursor-pointer ${
                    remainingRerolls > 0
                      ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border-zinc-700'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-850 cursor-not-allowed'
                  }`}
                >
                  <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>
                    {isSpinning
                      ? 'Decidiendo...'
                      : remainingRerolls > 0
                      ? `Girar de nuevo (${remainingRerolls})`
                      : 'Sin giros restantes'}
                  </span>
                </button>
              </div>
            )}

            {/* If out of rerolls */}
            {!accepted && remainingRerolls <= 0 && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-1.5">
                <p className="text-xs font-medium text-zinc-200">
                  🎯 ¡Decisión completada!
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Has agotado los 3 giros diarios de control. Confirma esta opción y evita la fatiga de análisis.
                </p>
                <button
                  onClick={() => {
                    const fresh = resetRerollsToMax();
                    onUpdateRerolls(fresh);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 underline pt-1 cursor-pointer"
                >
                  (Reiniciar giros de prueba)
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
};


