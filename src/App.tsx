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
  const [isBlindModeOpen, setIsBlindModeOpen] = useState(false);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

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

  return (
    <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200 pb-10 transition-colors duration-200">
      {/* App Ambient Sloth Pattern Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-[0.07] dark:opacity-[0.035] pointer-events-none z-0"
        style={{ backgroundImage: "url('/modal-bg-sloths.jpg')" }}
      />
      {/* Sidebar Navigation Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onChangeTab={tab => setActiveTab(tab)}
        onOpenHistory={() => setActiveTab('history')}
        onOpenBlindMode={() => setIsBlindModeOpen(true)}
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
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
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
    </div>
  );
}
