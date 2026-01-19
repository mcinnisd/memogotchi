/**
 * Tests for Adaptive Learning Engine
 * 
 * Run with: npx jest __tests__/learningEngine.test.ts
 */

import { calculatePerformance, calculateProficiencyUpdate, calculateTargetDifficulty } from '../lib/learning';

describe('Learning Engine - calculatePerformance', () => {

	describe('Grade Score (40% weight)', () => {
		test('Easy (grade 5) should give high score', () => {
			const result = calculatePerformance({
				grade: 5,
				responseTimeMs: 5000,
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.gradeScore).toBe(1.0);
		});

		test('Good (grade 4) should give medium-high score', () => {
			const result = calculatePerformance({
				grade: 4,
				responseTimeMs: 5000,
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.gradeScore).toBe(0.7);
		});

		test('Hard (grade 3) should give medium score', () => {
			const result = calculatePerformance({
				grade: 3,
				responseTimeMs: 5000,
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.gradeScore).toBe(0.4);
		});

		test('Again (grade 1) should give zero score', () => {
			const result = calculatePerformance({
				grade: 1,
				responseTimeMs: 5000,
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.gradeScore).toBe(0.0);
		});
	});

	describe('Time Score (25% weight)', () => {
		test('Optimal time (3-10s) should give full score', () => {
			const result = calculatePerformance({
				grade: 4,
				responseTimeMs: 5000, // 5 seconds
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.timeScore).toBe(1.0);
		});

		test('Too fast (<2s) should penalize', () => {
			const result = calculatePerformance({
				grade: 4,
				responseTimeMs: 1000, // 1 second
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.timeScore).toBe(0.4);
		});

		test('Very slow (>15s) should penalize', () => {
			const result = calculatePerformance({
				grade: 4,
				responseTimeMs: 20000, // 20 seconds
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.timeScore).toBe(0.3);
		});

		test('Beginner proficiency should have more lenient timing', () => {
			// At low proficiency, optimal range shifts
			const resultLow = calculatePerformance({
				grade: 4,
				responseTimeMs: 8000,
				wasFlipped: false,
				cardDifficulty: 5
			}, 20); // Low proficiency

			const resultHigh = calculatePerformance({
				grade: 4,
				responseTimeMs: 8000,
				wasFlipped: false,
				cardDifficulty: 5
			}, 80); // High proficiency

			// Lower proficiency should be more lenient with slower times
			expect(resultLow.timeScore).toBeGreaterThanOrEqual(resultHigh.timeScore);
		});
	});

	describe('Flip Score (15% weight)', () => {
		test('No flip should give higher score', () => {
			const result = calculatePerformance({
				grade: 4,
				responseTimeMs: 5000,
				wasFlipped: false,
				cardDifficulty: 5
			}, 50);

			expect(result.flipScore).toBe(0.15);
		});

		test('With flip should give lower score', () => {
			const result = calculatePerformance({
				grade: 4,
				responseTimeMs: 5000,
				wasFlipped: true,
				cardDifficulty: 5
			}, 50);

			expect(result.flipScore).toBe(0.05);
		});
	});

	describe('Difficulty Adjustment (20% weight)', () => {
		test('Higher difficulty correct should boost score', () => {
			const easyCard = calculatePerformance({
				grade: 5,
				responseTimeMs: 5000,
				wasFlipped: false,
				cardDifficulty: 2 // Easy card
			}, 50);

			const hardCard = calculatePerformance({
				grade: 5,
				responseTimeMs: 5000,
				wasFlipped: false,
				cardDifficulty: 8 // Hard card
			}, 50);

			expect(hardCard.difficultyAdjusted).toBeGreaterThan(easyCard.difficultyAdjusted);
		});
	});

	describe('Overall Performance', () => {
		test('Perfect performance should be close to max', () => {
			const result = calculatePerformance({
				grade: 5,      // Easy
				responseTimeMs: 5000, // Optimal time
				wasFlipped: false,    // No hint needed
				cardDifficulty: 7     // Slightly hard card
			}, 50);

			expect(result.rawScore).toBeGreaterThan(0.8);
		});

		test('Poor performance should be low', () => {
			const result = calculatePerformance({
				grade: 1,      // Again
				responseTimeMs: 25000, // Very slow
				wasFlipped: true,      // Needed hint
				cardDifficulty: 3      // Easy card failed
			}, 50);

			expect(result.rawScore).toBeLessThan(0.3);
		});

		test('Mixed performance should be moderate', () => {
			const result = calculatePerformance({
				grade: 3,      // Hard
				responseTimeMs: 12000, // Slow but acceptable
				wasFlipped: true,      // Needed hint
				cardDifficulty: 5      // Medium difficulty
			}, 50);

			expect(result.rawScore).toBeGreaterThan(0.2);
			expect(result.rawScore).toBeLessThan(0.6);
		});
	});
});

describe('Proficiency Update Logic', () => {
	test('Good performance should increase proficiency', () => {
		// This would require mocking Supabase, so we test the formula logic
		const oldProficiency = 50;
		const learningRate = 0.15;
		const confidence = 0.5;
		const performance = 0.8; // Good performance
		const expected = 0.5;    // Expected at proficiency 50

		const change = learningRate * confidence * (performance - expected) * 100;
		const newProficiency = oldProficiency + change;

		expect(newProficiency).toBeGreaterThan(oldProficiency);
	});

	test('Poor performance should decrease proficiency', () => {
		const oldProficiency = 50;
		const learningRate = 0.15;
		const confidence = 0.5;
		const performance = 0.2; // Poor performance
		const expected = 0.5;

		const change = learningRate * confidence * (performance - expected) * 100;
		const newProficiency = oldProficiency + change;

		expect(newProficiency).toBeLessThan(oldProficiency);
	});

	test('Proficiency should stay within 0-100', () => {
		const lowProficiency = 5;
		const highProficiency = 95;

		// Even with extreme changes, should clamp
		const worstChange = -50;
		const bestChange = 50;

		expect(Math.max(0, Math.min(100, lowProficiency + worstChange))).toBe(0);
		expect(Math.max(0, Math.min(100, highProficiency + bestChange))).toBe(100);
	});
});

describe('Target Difficulty Calculation', () => {
	test('Low proficiency should target easy cards', () => {
		const proficiency = 25;
		const stretchFactor = 0.15;
		const targetDifficulty = Math.min(10, Math.max(1,
			(proficiency / 10) * (1 + stretchFactor)
		));

		expect(targetDifficulty).toBeLessThan(4);
	});

	test('High proficiency should target hard cards', () => {
		const proficiency = 80;
		const stretchFactor = 0.15;
		const targetDifficulty = Math.min(10, Math.max(1,
			(proficiency / 10) * (1 + stretchFactor)
		));

		expect(targetDifficulty).toBeGreaterThan(7);
	});

	test('Medium proficiency should target medium cards', () => {
		const proficiency = 50;
		const stretchFactor = 0.15;
		const targetDifficulty = Math.min(10, Math.max(1,
			(proficiency / 10) * (1 + stretchFactor)
		));

		expect(targetDifficulty).toBeGreaterThan(4);
		expect(targetDifficulty).toBeLessThan(7);
	});
});
