/**
 * V1 tuning. Change these numbers without hunting through components.
 * A future classic mode should keep its own thresholds beside these,
 * not by forking the screens.
 */

export const EVOLUTION = {
	/** Distinct practice days before the friend leaves hatchling. */
	caredForDays: 4,
	/** Distinct practice days before the friend is well-loved. */
	wellLovedDays: 10,
} as const;

export const HUNGER = {
	/** Calendar days since last feeding to become "a little hungry". */
	hungryAfterDays: 1,
	/** Calendar days since last feeding to become "needs love". */
	needsLoveAfterDays: 3,
} as const;

export const FEEDING = {
	minCards: 8,
	maxCards: 12,
} as const;

export const PLACEMENT = {
	minConfidence: 65,
	maxQuestions: 9,
	batchSize: 3,
} as const;

export interface StarterSubject {
	id: string;
	label: string;
	/** Degrees. Fixed so the cluster doesn't jump around. */
	rotation: number;
}

export const STARTER_SUBJECTS: StarterSubject[] = [
	{ id: 'spanish', label: 'Spanish', rotation: -6 },
	{ id: 'python', label: 'Python', rotation: 4 },
	{ id: 'biology', label: 'Biology', rotation: -3 },
	{ id: 'history', label: 'History', rotation: 5 },
	{ id: 'trivia', label: 'Trivia', rotation: -4 },
	{ id: 'other', label: 'Something else', rotation: 3 },
];
