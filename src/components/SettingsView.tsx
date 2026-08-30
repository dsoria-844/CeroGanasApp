import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Plus, 
  X, 
  AlertCircle, 
  RotateCw, 
  Trash2, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Check,
  RotateCcw,
  Sparkles,
  Trophy,
  Bike,
  Smartphone
} from 'lucide-react';
import { COMMON_EXCLUSIONS } from '../data/mealsData';
import { ModalityFilter } from '../types';
import { 
  saveExclusionsToStorage, 
  triggerHaptic, 
  resetRerollsToMax,
  loadDuelThreshold,
  saveDuelThreshold,
  loadDuelEnabled,
  saveDuelEnabled,
  loadPreferredModality,
  savePreferredModality,
  loadDefaultDeliveryApp,
  saveDefaultDeliveryApp,
  DeliveryApp
} from '../utils/storage';
import { Theme } from '../utils/theme';
import { sound } from '../utils/audio';

interface SettingsViewProps {
  exclusions: string[];
  onUpdateExclusions: (newExclusions: string[]) => void;
  remainingRerolls: number;
  onUpdateRerolls: (count: number) => void;
  theme: Theme;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearHistory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  exclusions,
  onUpdateExclusions,
  remainingRerolls,
  onUpdateRerolls,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onClearHistory,
}) => {
  const [customInput, setCustomInput] = useState('');
  const [showClearSuccess, setShowClearSuccess] = useState(false);
  const [duelThreshold, setDuelThreshold] = useState<number>(5);
  const [isDuelEnabled, setIsDuelEnabled] = useState<boolean>(false);
  const [preferredModality, setPreferredModality] = useState<ModalityFilter>('all');
  const [defaultDeliveryApp, setDefaultDeliveryApp] = useState<DeliveryApp>('pedidosya');

  useEffect(() => {
    setDuelThreshold(loadDuelThreshold());
    setIsDuelEnabled(loadDuelEnabled());
    setPreferredModality(loadPreferredModality());
    setDefaultDeliveryApp(loadDefaultDeliveryApp());
  }, []);

  const handleSelectModality = (mod: ModalityFilter) => {
    sound.playClick(850);
    triggerHaptic('light');
    setPreferredModality(mod);
    savePreferredModality(mod);
  };

  const handleToggleDuelEnabled = () => {
    sound.playClick(isDuelEnabled ? 500 : 900);
    triggerHaptic('medium');
    const newVal = !isDuelEnabled;
    setIsDuelEnabled(newVal);
    saveDuelEnabled(newVal);
  };

  const handleSelectThreshold = (count: number) => {
    sound.playClick(850);
    triggerHaptic('light');
    setDuelThreshold(count);
    saveDuelThreshold(count);
  };

  const handleSelectDeliveryApp = (app: DeliveryApp) => {
    sound.playClick(850);
    triggerHaptic('light');
    setDefaultDeliveryApp(app);
    saveDefaultDeliveryApp(app);
  };

  const toggleExclusion = (idOrName: string) => {
    sound.playClick(800);
    triggerHaptic('light');
    let updated: string[];
    const normalized = idOrName.toLowerCase().trim();
    if (exclusions.some(e => e.toLowerCase() === normalized)) {
      updated = exclusions.filter(e => e.toLowerCase() !== normalized);
    } else {
      updated = [...exclusions, normalized];
    }
    onUpdateExclusions(updated);
    saveExclusionsToStorage(updated);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const normalized = customInput.toLowerCase().trim();
    if (!exclusions.some(e => e.toLowerCase() === normalized)) {
      sound.playSuccess();
      const updated = [...exclusions, normalized];
      onUpdateExclusions(updated);
      saveExclusionsToStorage(updated);
      triggerHaptic('success');
    }
    setCustomInput('');
  };

  const removeExclusion = (item: string) => {
    sound.playClick(450);
    triggerHaptic('light');
    const updated = exclusions.filter(e => e.toLowerCase() !== item.toLowerCase());
    onUpdateExclusions(updated);
    saveExclusionsToStorage(updated);
  };

  const clearAllExclusions = () => {
    sound.playClick(450);
    triggerHaptic('medium');
    onUpdateExclusions([]);
    saveExclusionsToStorage([]);
  };

  const handleResetRerolls = () => {
    sound.playSuccess();
    triggerHaptic('success');
    const count = resetRerollsToMax();
    onUpdateRerolls(count);
  };

  const handleClearHistoryClick = () => {
    sound.playClick(450);
    triggerHaptic('medium');
    onClearHistory();
    setShowClearSuccess(true);
    setTimeout(() => setShowClearSuccess(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Configuración
        </h2>
        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5 font-medium">
          Ajustes generales, bloqueos de alimentos y preferencias de la aplicación
        </p>
      </div>

      {/* SECCIÓN 1: META DE PLATOS A ACUMULAR PARA SORTEO */}
      <div className="apple-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Platos a Acumular para Sorteo</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              El botón de sortear siempre está disponible. Aquí puedes activar o desactivar el disparo automático al acumular cierta cantidad de platos.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Activar meta de platos a acumular
            </span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isDuelEnabled
                ? `El sorteo iniciará automáticamente al marcar ${duelThreshold} platos con "Me interesa"`
                : 'Deshabilitado: el sorteo solo se realiza cuando tocas el botón "Sortear"'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleDuelEnabled}
            className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-1 cursor-pointer btn-press shrink-0 ${
              isDuelEnabled ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
            title={isDuelEnabled ? 'Desactivar meta de acumulación' : 'Activar meta de acumulación'}
          >
            <motion.div
              animate={{ x: isDuelEnabled ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
        </div>

        {/* Threshold controls (Only visible when Sorteo Final is enabled) */}
        {isDuelEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-1"
          >
            {/* Interactive Stepper & Direct Number Input */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Platos a acumular
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Mínimo 2 • Máximo 20 platos
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={duelThreshold <= 2}
                  onClick={() => handleSelectThreshold(Math.max(2, duelThreshold - 1))}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center font-bold text-base text-zinc-800 dark:text-zinc-200 disabled:opacity-30 btn-press cursor-pointer shadow-2xs"
                  title="Disminuir"
                >
                  -
                </button>

                <input
                  type="number"
                  min={2}
                  max={20}
                  value={duelThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      const clamped = Math.min(20, Math.max(2, val));
                      handleSelectThreshold(clamped);
                    }
                  }}
                  className="w-14 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-center font-extrabold text-base text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                />

                <button
                  type="button"
                  disabled={duelThreshold >= 20}
                  onClick={() => handleSelectThreshold(Math.min(20, duelThreshold + 1))}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center font-bold text-base text-zinc-800 dark:text-zinc-200 disabled:opacity-30 btn-press cursor-pointer shadow-2xs"
                  title="Aumentar"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-zinc-400 font-semibold mr-1">Atajos rápidos:</span>
              {[2, 3, 5, 8, 10, 15, 20].map(count => {
                const isSelected = duelThreshold === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSelectThreshold(count)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all btn-press cursor-pointer border ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-50'
                    }`}
                  >
                    {count} {count === 1 ? 'plato' : 'platos'}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* SECCIÓN 2: MODALIDAD PREDETERMINADA DE COMIDAS */}
      <div className="apple-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Modalidad Predeterminada de Comidas</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Configura qué tipo de opciones sugerir principalmente (solo cocinar, solo delivery o ambas)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {[
            { id: 'all' as ModalityFilter, label: 'Ambas opciones', subtitle: 'Cocinar y Delivery', emoji: '🍽️' },
            { id: 'cooking' as ModalityFilter, label: 'Solo Cocinar', subtitle: 'Solo recetas caseras', emoji: '🍳' },
            { id: 'delivery' as ModalityFilter, label: 'Solo Delivery', subtitle: 'Solo locales para pedir', emoji: '🛵' },
          ].map(opt => {
            const isSelected = preferredModality === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectModality(opt.id)}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all btn-press cursor-pointer border ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left">
                  <span className="text-xl">{opt.emoji}</span>
                  <div>
                    <p className="text-xs font-bold leading-tight">{opt.label}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                      {opt.subtitle}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: APP DE DELIVERY PREDETERMINADA */}
      <div className="apple-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-500" />
              <span>Aplicación de Delivery Predeterminada</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Elige en qué plataforma buscar y pedir cuando selecciones delivery
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {[
            { id: 'pedidosya', label: 'PedidosYa', subtitle: 'pedidosya.com.ar', emoji: '🛵' },
            { id: 'rappi', label: 'Rappi', subtitle: 'rappi.com.ar', emoji: '🧡' },
            { id: 'google', label: 'Búsqueda Web', subtitle: 'Google Delivery', emoji: '🔍' },
          ].map(app => {
            const isSelected = defaultDeliveryApp === app.id;
            return (
              <button
                key={app.id}
                onClick={() => handleSelectDeliveryApp(app.id as DeliveryApp)}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all btn-press cursor-pointer border ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5 text-left">
                  <span className="text-xl">{app.emoji}</span>
                  <div>
                    <p className="text-xs font-bold leading-tight">{app.label}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>
                      {app.subtitle}
                    </p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: BLOQUEO DE INGREDIENTES */}
      <div className="apple-card p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Bloqueos & Exclusiones</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ingredientes que la app omitirá por completo en todas las sugerencias
            </p>
          </div>
        </div>

        {/* Common Exclusions Grid */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            Ingredientes frecuentes para bloquear:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COMMON_EXCLUSIONS.map(item => {
              const isExcluded = exclusions.some(e => e.toLowerCase() === item.id.toLowerCase());
              return (
                <button
                  key={item.id}
                  onClick={() => toggleExclusion(item.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all btn-press cursor-pointer ${
                    isExcluded
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-500/30 text-red-700 dark:text-red-300'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-black/[0.06] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 hover:border-black/[0.12] dark:hover:border-white/[0.12]'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isExcluded ? (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-zinc-400">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleAddCustom} className="space-y-2 pt-2">
          <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            Agregar ingrediente personalizado:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej. cilantro, berenjena, mariscos..."
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold btn-press disabled:opacity-40 flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bloquear</span>
            </button>
          </div>
        </form>

        {/* Active Blocked List */}
        <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
              Ingredientes bloqueados activos ({exclusions.length}):
            </label>
            {exclusions.length > 0 && (
              <button
                onClick={clearAllExclusions}
                className="text-xs text-zinc-400 hover:text-red-500 transition-colors btn-press cursor-pointer"
              >
                Borrar todos
              </button>
            )}
          </div>

          {exclusions.length === 0 ? (
            <p className="text-xs text-zinc-400 italic py-1">
              No tienes ingredientes bloqueados. Se incluirán todas las recetas y menús.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {exclusions.map((exc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06] text-zinc-800 dark:text-zinc-200 text-xs font-medium"
                >
                  <span>🚫 {exc}</span>
                  <button
                    onClick={() => removeExclusion(exc)}
                    className="text-zinc-400 hover:text-red-500 p-0.5 btn-press cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 4: PREFERENCIAS DE INTERFAZ & SONIDO */}
      <div className="apple-card p-6 sm:p-7 space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          Preferencias de Interfaz & Sonido
        </h3>

        {/* Theme Preference */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-xs">
              {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-300" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Tema de Color
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Modo actual: {theme === 'light' ? 'Claro (Apple Minimal)' : 'Oscuro (OLED)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick(600);
              onToggleTheme();
            }}
            className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs btn-press cursor-pointer"
          >
            Cambiar
          </button>
        </div>

        {/* Audio Effects Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-xs">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Efectos Sonoros & Clics
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {soundEnabled ? 'Sonidos de clics y sorteo habilitados' : 'Aplicación en silencio'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick(soundEnabled ? 400 : 900);
              onToggleSound();
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs btn-press cursor-pointer border ${
              soundEnabled
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-black/[0.08] dark:border-white/[0.08]'
            }`}
          >
            {soundEnabled ? 'Habilitado' : 'Deshabilitado'}
          </button>
        </div>
      </div>

      {/* SECCIÓN 5: GESTIÓN DE DATOS & RULETA */}
      <div className="apple-card p-6 sm:p-7 space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
          Gestión de Datos & Ruleta
        </h3>

        {/* Reset Rerolls */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-xs">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Giros Diarios de Ruleta
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Disponibles: {remainingRerolls} de 3 giros diarios
              </p>
            </div>
          </div>

          <button
            onClick={handleResetRerolls}
            className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs btn-press cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer (3)</span>
          </button>
        </div>

        {/* Clear Meal History */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-xs">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Historial de Comidas
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Borrar todos los registros de comidas guardadas
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistoryClick}
            className="px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-500/20 text-red-700 dark:text-red-300 text-xs font-semibold shadow-xs btn-press cursor-pointer flex items-center gap-1"
          >
            {showClearSuccess ? <Check className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
            <span>{showClearSuccess ? 'Borrado' : 'Limpiar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
