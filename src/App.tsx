import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DecideTodayView } from './components/DecideTodayView';
import { WeeklyPlanView } from './components/WeeklyPlanView';
import { CookMode } from './components/CookMode';
import { SettingsView } from './components/SettingsView';
import { HistoryView } from './components/HistoryView';
import { CreateMealView } from './components/CreateMealView';
import { BlindModeModal } from './components/BlindModeModal';
import { OnboardingModal } from './components/OnboardingModal';
import { WelcomeModal } from './components/WelcomeModal';
import { MealConfirmedModal } from './components/MealConfirmedModal';
import { RecipeQuickModal } from './components/RecipeQuickModal';
import { ExclusionsModal } from './components/ExclusionsModal';
import { FavoritesModal } from './components/FavoritesModal';
import { MealHistoryItem, UserFavoriteMeal, AppTab, Recipe } from './types';
import { 
  loadSavedPantry, 
  loadMealHistory, 
  loadExclusions, 
  loadRerollsState, 
  addMealToHistory, 
  deleteMealFromHistory, 
  clearMealHistory,
  loadUserFavorites,
  addUserFavoriteMeal,
  deleteUserFavoriteMeal
} from './utils/storage';
import { Theme, getInitialTheme, applyTheme } from './utils/theme';
import { sound } from './utils/audio';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';

