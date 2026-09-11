import { useState, useRef, useEffect, useCallback } from 'react';
import { MealCardItem } from '../types';
import { sound } from '../utils/audio';
import { triggerHaptic, triggerVictoryConfetti } from '../utils/storage';
import { 
  computeReelSequence, 
  getEligibleRaffleCandidates, 
  RAFFLE_DELAYS, 
  selectRaffleWinner 
} from '../utils/raffleEngine';

export type RaffleState = 'IDLE' | 'DRAWING' | 'WINNER';

export interface UseRaffleReturn {
  raffleState: RaffleState;
  isDuelActive: boolean;
  isPreparingRaffle: boolean;
  isSpinningDuel: boolean;
  duelWinner: MealCardItem | null;
  duelCandidateCount: number;
  drawingCandidates: MealCardItem[];
  activeCandidate: MealCardItem | null;
  activeCandidateIndex: number;
  roundCandidates: MealCardItem[];
  shownWinnerIds: string[];
  eligibleCandidates: MealCardItem[];
  remainingCount: number;
  canReroll: boolean;
  roundId: number;
  startRaffle: (candidates: MealCardItem[]) => void;
  startRaffleWithPrep: (candidates: MealCardItem[], prepTimeMs?: number) => void;
  startRaffleImmediately: (candidates: MealCardItem[]) => void;
  rerollRaffle: () => boolean;
  resetRerolls: () => void;
  closeRaffle: () => void;
}

