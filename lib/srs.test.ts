
import { calculateReview } from '../lib/srs';

describe('SRS Engine (SM-2)', () => {
	test('New card (interval 0) with good grade (4) -> interval 1', () => {
		const result = calculateReview(0, 2.5, 4);
		expect(result.interval).toBe(1);
		expect(result.easeFactor).toBeCloseTo(2.5, 2);
	});

	test('New card (interval 0) with perfect grade (5) -> interval 1, ease increases', () => {
		const result = calculateReview(0, 2.5, 5);
		expect(result.interval).toBe(1);
		expect(result.easeFactor).toBeGreaterThan(2.5);
	});

	test('Review card (interval 1) with perfect grade (5) -> interval 6', () => {
		const result = calculateReview(1, 2.6, 5);
		expect(result.interval).toBe(6);
	});

	test('Review card (interval 6) with grade 5 -> calculated interval', () => {
		// 6 * 2.6 = 15.6 -> 16
		const result = calculateReview(6, 2.6, 5);
		expect(result.interval).toBe(16);
	});

	test('Fail card (grade < 3) -> interval resets to 1, ease constant', () => {
		const result = calculateReview(10, 2.8, 2);
		expect(result.interval).toBe(1);
		expect(result.easeFactor).toBe(2.8);
	});

	test('Ease factor lower bound 1.3', () => {
		// Force ease down repeatedly
		const ease = 1.35;
		const result = calculateReview(10, ease, 3);
		// Grade 3 drops ease by ~0.14
		expect(result.easeFactor).toBe(1.3); // Clamped
	});
});
