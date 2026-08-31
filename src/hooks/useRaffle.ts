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
  const currentWinnerIdRef = useRef<string | null>(null);

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

    // Pick final winner excluding previous winner if more than 1 candidate exists
    const previousWinnerId = currentWinnerIdRef.current;
    const alternativePool = candidates.filter(c => c.id !== previousWinnerId);
    const validPool = alternativePool.length > 0 ? alternativePool : candidates;
    const finalWinner = validPool[Math.floor(Math.random() * validPool.length)];

    setDuelCandidateCount(candidates.length);
    setIsDuelActive(true);
    setIsPreparingRaffle(false);
    setIsSpinningDuel(true);
    triggerHaptic('medium');

    let counter = 0;
    const totalFlips = 16;
    const intervalTime = 75;

    spinIntervalRef.current = setInterval(() => {
      if (isCancelledRef.current) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        return;
      }

      counter++;
      if (counter >= totalFlips) {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        setDuelWinner(finalWinner);
        currentWinnerIdRef.current = finalWinner.id;
        setIsSpinningDuel(false);
        sound.playSuccess();
        triggerHaptic('success');
        triggerVictoryConfetti();
      } else {
        const pick = candidates[counter % candidates.length];
        setDuelWinner(pick);
        sound.playTick(600 + (counter * 25));
        triggerHaptic('light');
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
