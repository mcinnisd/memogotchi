import { pickLandingPet } from '@/lib/landing';

const NOW = new Date('2026-06-15T15:00:00.000Z');

function iso(daysAgo: number) {
	const date = new Date(NOW);
	date.setUTCDate(date.getUTCDate() - daysAgo);
	return date.toISOString();
}

describe('landing pet', () => {
	test('prefers the hungriest pet that has due cards', () => {
		const chosen = pickLandingPet([
			{ id: 'fed', last_fed_at: iso(0), due_count: 4 },
			{ id: 'hungry', last_fed_at: iso(1), due_count: 2 },
			{ id: 'loved', last_fed_at: iso(5), due_count: 0 },
		], NOW);
		expect(chosen?.id).toBe('hungry');
	});

	test('a needs-love pet with due cards wins over a merely hungry one', () => {
		const chosen = pickLandingPet([
			{ id: 'hungry', last_fed_at: iso(1), due_count: 3 },
			{ id: 'needs', last_fed_at: iso(4), due_count: 1 },
		], NOW);
		expect(chosen?.id).toBe('needs');
	});

	test('with nothing due, opens the friend fed most recently', () => {
		const chosen = pickLandingPet([
			{ id: 'older', last_fed_at: iso(2), due_count: 0 },
			{ id: 'recent', last_fed_at: iso(0), due_count: 0 },
		], NOW);
		expect(chosen?.id).toBe('recent');
	});
});
