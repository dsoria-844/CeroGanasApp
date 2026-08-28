import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  ShoppingBag, 
  Dices, 
  CheckCircle2, 
  Utensils 
} from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerHaptic } from '../utils/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingSlide {
  badge: string;
  badgeIcon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  highlights: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    badge: '¿Cero ganas hoy?',
    badgeIcon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
    title: '¡De pensar! Pero sí de comer',
    subtitle: 'Bienvenido a tu solución contra la fatiga de decisión.',
    description: '¿No sabes qué comer hoy? Cero Ganas te ayuda a elegir rápido, sin vueltas ni discusiones, ya sea para cocinar en casa o pedir por delivery.',
    image: '/sidebar-sloth.jpg',
    highlights: [
      'Sin formularios pesados ni parálisis de análisis',
      'Platos caseros y opciones de delivery en un solo lugar',
      'Tu chef perezoso decide por ti cuando no tienes ganas',
    ],
  },
  {
    badge: '20 Platos & Sorteo',
    badgeIcon: <Dices className="w-3.5 h-3.5 text-emerald-500" />,
    title: 'Navega 20 opciones al azar',
    subtitle: 'Elige tus favoritos y deja que la suerte decida.',
    description: 'Recorre 20 tarjetas de comida con las flechas. Marca «Me interesa» en las que te tienten (o vuelve atrás si cambias de opinión).',
    image: '/modal-bg-sloths.jpg',
    highlights: [
      'Al juntar 5 platos con «Me interesa», se dispara el Sorteo Final',
      'Toca cualquier tarjeta para girarla y ver la receta / ingredientes',
      'Filtra fácilmente por modalidad o categoría de comida',
    ],
  },
  {
    badge: 'Modos Especiales',
    badgeIcon: <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />,
    title: '¡Tengo Hambre! & Despensa',
    subtitle: 'Decisión en 3 segundos o match con lo que tienes.',
    description: '¿Cero tiempo? Toca «¡Tengo Hambre!» para una orden directa instantánea. ¿Quieres cocinar? Usa la «Despensa Inteligente».',
    image: '/sloth-thinking.jpg',
    highlights: [
      '«¡Tengo Hambre!»: Cuenta regresiva de 3s y plato decretado',
      '«Despensa»: Marca tus ingredientes y descubre recetas listas para hacer',
      'Enlaces directos a PedidosYa, Rappi y Uber Eats',
    ],
  },
  {
    badge: '¡Todo listo!',
    badgeIcon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    title: '¡A comer rico y sin estrés!',
    subtitle: 'Accede a esta guía cuando quieras desde la barra lateral.',
    description: 'Guarda tus platos en el historial, agrega tus favoritos y planifica tu semana. ¡Buen provecho!',
    image: '/app-logo.jpg',
    highlights: [
      'Menú lateral con acceso a Historial, Favoritos y Plan Semanal',
      'Sección «Ayuda» siempre disponible para repasar cómo funciona',
      '100% adaptado a tu teléfono móvil y computadora',
    ],
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      sound.playClick(750 + currentSlide * 50);
      triggerHaptic('light');
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      sound.playClick(650);
      triggerHaptic('light');
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    sound.playSuccess();
    triggerHaptic('success');
    onClose();
  };

  const slide = SLIDES[currentSlide];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-5"
        >
          {/* Sloth Background Pattern */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-[0.10] dark:opacity-[0.05] pointer-events-none"
            style={{ backgroundImage: "url('/modal-bg-sloths.jpg')" }}
          />

          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Skip / Close Button */}
          <button
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors btn-press cursor-pointer z-20"
          >
            Saltar
          </button>

          {/* Slide Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-4 pt-2 relative z-10"
            >
              {/* Header Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
                {slide.badgeIcon}
                <span>{slide.badge}</span>
              </div>

              {/* Illustration Image */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 mx-auto rounded-3xl overflow-hidden shadow-xl border-2 border-amber-500/30 bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5 px-2">
                <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                  {slide.title}
                </h3>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {slide.subtitle}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed pt-1">
                  {slide.description}
                </p>
              </div>

              {/* Highlights list */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-black/[0.06] dark:border-white/[0.08] text-left space-y-2">
                {slide.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator & Navigation Controls */}
          <div className="space-y-4 pt-2 relative z-10">
            {/* Step Dots */}
            <div className="flex items-center justify-center gap-2">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sound.playClick(700);
                    setCurrentSlide(idx);
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentSlide
                      ? 'w-7 bg-amber-500'
                      : 'w-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                  }`}
                  title={`Ir al paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {currentSlide > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 btn-press cursor-pointer border border-black/[0.06] dark:border-white/[0.08]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 shadow-md btn-press cursor-pointer"
              >
                <span>{currentSlide === SLIDES.length - 1 ? '¡Comenzar a usar Cero Ganas!' : 'Siguiente'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
