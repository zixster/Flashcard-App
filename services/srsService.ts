import { Card, SRSData } from '../types';

export const INITIAL_SRS_DATA: SRSData = {
  interval: 0,
  ease: 2.5,
  dueDate: Date.now(),
  streak: 0,
  history: []
};

// Simple SM-2 Algorithm implementation
export const calculateNewSRS = (current: SRSData, quality: number): SRSData => {
  // Quality: 0-2 (Fail), 3-5 (Pass)
  // In our simplified app: 0 = Wrong, 5 = Correct/Easy, 3 = Correct/Hard
  
  let newInterval = 0;
  let newEase = current.ease;
  let newStreak = current.streak;

  if (quality >= 3) {
    if (newStreak === 0) {
      newInterval = 1;
    } else if (newStreak === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(current.interval * current.ease);
    }
    newStreak++;
  } else {
    newStreak = 0;
    newInterval = 1; // Reset to 1 day if wrong
  }

  // Adjust Ease
  newEase = current.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEase < 1.3) newEase = 1.3;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const newDueDate = Date.now() + (newInterval * ONE_DAY_MS);

  return {
    interval: newInterval,
    ease: newEase,
    dueDate: newDueDate,
    streak: newStreak,
    history: [...current.history, quality >= 3 ? 1 : 0]
  };
};

export const isDue = (card: Card): boolean => {
  return card.srs.dueDate <= Date.now();
};
