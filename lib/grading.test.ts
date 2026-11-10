import { gradeFromGesture, GRADE, isPassingGrade } from '@/lib/grading';
import { calculateReview } from '@/lib/srs';

describe('grading gestures map onto SM-2', () => {
	test('swipe right means knew it, a passing grade', () => {
		const grade = gradeFromGesture({ kind: 'swipe', direction: 'right' });
		expect(grade).toBe(GRADE.knewIt);
		expect(isPassingGrade(grade)).toBe(true);
		expect(calculateReview(0, 2.5, grade).interval).toBe(1);
	});

	test('swipe left means not yet, and the interval resets', () => {
		const grade = gradeFromGesture({ kind: 'swipe', direction: 'left' });
		expect(grade).toBe(GRADE.notYet);
		expect(isPassingGrade(grade)).toBe(false);
		const result = calculateReview(12, 2.6, grade);
		expect(result.interval).toBe(1);
		expect(result.easeFactor).toBe(2.6);
	});

	test('a correct pick passes and a wrong pick does not', () => {
		expect(gradeFromGesture({ kind: 'choice', correct: true })).toBe(GRADE.knewIt);
		expect(gradeFromGesture({ kind: 'choice', correct: false })).toBe(GRADE.notYet);
	});

	test('flip is not part of the grade', () => {
		const knew = gradeFromGesture({ kind: 'swipe', direction: 'right' });
		const missed = gradeFromGesture({ kind: 'swipe', direction: 'left' });
		expect(knew).not.toBe(missed);
		expect(Object.keys({ kind: 'swipe', direction: 'right' })).not.toContain('wasFlipped');
	});
});
