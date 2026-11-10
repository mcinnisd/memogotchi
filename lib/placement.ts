import { PLACEMENT } from '@/lib/config';

export type PlacementDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface PlacementResponse {
	correct: boolean;
	timeMs: number;
}

export function evaluatePlacementScore(responses: PlacementResponse[]): {
	recommendedDifficulty: PlacementDifficulty;
	confidenceScore: number;
} {
	const totalQuestions = Math.max(1, responses.length);
	let score = 0;
	responses.forEach((response) => {
		if (!response.correct) return;
		score += 1;
		if (response.timeMs < 10_000) score += 0.5;
	});

	const maxScore = totalQuestions * 1.5;
	const percentage = (score / maxScore) * 100;

	if (percentage >= 70) {
		return {
			recommendedDifficulty: 'Advanced',
			confidenceScore: Math.min(90, percentage),
		};
	}
	if (percentage >= 40) {
		return {
			recommendedDifficulty: 'Intermediate',
			confidenceScore: Math.min(85, 50 + percentage / 2),
		};
	}
	return {
		recommendedDifficulty: 'Beginner',
		confidenceScore: Math.min(80, 30 + percentage),
	};
}

export function proficiencyFromPlacement(level: PlacementDifficulty): number {
	if (level === 'Advanced') return 75;
	if (level === 'Intermediate') return 50;
	return 25;
}

/**
 * Adaptive stop: keep asking until confidence clears the bar, the cap is hit,
 * or the generator has nothing new left.
 */
export function shouldContinuePlacement(input: {
	answered: number;
	confidence: number;
	moreAvailable: boolean;
	minConfidence?: number;
	maxQuestions?: number;
}): boolean {
	const minConfidence = input.minConfidence ?? PLACEMENT.minConfidence;
	const maxQuestions = input.maxQuestions ?? PLACEMENT.maxQuestions;
	if (!input.moreAvailable) return false;
	if (input.answered >= maxQuestions) return false;
	if (input.answered > 0 && input.confidence >= minConfidence) return false;
	return true;
}
