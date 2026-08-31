import { useState, useRef, useEffect, useCallback } from 'react';
import { MealCardItem } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic, triggerVictoryConfetti } from '../utils/storage';

export interface UseRaffleReturn {
  isDuelActive: boolean;
  isPreparingRaffle: boolean;
  isSpinningDuel: boolean;
  duelWinner: MealCardItem | null;
  duelCandidateCount: number;
  startRaffleWithPrep: (candidates: MealCardItem[], prepTimeMs?: number) => void;
  startRaffleImmediately: (candidates: MealCardItem[]) => void;
  closeRaffle: () => void;
}

export function useRaffle(): UseRaffleReturn {
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [isPreparingRaffle, setIsPreparingRaffle] = useState(false);
  const [isSpinningDuel, setIsSpinningDuel] = useState(false);
  const [duelWinner, setDuelWinner] = useState<MealCardItem | null>(null);
  const [duelCandidateCount, setDuelCandidateCount] = useState(0);

  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const clearTimers = useCallback(() => {
    isCancelledRef.current = true;
    if (prepTimerRef.current) {
      clearTimeout(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    if (spinIntervalRef.current) {
      clearInterval(spinIntervalRef.current);
      spinIntervalRef.current = null;
    }
  }, []);

  const closeRaffle = useCallback(() => {
    clearTimers();
    setIsDuelActive(false);
    setIsPreparingRaffle(false);
    setIsSpinningDuel(false);
    sound.playClick(600);
  }, [clearTimers]);

  const startRaffleImmediately = useCallback((candidates: MealCardItem[]) => {
    if (candidates.length === 0) return;
    clearTimers();
    isCancelledRef.current = false;

    setDuelCandidateCount(candidates.length);
    setIsDuelActive(true);
    setIsPreparingRaffle(false);
    setIsSpinningDuel(true);
    triggerHaptic('medium');

    let counter = 0;
    const totalFlips = 18;
    const intervalTime = 85;

    spinIntervalRef.current = setInterval(() => {
      if (isCancelledRef.current) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        return;
      }

      counter++;
      const pick = candidates[counter % candidates.length];
      setDuelWinner(pick);
      sound.playTick(600 + (counter * 20));
      triggerHaptic('light');

      if (counter >= totalFlips) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        const finalWinner = candidates[Math.floor(Math.random() * candidates.length)];
        setDuelWinner(finalWinner);
        setIsSpinningDuel(false);
        sound.playSuccess();
        triggerHaptic('success');
        triggerVictoryConfetti();
      }
    }, intervalTime);
  }, [clearTimers]);

  const startRaffleWithPrep = useCallback((candidates: MealCardItem[], prepTimeMs: number = 2000) => {
    if (candidates.length === 0) return;
    clearTimers();
    isCancelledRef.current = false;

    setDuelCandidateCount(candidates.length);
    setIsDuelActive(true);
    setIsPreparingRaffle(true);
    sound.playClick(900);
    triggerHaptic('medium');

    prepTimerRef.current = setTimeout(() => {
      if (isCancelledRef.current) return;
      setIsPreparingRaffle(false);
      startRaffleImmediately(candidates);
    }, prepTimeMs);
  }, [clearTimers, startRaffleImmediately]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    isDuelActive,
    isPreparingRaffle,
    isSpinningDuel,
    duelWinner,
    duelCandidateCount,
    startRaffleWithPrep,
    startRaffleImmediately,
    closeRaffle,
  };
}
