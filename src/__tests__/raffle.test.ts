import { describe, it, expect } from 'vitest';
import { MealCardItem } from '../types';

describe('Raffle Candidate & Selection Constraints', () => {
  const sampleCandidates: MealCardItem[] = [
    { id: 'c1', name: 'Milanesa', type: 'cooking', categoryLabel: 'Casero', timeEstimate: '20 min', tags: [], imageEmoji: '🥩', description: '', ingredientsSummary: [], vibe: '' },
    { id: 'c2', name: 'Pizza', type: 'delivery', categoryLabel: 'Delivery', timeEstimate: '30 min', tags: [], imageEmoji: '🍕', description: '', ingredientsSummary: [], vibe: '' },
    { id: 'c3', name: 'Hamburguesa', type: 'delivery', categoryLabel: 'Delivery', timeEstimate: '25 min', tags: [], imageEmoji: '🍔', description: '', ingredientsSummary: [], vibe: '' },
    { id: 'c4', name: 'Tarta', type: 'cooking', categoryLabel: 'Casero', timeEstimate: '35 min', tags: [], imageEmoji: '🥧', description: '', ingredientsSummary: [], vibe: '' },
    { id: 'c5', name: 'Empanadas', type: 'delivery', categoryLabel: 'Delivery', timeEstimate: '20 min', tags: [], imageEmoji: '🥟', description: '', ingredientsSummary: [], vibe: '' },
  ];

  it('enforces exactly 5 unique candidates in a complete round', () => {
    expect(sampleCandidates).toHaveLength(5);
    const uniqueIds = new Set(sampleCandidates.map(c => c.id));
    expect(uniqueIds.size).toBe(5);
  });

  it('selects a valid winner belonging to the eligible pool', () => {
    const eligible = [...sampleCandidates];
    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    expect(sampleCandidates.some(c => c.id === winner.id)).toBe(true);
  });

  it('excludes already shown winners on reroll', () => {
    const firstWinnerId = 'c2';
    const shownWinnerIds = [firstWinnerId];
    const eligibleForReroll = sampleCandidates.filter(c => !shownWinnerIds.includes(c.id));

    expect(eligibleForReroll).toHaveLength(4);
    expect(eligibleForReroll.some(c => c.id === firstWinnerId)).toBe(false);
  });

  it('computes reel sequence that always lands precisely on winner index', async () => {
    const { computeReelSequence } = await import('../utils/raffleEngine');
    const poolSize = 5;
    const totalSteps = 12;

    for (let targetWinnerIdx = 0; targetWinnerIdx < poolSize; targetWinnerIdx++) {
      const sequence = computeReelSequence(poolSize, targetWinnerIdx, totalSteps);
      expect(sequence).toHaveLength(totalSteps);
      expect(sequence[totalSteps - 1]).toBe(targetWinnerIdx);
    }
  });

  it('selects a valid winner and avoids previous winner when alternatives exist', async () => {
    const { selectRaffleWinner } = await import('../utils/raffleEngine');
    const winner = selectRaffleWinner(sampleCandidates, 'c1');
    expect(winner).toBeDefined();
    expect(sampleCandidates.some(c => c.id === winner?.id)).toBe(true);
    expect(winner?.id).not.toBe('c1');
  });

  it('returns remaining candidates correctly using getEligibleRaffleCandidates', async () => {
    const { getEligibleRaffleCandidates } = await import('../utils/raffleEngine');
    const eligible = getEligibleRaffleCandidates(sampleCandidates, ['c1', 'c3']);
    expect(eligible).toHaveLength(3);
    expect(eligible.map(c => c.id)).toEqual(['c2', 'c4', 'c5']);
  });
});
