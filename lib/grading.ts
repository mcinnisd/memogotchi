import type { SRSResult } from '@/lib/srs';

/**
 * SM-2 grades (see lib/srs.ts):
 * 5 perfect, 4 good, 3 hard-but-correct, 2/1/0 incorrect.
 * V1 has two gestures. Flip is recorded separately and is not a grade.
 */
export const GRADE = {
	knewIt: 4,
	notYet: 1,
} as const;

export type GradeGesture =
	| { kind: 'swipe'; direction: 'left' | 'right' }
	| { kind: 'choice'; correct: boolean };

export function gradeFromGesture(gesture: GradeGesture): number {
	if (gesture.kind === 'swipe') {
		return gesture.direction === 'right' ? GRADE.knewIt : GRADE.notYet;
	}
	return gesture.correct ? GRADE.knewIt : GRADE.notYet;
}

export function isPassingGrade(grade: number): boolean {
	return grade >= 3;
}

/** Signals stored beside a review. `wasFlipped` is not turned into its own grade. */
export interface ReviewSignalInput {
	responseTimeMs: number;
	wasFlipped: boolean;
	cardDifficulty?: number;
}

export function applyGrade(calculate: (grade: number) => SRSResult, gesture: GradeGesture): SRSResult {
	return calculate(gradeFromGesture(gesture));
}