export function useRaffle(): UseRaffleReturn {
  const [isDuelActive, setIsDuelActive] = useState(false);
  const [isPreparingRaffle, setIsPreparingRaffle] = useState(false);
  const [isSpinningDuel, setIsSpinningDuel] = useState(false);
  const [duelWinner, setDuelWinner] = useState<MealCardItem | null>(null);
  const [duelCandidateCount, setDuelCandidateCount] = useState(0);
  const [drawingCandidates, setDrawingCandidates] = useState<MealCardItem[]>([]);
  const [activeCandidate, setActiveCandidate] = useState<MealCardItem | null>(null);
  const [activeCandidateIndex, setActiveCandidateIndex] = useState<number>(-1);

  // Single Source of Truth for Round State
  const [roundCandidates, setRoundCandidates] = useState<MealCardItem[]>([]);
  const [shownWinnerIds, setShownWinnerIds] = useState<string[]>([]);

  const roundCandidatesRef = useRef<MealCardItem[]>([]);
  const shownWinnerIdsRef = useRef<string[]>([]);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const isSpinningRef = useRef<boolean>(false);
  const currentWinnerIdRef = useRef<string | null>(null);
  const roundIdRef = useRef<number>(1);

  const clearTimers = useCallback(() => {
    isCancelledRef.current = true;
    isSpinningRef.current = false;
    if (prepTimerRef.current) {
      clearTimeout(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeRaffle = useCallback(() => {
    roundIdRef.current++;
    clearTimers();
    setIsDuelActive(false);
    setIsPreparingRaffle(false);
    setIsSpinningDuel(false);
    setDuelWinner(null);
    setDuelCandidateCount(0);
    setDrawingCandidates([]);
    setActiveCandidate(null);
    setActiveCandidateIndex(-1);
    roundCandidatesRef.current = [];
    setRoundCandidates([]);
    shownWinnerIdsRef.current = [];
    setShownWinnerIds([]);
    sound.playClick(600);
  }, [clearTimers]);

  // Execute animation reel and land on the precalculated finalWinner
  const runDrawAnimation = useCallback((
    poolForAnimation: MealCardItem[],
    finalWinner: MealCardItem,
    targetRoundId: number
  ) => {
    const winnerIdx = poolForAnimation.findIndex(c => c.id === finalWinner.id);
    const targetWinnerIdx = winnerIdx >= 0 ? winnerIdx : 0;
    const sequence = computeReelSequence(poolForAnimation.length, targetWinnerIdx, RAFFLE_DELAYS.length);
    const totalSteps = sequence.length;

    let step = 0;

    const runStep = () => {
      // Async protection: If cancelled or round has changed, abort immediately
      if (isCancelledRef.current || roundIdRef.current !== targetRoundId) {
        isSpinningRef.current = false;
        return;
      }

      if (step >= totalSteps) {
        // Animation finished: double-check round identity before revealing winner
        if (roundIdRef.current !== targetRoundId) {
          isSpinningRef.current = false;
          return;
        }

        isSpinningRef.current = false;
        setIsSpinningDuel(false);
        setDuelWinner(finalWinner);
        currentWinnerIdRef.current = finalWinner.id;

        // Record final winner in round's shownWinnerIds (synchronously and reactively)
        shownWinnerIdsRef.current = [
          ...shownWinnerIdsRef.current.filter(id => id !== finalWinner.id),
          finalWinner.id,
        ];
        setShownWinnerIds(prev => (prev.includes(finalWinner.id) ? prev : [...prev, finalWinner.id]));

        setActiveCandidate(finalWinner);
        setActiveCandidateIndex(targetWinnerIdx);

        sound.playSuccess();
        triggerHaptic('success');
        triggerVictoryConfetti();
        return;
      }

      const candidateIdx = sequence[step];
      const pick = poolForAnimation[candidateIdx];
      setActiveCandidate(pick);
      setActiveCandidateIndex(candidateIdx);

      // Pitch climbs slightly with suspense
      sound.playTick(580 + (step * 24));
      triggerHaptic('light');

      const currentDelay = RAFFLE_DELAYS[step];
      step++;
      timeoutRef.current = setTimeout(runStep, currentDelay);
    };

    runStep();
  }, []);

  const startRaffleImmediately = useCallback((candidates: MealCardItem[]) => {
    // Guard against duplicate invocations while drawing
    if (isSpinningRef.current) return;

    const list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
    if (list.length === 0) return;

    const currentRoundId = ++roundIdRef.current;
    clearTimers();
    isCancelledRef.current = false;
    isSpinningRef.current = true;

    // Initialize round candidates and reset shown winners for this new round
    roundCandidatesRef.current = list;
    setRoundCandidates(list);
    shownWinnerIdsRef.current = [];
    setShownWinnerIds([]);

    // 1st draw: all candidates are eligible
    const eligible = list;

    // Pick final winner upfront using pure selection engine
    const finalWinner = selectRaffleWinner(eligible, currentWinnerIdRef.current);
    if (!finalWinner) return;

    setDrawingCandidates(eligible);
    setDuelCandidateCount(list.length);
    setDuelWinner(null); // Winner is kept null during DRAWING to prevent state ambiguity
    setIsDuelActive(true);
    setIsPreparingRaffle(false);
    setIsSpinningDuel(true);
    triggerHaptic('medium');

    runDrawAnimation(eligible, finalWinner, currentRoundId);
  }, [clearTimers, runDrawAnimation]);

  // "Dame otra opción": re-draw among the remaining candidates in the current round
  const rerollRaffle = useCallback((): boolean => {
    // Guard against duplicate clicks, rolling while already drawing, or rolling outside WINNER state
    if (isSpinningRef.current || !isDuelActive || !duelWinner) return false;

    const roundList = roundCandidatesRef.current;
    if (roundList.length === 0) return false;

    // Eligible candidates = round candidates whose id is NOT in shownWinnerIds
    const eligible = getEligibleRaffleCandidates(roundList, shownWinnerIdsRef.current);
    if (eligible.length === 0) return false;

    const currentRoundId = roundIdRef.current;
    clearTimers();
    isCancelledRef.current = false;
    isSpinningRef.current = true;

    // Pick new winner randomly from eligible candidates using pure selection engine
    const finalWinner = selectRaffleWinner(eligible);
    if (!finalWinner) return false;

    setDrawingCandidates(eligible);
    setDuelWinner(null); // Return to DRAWING cleanly
    setIsSpinningDuel(true);
    triggerHaptic('medium');

    runDrawAnimation(eligible, finalWinner, currentRoundId);
    return true;
  }, [isDuelActive, duelWinner, clearTimers, runDrawAnimation]);

  // Reset shown winners so the round's candidates can be re-shuffled if exhausted
  const resetRerolls = useCallback(() => {
    if (duelWinner) {
      shownWinnerIdsRef.current = [duelWinner.id];
      setShownWinnerIds([duelWinner.id]);
    } else {
      shownWinnerIdsRef.current = [];
      setShownWinnerIds([]);
    }
  }, [duelWinner]);

  const startRaffleWithPrep = useCallback((candidates: MealCardItem[], _prepTimeMs: number = 0) => {
    startRaffleImmediately(candidates);
  }, [startRaffleImmediately]);

  const startRaffle = useCallback((candidates: MealCardItem[]) => {
    startRaffleImmediately(candidates);
  }, [startRaffleImmediately]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const raffleState: RaffleState = !isDuelActive 
    ? 'IDLE' 
    : isSpinningDuel 
      ? 'DRAWING' 
      : duelWinner 
        ? 'WINNER' 
        : 'IDLE';

  // Derived state: Single Source of Truth for remaining eligible candidates
  const eligibleCandidates = getEligibleRaffleCandidates(roundCandidates, shownWinnerIds);
  const remainingCount = eligibleCandidates.length;
  const canReroll = remainingCount > 0;

  return {
    raffleState,
    isDuelActive,
    isPreparingRaffle,
    isSpinningDuel,
    duelWinner,
    duelCandidateCount,
    drawingCandidates,
    activeCandidate,
    activeCandidateIndex,
    roundCandidates,
    shownWinnerIds,
    eligibleCandidates,
    remainingCount,
    canReroll,
    roundId: roundIdRef.current,
    startRaffle,
    startRaffleWithPrep,
    startRaffleImmediately,
    rerollRaffle,
    resetRerolls,
    closeRaffle,
  };
}
