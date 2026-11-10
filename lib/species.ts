export const SPECIES_IDS = [
	'chick',
	'fox',
	'sprout',
	'mouse',
	'frog',
	'butterfly',
	'bun',
	'cap',
] as const;

export type SpeciesId = (typeof SPECIES_IDS)[number];

export interface SpeciesMeta {
	id: SpeciesId;
	name: string;
	/** Short line used when the friend is still an egg of this kind. */
	hatchlingNote: string;
}

export const SPECIES: Record<SpeciesId, SpeciesMeta> = {
	chick: { id: 'chick', name: 'Chick', hatchlingNote: 'A little puff still wearing shell.' },
	fox: { id: 'fox', name: 'Fox', hatchlingNote: 'Small ears, big curiosity.' },
	sprout: { id: 'sprout', name: 'Sprout', hatchlingNote: 'A seed with one brave leaf.' },
	mouse: { id: 'mouse', name: 'Mouse', hatchlingNote: 'Quiet paws, quick memory.' },
	frog: { id: 'frog', name: 'Frog', hatchlingNote: 'Starts as a tadpole.' },
	butterfly: { id: 'butterfly', name: 'Butterfly', hatchlingNote: 'Starts as a caterpillar.' },
	bun: { id: 'bun', name: 'Bun', hatchlingNote: 'Soft ears, steady heart.' },
	cap: { id: 'cap', name: 'Cap', hatchlingNote: 'A small mushroom cap.' },
};

export function isSpeciesId(value: string): value is SpeciesId {
	return (SPECIES_IDS as readonly string[]).includes(value);
}

export function speciesName(id: SpeciesId): string {
	return SPECIES[id].name;
}
