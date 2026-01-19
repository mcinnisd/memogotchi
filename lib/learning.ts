/**
 * Learning Algorithm - Pure Functions
 * 
 * These are pure calculation functions with no side effects.
 * Used by both client and server code.
 */

export interface ReviewSignals {
	grade: number;           // 1-5
	responseTimeMs: number;  // Time from card shown to swipe
	wasFlipped: boolean;     // Did user tap to see answer?
	cardDifficulty: number;  // 1-10 difficulty rating
}

export interface PerformanceResult {
	rawScore: number;        // 0-1 weighted performance
	gradeScore: number;
	timeScore: number;
	flipScore: number;
	difficultyAdjusted: number;
}

// Signal weights
const WEIGHTS = {
	grade: 0.40,
	time: 0.25,
	flip: 0.15,
	difficulty: 0.20
};

// Time thresholds (adjust based on proficiency)
function getTimeScore(timeMs: number, proficiency: number): number {
	// Lower proficiency = more lenient timing
	const proficiencyFactor = 1 + (proficiency - 50) / 100; // 0.5 to 1.5

	const optimalMin = 2000 * proficiencyFactor;  // 2-3 seconds at baseline
	const optimalMax = 10000 * proficiencyFactor; // 10-15 seconds at baseline

	if (timeMs < optimalMin) {
		// Too fast - possibly guessing, but okay for easy cards
		return 0.4;
	} else if (timeMs <= optimalMax) {
		// Optimal range - confident recall
		return 1.0;
	} else if (timeMs <= optimalMax * 1.5) {
		// Slow but got it
		return 0.6;
	} else {
		// Very slow - struggled significantly
		return 0.3;
	}
}

function getGradeScore(grade: number): number {
	switch (grade) {
		case 5: return 1.0;   // Easy
		case 4: return 0.7;   // Good
		case 3: return 0.4;   // Hard
		case 2: return 0.2;   // Very Hard
		case 1: return 0.0;   // Again
		default: return 0.5;
	}
}

function getFlipScore(wasFlipped: boolean): number {
	return wasFlipped ? 0.05 : 0.15;
}

function getDifficultyAdjustment(rawScore: number, cardDifficulty: number): number {
	// Getting a hard card right is worth more
	// Getting an easy card wrong is penalized more
	const difficultyOffset = (cardDifficulty - 5) * 0.05;
	return Math.max(0, Math.min(1, rawScore * (1 + difficultyOffset)));
}

/**
 * Calculate weighted performance score from review signals
 */
export function calculatePerformance(signals: ReviewSignals, currentProficiency: number): PerformanceResult {
	const gradeScore = getGradeScore(signals.grade);
	const timeScore = getTimeScore(signals.responseTimeMs, currentProficiency);
	const flipScore = getFlipScore(signals.wasFlipped);

	const rawScore =
		(gradeScore * WEIGHTS.grade) +
		(timeScore * WEIGHTS.time) +
		(flipScore * WEIGHTS.flip);

	const difficultyAdjusted = getDifficultyAdjustment(rawScore, signals.cardDifficulty);

	// Final score includes difficulty adjustment at its weight
	const finalRaw = rawScore * (1 - WEIGHTS.difficulty) + difficultyAdjusted * WEIGHTS.difficulty;

	return {
		rawScore: finalRaw,
		gradeScore,
		timeScore,
		flipScore,
		difficultyAdjusted
	};
}

/**
 * Calculate new proficiency based on performance
 */
export function calculateProficiencyUpdate(
	currentProficiency: number,
	currentConfidence: number,
	performance: PerformanceResult
): { newProficiency: number; newConfidence: number; change: number } {
	// Learning rate decreases as confidence increases (more stable estimates)
	const baseLearningRate = 0.15;
	const learningRate = baseLearningRate * (1 - currentConfidence * 0.5);

	// Expected performance based on current proficiency
	const expectedPerformance = currentProficiency / 100;

	// Update proficiency based on difference from expected
	const performanceDelta = performance.rawScore - expectedPerformance;
	const change = learningRate * performanceDelta * 100;

	const newProficiency = Math.max(0, Math.min(100, currentProficiency + change));

	// Confidence increases with more reviews (up to 0.95)
	const newConfidence = Math.min(0.95, currentConfidence + (1 - currentConfidence) * 0.05);

	return { newProficiency, newConfidence, change };
}

/**
 * Calculate target difficulty based on proficiency
 */
export function calculateTargetDifficulty(proficiency: number): {
	difficulty: number;
	difficultyLabel: string;
} {
	// Target slightly above current level with stretch factor
	const stretchFactor = 0.15;
	const targetDifficulty = Math.min(10, Math.max(1,
		(proficiency / 10) * (1 + stretchFactor)
	));

	// Map to difficulty label for AI prompt
	let difficultyLabel: string;
	if (proficiency < 30) {
		difficultyLabel = 'Beginner';
	} else if (proficiency < 50) {
		difficultyLabel = 'Elementary';
	} else if (proficiency < 70) {
		difficultyLabel = 'Intermediate';
	} else if (proficiency < 85) {
		difficultyLabel = 'Advanced';
	} else {
		difficultyLabel = 'Expert';
	}

	return {
		difficulty: Math.round(targetDifficulty),
		difficultyLabel
	};
}
