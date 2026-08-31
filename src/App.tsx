import React from 'react';
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
import { WelcomeModal } from './components/WelcomeModal';
import { MealConfirmedModal } from './components/MealConfirmedModal';
import { RecipeQuickModal } from './components/RecipeQuickModal';
import { ExclusionsModal } from './components/ExclusionsModal';
import { FavoritesModal } from './components/FavoritesModal';
import { useAppState } from './hooks/useAppState';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';

export default function App() {
  const {
    theme,
    soundEnabled,
    activeTab,
    isSidebarOpen,
    pantry,
    history,
    exclusions,
    favorites,
    isWelcomeOpen,
    isBlindModeOpen,
    isExclusionsOpen,
    viewingRecipe,
    acceptedMealConfirmation,
    setActiveTab,
    setIsSidebarOpen,
    setPantry,
    setExclusions,
    setIsWelcomeOpen,
    setIsBlindModeOpen,
    setIsExclusionsOpen,
    setViewingRecipe,
    setAcceptedMealConfirmation,
    handleToggleTheme,
    handleToggleSound,
    handleAcceptMeal,
    handleDeleteHistoryItem,
    handleRestoreHistoryItem,
    handleClearHistory,
    handleAddFavorite,
    handleDeleteFavorite,
    handleOpenRecipe,
  } = useAppState();

  // Lock background scroll whenever any modal or drawer is active
  useBodyScrollLock(
    isWelcomeOpen ||
    isBlindModeOpen ||
    isExclusionsOpen ||
    viewingRecipe !== null ||
    acceptedMealConfirmation !== null ||
    isSidebarOpen
  );

  return (
    <div className={`relative ${activeTab === 'decide' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden pb-0' : 'min-h-screen pb-8'} bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col selection:bg-amber-500/30 selection:text-amber-700 dark:selection:text-amber-200 transition-colors duration-200`}>
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
        onNavigateHome={() => setActiveTab('decide')}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenHelp={() => setIsWelcomeOpen(true)}
      />

      {/* Main Tab Content */}
      <main className={`relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-6 ${activeTab === 'decide' ? 'flex-1 flex flex-col min-h-0 py-1.5 sm:py-2.5 overflow-hidden' : 'py-2.5 sm:py-3.5 flex-1'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'decide' && (
            <motion.div
              key="tab-decide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              className="h-full w-full flex flex-col min-h-0"
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
                onOpenRecipeModal={handleOpenRecipe}
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
            >
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
                onRestoreHistoryItem={handleRestoreHistoryItem}
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