export default function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AppTab>('decide');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [pantry, setPantry] = useState<string[]>([]);
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<UserFavoriteMeal[]>([]);
  const [remainingRerolls, setRemainingRerolls] = useState<number>(3);
  
  // Modals
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isBlindModeOpen, setIsBlindModeOpen] = useState(false);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [acceptedMealConfirmation, setAcceptedMealConfirmation] = useState<{
    name: string;
    emoji: string;
    type: 'delivery' | 'cooking';
  } | null>(null);

  // Lock background scroll whenever any modal or drawer is active
  useBodyScrollLock(
    isWelcomeOpen ||
    isOnboardingOpen ||
    isBlindModeOpen ||
    isExclusionsOpen ||
    isFavoritesOpen ||
    viewingRecipe !== null ||
    acceptedMealConfirmation !== null ||
    isSidebarOpen
  );

  // Initialize Theme and Storage state
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme);

    setPantry(loadSavedPantry());
    setHistory(loadMealHistory());
    setExclusions(loadExclusions());
    setFavorites(loadUserFavorites());
    
    const rerollState = loadRerollsState();
    setRemainingRerolls(rerollState.remaining);

    // Check if user has already seen welcome screen
    const seenWelcome = localStorage.getItem('cero_ganas_welcome_seen');
    if (!seenWelcome) {
      setIsWelcomeOpen(true);
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleToggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    sound.setEnabled(nextSound);
  };

  const handleAcceptMeal = (
    name: string, 
    type: 'delivery' | 'cooking', 
    emoji: string, 
    details?: string
  ) => {
    const updatedHistory = addMealToHistory(name, type, emoji, details);
    setHistory(updatedHistory);
    setAcceptedMealConfirmation({ name, emoji, type });
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteMealFromHistory(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    const updated = clearMealHistory();
    setHistory(updated);
  };

  const handleAddFavorite = (meal: UserFavoriteMeal) => {
    const updated = addUserFavoriteMeal(meal);
    setFavorites(updated);
  };

  const handleDeleteFavorite = (id: string) => {
    const updated = deleteUserFavoriteMeal(id);
    setFavorites(updated);
  };

  const handleOpenRecipe = (recipe: Recipe) => {
    setViewingRecipe(recipe);
  };

  // Ensure scroll is immediately reset to top on tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  return (
    <div className={`relative ${activeTab === 'decide' ? 'min-h-screen md:h-screen md:overflow-hidden pb-0' : 'min-h-screen pb-8'} bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200 transition-colors duration-200`}>
      {/* Sidebar Navigation Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onChangeTab={tab => setActiveTab(tab)}
        onOpenHistory={() => setActiveTab('history')}
        onOpenBlindMode={() => setIsBlindModeOpen(true)}
        onOpenHelp={() => setIsWelcomeOpen(true)}
        history={history}
        exclusionsCount={exclusions.length}
        favoritesCount={favorites.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Top Header */}
      <Header
        currentMode={activeTab}
        onNavigateHome={() => setActiveTab('decide')}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenBlindMode={() => setIsBlindModeOpen(true)}
        onOpenHelp={() => setIsWelcomeOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Tab Content */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto py-2.5 sm:py-3.5 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'decide' && (
            <motion.div
              key="tab-decide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <DecideTodayView
                pantry={pantry}
                exclusions={exclusions}
                history={history}
                favorites={favorites}
                onAcceptMeal={handleAcceptMeal}
                onAddFavorite={handleAddFavorite}
                onDeleteFavorite={handleDeleteFavorite}
                onOpenRecipeModal={handleOpenRecipe}
                onOpenBlindMode={() => setIsBlindModeOpen(true)}
                onNavigatePantry={() => setActiveTab('pantry')}
              />
            </motion.div>
          )}

          {activeTab === 'weekly' && (
            <motion.div
              key="tab-weekly"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <WeeklyPlanView
                exclusions={exclusions}
                history={history}
                onAcceptMeal={handleAcceptMeal}
                onOpenRecipeModal={handleOpenRecipe}
              />
            </motion.div>
          )}

          {activeTab === 'pantry' && (
            <motion.div
              key="tab-pantry"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <CookMode
                onBack={() => setActiveTab('decide')}
                onAcceptMeal={handleAcceptMeal}
                pantry={pantry}
                onUpdatePantry={updated => setPantry(updated)}
                exclusions={exclusions}
                history={history}
                favorites={favorites}
                onAddFavorite={handleAddFavorite}
                onDeleteFavorite={handleDeleteFavorite}
              />
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="tab-favorites"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    Mis Platos Favoritos
                  </h2>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
                    Tus comidas predilectas para la ruleta
                  </p>
                </div>
              </div>
              <FavoritesModal
                isOpen={true}
                isEmbedded={true}
                onClose={() => setActiveTab('decide')}
                favorites={favorites}
                onAddFavorite={handleAddFavorite}
                onDeleteFavorite={handleDeleteFavorite}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="tab-history"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <HistoryView
                history={history}
                onDeleteHistoryItem={handleDeleteHistoryItem}
                onClearHistory={handleClearHistory}
              />
            </motion.div>
          )}

          {activeTab === 'create_meal' && (
            <motion.div
              key="tab-create-meal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <CreateMealView />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="tab-settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <SettingsView
                exclusions={exclusions}
                onUpdateExclusions={updated => setExclusions(updated)}
                remainingRerolls={remainingRerolls}
                onUpdateRerolls={count => setRemainingRerolls(count)}
                theme={theme}
                onToggleTheme={handleToggleTheme}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                onClearHistory={handleClearHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Blind Mode Modal */}
      <BlindModeModal
        isOpen={isBlindModeOpen}
        onClose={() => setIsBlindModeOpen(false)}
        exclusions={exclusions}
        history={history}
        favorites={favorites}
        onAcceptMeal={handleAcceptMeal}
        onOpenRecipeModal={(item) => {
          if (item.recipe) handleOpenRecipe(item.recipe);
        }}
      />

      {/* Quick Recipe Modal */}
      <RecipeQuickModal
        recipe={viewingRecipe}
        isOpen={viewingRecipe !== null}
        onClose={() => setViewingRecipe(null)}
        onAcceptMeal={handleAcceptMeal}
        favorites={favorites}
        onAddFavorite={handleAddFavorite}
        onDeleteFavorite={handleDeleteFavorite}
      />

      {/* Standalone Favorites Modal */}
      {isFavoritesOpen && activeTab !== 'favorites' && (
        <FavoritesModal
          isOpen={isFavoritesOpen}
          onClose={() => setIsFavoritesOpen(false)}
          favorites={favorites}
          onAddFavorite={handleAddFavorite}
          onDeleteFavorite={handleDeleteFavorite}
        />
      )}

      {/* Exclusions Modal (Fallback if opened directly) */}
      <ExclusionsModal
        isOpen={isExclusionsOpen}
        onClose={() => setIsExclusionsOpen(false)}
        exclusions={exclusions}
        onUpdateExclusions={updated => setExclusions(updated)}
      />

      {/* Welcome & Mascot Greeting Modal */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsWelcomeOpen(false);
        }}
        onOpenBlindMode={() => {
          setIsWelcomeOpen(false);
          setIsBlindModeOpen(true);
        }}
      />

      {/* Onboarding Interactive Guide Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Meal Confirmed / Order Accepted Success Modal */}
      <MealConfirmedModal
        isOpen={acceptedMealConfirmation !== null}
        meal={acceptedMealConfirmation}
        onClose={() => setAcceptedMealConfirmation(null)}
        onViewHistory={() => {
          setAcceptedMealConfirmation(null);
          setActiveTab('history');
        }}
      />
    </div>
  );
}
