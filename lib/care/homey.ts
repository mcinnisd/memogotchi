import { EVOLUTION, HUNGER } from '@/lib/config';
import type { CareRules, CareStatus, PetCareSnapshot, PetStage } from '@/lib/care/types';

export function utcDayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Whole UTC calendar days from `from` to `to`. Future dates count as 0. */
export function calendarDaysBetween(from: Date, to: Date): number {
	const start = Date.parse(`${utcDayKey(from)}T00:00:00Z`);
	const end = Date.parse(`${utcDayKey(to)}T00:00:00Z`);
	const days = Math.round((end - start) / 86_400_000);
	return days < 0 ? 0 : days;
}

export function daysSinceFed(lastFedAt: string | null, now: Date): number {
	if (!lastFedAt) return HUNGER.needsLoveAfterDays;
	const parsed = new Date(lastFedAt);
	if (Number.isNaN(parsed.getTime())) return HUNGER.needsLoveAfterDays;
	return calendarDaysBetween(parsed, now);
}

export function homeyStatus(lastFedAt: string | null, now: Date): CareStatus {
	const days = daysSinceFed(lastFedAt, now);
	if (days >= HUNGER.needsLoveAfterDays) return 'needs_love';
	if (days >= HUNGER.hungryAfterDays) return 'a_little_hungry';
	return 'looked_after';
}

export function homeyCareMeter(lastFedAt: string | null, now: Date): number {
	const days = daysSinceFed(lastFedAt, now);
	if (days <= 0) return 100;
	if (days === 1) return 68;
	if (days === 2) return 42;
	if (days === 3) return 22;
	return 12;
}

export function homeyStageForDays(daysCared: number): Exclude<PetStage, 'egg'> {
	const days = Math.max(0, Math.floor(daysCared));
	if (days >= EVOLUTION.wellLovedDays) return 'well_loved';
	if (days >= EVOLUTION.caredForDays) return 'cared_for';
	return 'hatchling';
}

/**
 * Reviews never touch care. Exported so tests can pin the invariant:
 * a wrong answer returns the same snapshot.
 */
export function careAfterReview(pet: PetCareSnapshot): PetCareSnapshot {
	return pet;
}

export function completeHomeyFeeding(pet: PetCareSnapshot, now: Date): PetCareSnapshot {
	const lastKey = pet.lastFedAt ? utcDayKey(new Date(pet.lastFedAt)) : null;
	const today = utcDayKey(now);
	const alreadyCounted = lastKey === today && pet.daysCared > 0;
	const daysCared = alreadyCounted ? pet.daysCared : pet.daysCared + 1;
	return {
		stage: homeyStageForDays(daysCared),
		daysCared,
		lastFedAt: now.toISOString(),
		care: 100,
		hunger: 0,
	};
}

export const homeyRules: CareRules = {
	id: 'homey',
	status: homeyStatus,
	careMeter: homeyCareMeter,
	hungerMeter: (lastFedAt, now) => 100 - homeyCareMeter(lastFedAt, now),
	stageForDays: homeyStageForDays,
	completeFeeding: completeHomeyFeeding,
};

/** Visual brighten during a feeding. 0 = just started, 1 = batch finished. */
export function displayedCare(baseCare: number, sessionProgress: number): number {
	const progress = Math.min(1, Math.max(0, sessionProgress));
	const base = Math.min(100, Math.max(0, baseCare));
	return base + (100 - base) * progress;
}
