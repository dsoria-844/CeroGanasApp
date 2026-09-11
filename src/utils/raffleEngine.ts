import { MealCardItem } from '../types';

/**
 * Standard 12-step deceleration curve in milliseconds (~2.19s total duration).
 */
export const RAFFLE_DELAYS = [50, 50, 50, 60, 75, 95, 125, 170, 230, 310, 420, 560];

/**
 * Filters candidates to find those that haven't won yet in the current round.
 */
export function getEligibleRaffleCandidates(
  roundCandidates: MealCardItem[],
  shownWinnerIds: string[]
): MealCardItem[] {
  const shownSet = new Set(shownWinnerIds);
  return (roundCandidates || []).filter(c => c && !shownSet.has(c.id));
}

/**
 * Pure function to pick a winner from a pool of eligible candidates.
 * Optionally avoids repeating the immediate previous winner if alternatives exist.
 */
export function selectRaffleWinner(
  eligibleCandidates: MealCardItem[],
  previousWinnerId?: string | null
): MealCardItem | null {
  const safeEligible = (eligibleCandidates || []).filter(Boolean);
  if (safeEligible.length === 0) return null;

  if (previousWinnerId) {
    const alternativePool = safeEligible.filter(c => c.id !== previousWinnerId);
    if (alternativePool.length > 0) {
      return alternativePool[Math.floor(Math.random() * alternativePool.length)];
    }
  }

  return safeEligible[Math.floor(Math.random() * safeEligible.length)];
}

/**
 * Computes the exact index sequence for the deceleration reel so that the final step
 * lands precisely on the winner index in the candidate pool.
 */
export function computeReelSequence(
  poolLength: number,
  winnerIndex: number,
  totalSteps: number = RAFFLE_DELAYS.length
): number[] {
  if (poolLength <= 0 || totalSteps <= 0) return [];
  const safeWinnerIdx = Math.max(0, Math.min(winnerIndex, poolLength - 1));
  const offset = (safeWinnerIdx - (totalSteps - 1)) % poolLength;

  const sequence: number[] = [];
  for (let step = 0; step < totalSteps; step++) {
    const idx = (((step + offset) % poolLength) + poolLength) % poolLength;
    sequence.push(idx);
  }
  return sequence;
}
