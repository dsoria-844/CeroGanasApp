import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DecideTodayView } from './components/DecideTodayView';
import { WeeklyPlanView } from './components/WeeklyPlanView';
import { CookMode } from './components/CookMode';
import { BottomNavBar } from './components/BottomNavBar';
import { BlindModeModal } from './components/BlindModeModal';
import { RecipeQuickModal } from './components/RecipeQuickModal';
import { ExclusionsModal } from './components/ExclusionsModal';
import { HistoryModal } from './components/HistoryModal';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('decide');
  const [pantry, setPantry] = useState<string[]>([]);
  const [history, setHistory] = useState<MealHistoryItem[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<UserFavoriteMeal[]>([]);
  const [remainingRerolls, setRemainingRerolls] = useState<number>(3);
  
  // Modals
  const [isBlindModeOpen, setIsBlindModeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExclusionsOpen, setIsExclusionsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Initialize state from LocalStorage on mount
  useEffect(() => {
    setPantry(loadSavedPantry());
    setHistory(loadMealHistory());
    setExclusions(loadExclusions());
    setFavorites(loadUserFavorites());
    
    const rerollState = loadRerollsState();
    setRemainingRerolls(rerollState.remaining);
  }, []);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200 pb-20">
      {/* Top Header */}
      <Header
        currentMode={activeTab}
        onNavigateHome={() => setActiveTab('decide')}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExclusions={() => setIsExclusionsOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenBlindMode={() => setIsBlindModeOpen(true)}
        history={history}
        exclusionsCount={exclusions.length}
        favoritesCount={favorites.length}
        remainingRerolls={remainingRerolls}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
        {activeTab === 'decide' && (
          <DecideTodayView
            exclusions={exclusions}
            history={history}
            favorites={favorites}
            onAcceptMeal={handleAcceptMeal}
            onAddFavorite={handleAddFavorite}
            onDeleteFavorite={handleDeleteFavorite}
            onOpenRecipeModal={handleOpenRecipe}
            onOpenBlindMode={() => setIsBlindModeOpen(true)}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyPlanView
            exclusions={exclusions}
            history={history}
            onAcceptMeal={handleAcceptMeal}
            onOpenRecipeModal={handleOpenRecipe}
          />
        )}

        {activeTab === 'pantry' && (
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
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-zinc-100">Mis Platos Favoritos</h2>
                <p className="text-xs text-zinc-400">Tus comidas predilectas guardadas en LocalStorage.</p>
              </div>
            </div>
            {/* Embedded Favorites View */}
            <FavoritesModal
              isOpen={true}
              isEmbedded={true}
              onClose={() => setActiveTab('decide')}
              favorites={favorites}
              onAddFavorite={handleAddFavorite}
              onDeleteFavorite={handleDeleteFavorite}
            />
          </div>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR (Mobile-First PWA) */}
      <BottomNavBar
        activeTab={activeTab}
        onChangeTab={tab => setActiveTab(tab)}
        favoritesCount={favorites.length}
      />

      {/* ⚡ MODO A CIEGAS MODAL */}
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

      {/* QUICK RECIPE MODAL */}
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

      {/* Exclusions Modal / Lista Negra */}
      <ExclusionsModal
        isOpen={isExclusionsOpen}
        onClose={() => setIsExclusionsOpen(false)}
        exclusions={exclusions}
        onUpdateExclusions={updated => setExclusions(updated)}
      />

      {/* History Modal (4 Days) */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
