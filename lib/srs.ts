/**
 * SuperMemo-2 Algorithm Implementation
 * 
 * Inputs:
 * - currentInterval: Previous interval in days
 * - currentEase: Current ease factor (minimum 1.3)
 * - grade: User grade (0-5)
 *      5 - perfect response
 *      4 - correct response after hesitation
 *      3 - correct response recalled with serious difficulty
 *      2 - incorrect response; where the correct one seemed easy to recall
 *      1 - incorrect response; the correct one remembered
 *      0 - complete blackout
 * 
 * Returns:
 * - newInterval: New interval in days
 * - newEaseFactor: New ease factor
 * - nextReviewDate: Date object for the next review
 */

export interface SRSResult {
	interval: number;
	easeFactor: number;
	nextReview: string; // ISO string
}

export function calculateReview(
	currentInterval: number,
	currentEase: number,
	grade: number
): SRSResult {
	let newInterval: number;
	let newEase: number;

	if (grade >= 3) {
		if (currentInterval === 0) {
			newInterval = 1;
		} else if (currentInterval === 1) {
			newInterval = 6;
		} else {
			newInterval = Math.round(currentInterval * currentEase);
		}

		newEase = currentEase + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
	} else {
		// If grade is less than 3, the user forgot the card.
		// Reset interval but keep ease factor (or punish slightly, but standard SM-2 doesn't punish ease on fail aggressively)
		newInterval = 1;
		newEase = currentEase;
	}

	// Ensure ease factor doesn't drop below 1.3
	if (newEase < 1.3) {
		newEase = 1.3;
	}

	const nextReviewDate = new Date();
	nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

	return {
		interval: newInterval,
		easeFactor: parseFloat(newEase.toFixed(2)),
		nextReview: nextReviewDate.toISOString(),
	};
}
