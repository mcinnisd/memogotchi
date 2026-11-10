import { EVOLUTION, HUNGER } from '@/lib/config';
import { careAfterReview, completeHomeyFeeding, displayedCare, homeyStageForDays, homeyStatus } from '@/lib/care/homey';
import type { PetCareSnapshot } from '@/lib/care/types';
import { getCareRules } from '@/lib/care';

const NOW = new Date('2026-06-15T15:00:00.000Z');

function daysAgo(days: number): string {
	const date = new Date(NOW);
	date.setUTCDate(date.getUTCDate() - days);
	return date.toISOString();
}

function pet(partial: Partial<PetCareSnapshot> = {}): PetCareSnapshot {
	return {
		stage: 'hatchling',
		daysCared: 0,
		lastFedAt: NOW.toISOString(),
		care: 100,
		hunger: 0,
		...partial,
	};
}

describe('homey hunger', () => {
	test('fed today is looked after', () => {
		expect(homeyStatus(daysAgo(0), NOW)).toBe('looked_after');
	});

	test('a missed day is a little hungry, not a crisis', () => {
		expect(HUNGER.hungryAfterDays).toBeGreaterThan(0);
		expect(homeyStatus(daysAgo(1), NOW)).toBe('a_little_hungry');
		expect(homeyStatus(daysAgo(2), NOW)).toBe('a_little_hungry');
	});

	test('several missed days becomes needs love', () => {
		expect(homeyStatus(daysAgo(HUNGER.needsLoveAfterDays), NOW)).toBe('needs_love');
		expect(homeyStatus(daysAgo(12), NOW)).toBe('needs_love');
	});

	test('a brand new friend with no feeding yet is not looked after', () => {
		expect(homeyStatus(null, NOW)).toBe('needs_love');
	});
});

describe('homey evolution', () => {
	test('thresholds stay in config and are slow', () => {
		expect(EVOLUTION.caredForDays).toBeGreaterThan(1);
		expect(EVOLUTION.wellLovedDays).toBeGreaterThan(EVOLUTION.caredForDays);
	});

	test('days of practice move the same friend through three stages', () => {
		expect(homeyStageForDays(0)).toBe('hatchling');
		expect(homeyStageForDays(EVOLUTION.caredForDays - 1)).toBe('hatchling');
		expect(homeyStageForDays(EVOLUTION.caredForDays)).toBe('cared_for');
		expect(homeyStageForDays(EVOLUTION.wellLovedDays - 1)).toBe('cared_for');
		expect(homeyStageForDays(EVOLUTION.wellLovedDays)).toBe('well_loved');
	});

	test('a feeding on a new day advances stage only when the day threshold is crossed', () => {
		const before = pet({ daysCared: EVOLUTION.caredForDays - 1, lastFedAt: daysAgo(1), stage: 'hatchling' });
		const after = completeHomeyFeeding(before, NOW);
		expect(after.daysCared).toBe(EVOLUTION.caredForDays);
		expect(after.stage).toBe('cared_for');
		expect(after.care).toBe(100);
	});

	test('two feedings on the same day do not add a second practice day', () => {
		const once = completeHomeyFeeding(pet({ daysCared: 2, lastFedAt: daysAgo(1) }), NOW);
		const twice = completeHomeyFeeding(once, NOW);
		expect(twice.daysCared).toBe(once.daysCared);
		expect(twice.stage).toBe(once.stage);
	});

	test('stage does not change in the middle of a session of reviews', () => {
		const before = pet({ daysCared: EVOLUTION.wellLovedDays - 1, stage: 'cared_for', lastFedAt: daysAgo(2) });
		let snapshot = before;
		for (let i = 0; i < 12; i += 1) snapshot = careAfterReview(snapshot);
		expect(snapshot).toEqual(before);
		expect(snapshot.stage).toBe('cared_for');
	});
});

describe('wrong answers do not drain care', () => {
	test('a failing review returns the same care snapshot', () => {
		const before = pet({ care: 42, hunger: 58, stage: 'cared_for', daysCared: 5 });
		expect(careAfterReview(before)).toBe(before);
	});

	test('finishing a feeding restores care even if the session had misses', () => {
		const hungry = pet({ care: 22, hunger: 78, lastFedAt: daysAgo(3), daysCared: 2, stage: 'hatchling' });
		const restored = getCareRules('homey').completeFeeding(hungry, NOW);
		expect(restored.care).toBe(100);
		expect(restored.hunger).toBe(0);
		expect(restored.stage).not.toBe('egg');
	});
});

describe('brightening', () => {
	test('a needs-love friend brightens across a feeding without jumping past full', () => {
		expect(displayedCare(22, 0)).toBe(22);
		expect(displayedCare(22, 0.5)).toBeCloseTo(61);
		expect(displayedCare(22, 1)).toBe(100);
	});
});
