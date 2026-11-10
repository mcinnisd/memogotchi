import { homeyStatus } from '@/lib/care/homey';
import type { CareStatus } from '@/lib/care/types';

export interface LandingPet {
	id: string;
	last_fed_at: string | null;
	due_count: number;
}

const STATUS_RANK: Record<CareStatus, number> = {
	needs_love: 0,
	a_little_hungry: 1,
	looked_after: 2,
};

/**
 * Opening the app lands on the hungriest pet that still has due cards.
 * If nobody has due cards, land on whoever was fed most recently.
 */
export function pickLandingPet<T extends LandingPet>(pets: T[], now = new Date()): T | null {
	if (pets.length === 0) return null;
	const withDue = pets.filter((pet) => pet.due_count > 0);
	if (withDue.length > 0) {
		return [...withDue].sort((a, b) => {
			const rankA = STATUS_RANK[homeyStatus(a.last_fed_at, now)];
			const rankB = STATUS_RANK[homeyStatus(b.last_fed_at, now)];
			if (rankA !== rankB) return rankA - rankB;
			return new Date(a.last_fed_at ?? 0).getTime() - new Date(b.last_fed_at ?? 0).getTime();
		})[0];
	}
	return [...pets].sort(
		(a, b) => new Date(b.last_fed_at ?? 0).getTime() - new Date(a.last_fed_at ?? 0).getTime()
	)[0];
}
