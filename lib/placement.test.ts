import { evaluatePlacementScore, shouldContinuePlacement } from '@/lib/placement';
import { PLACEMENT } from '@/lib/config';

describe('placement length', () => {
	test('keeps going when confidence is low and the cap is still open', () => {
		expect(shouldContinuePlacement({
			answered: 3,
			confidence: 40,
			moreAvailable: true,
		})).toBe(true);
	});

	test('stops once confidence is enough', () => {
		expect(shouldContinuePlacement({
			answered: 3,
			confidence: PLACEMENT.minConfidence,
			moreAvailable: true,
		})).toBe(false);
	});

	test('stops at the question cap even if confidence is low', () => {
		expect(shouldContinuePlacement({
			answered: PLACEMENT.maxQuestions,
			confidence: 10,
			moreAvailable: true,
		})).toBe(false);
	});

	test('stops when the generator has nothing new', () => {
		expect(shouldContinuePlacement({
			answered: 3,
			confidence: 10,
			moreAvailable: false,
		})).toBe(false);
	});

	test('a strong fast round places advanced', () => {
		const result = evaluatePlacementScore([
			{ correct: true, timeMs: 2000 },
			{ correct: true, timeMs: 3000 },
			{ correct: true, timeMs: 4000 },
		]);
		expect(result.recommendedDifficulty).toBe('Advanced');
	});

	test('misses place a beginner', () => {
		const result = evaluatePlacementScore([
			{ correct: false, timeMs: 8000 },
			{ correct: false, timeMs: 9000 },
			{ correct: true, timeMs: 12000 },
		]);
		expect(result.recommendedDifficulty).toBe('Beginner');
	});
});
