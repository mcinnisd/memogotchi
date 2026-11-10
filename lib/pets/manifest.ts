import data from './manifest.json';

export interface PetLayer {
	id: string;
	file: string;
	z: number;
	anchor: number[];
	offset: number[];
	animate: string;
	/** False when the pixels are still painted on the body, so the composer must not draw a second copy. */
	separated: boolean;
}

export interface PetSpriteDef {
	layered: boolean;
	approximated: boolean;
	note: string;
	width: number;
	height: number;
	layers: PetLayer[];
}

export interface PetManifest {
	sprites: Record<string, Record<string, PetSpriteDef>>;
}

export const PET_MANIFEST = data as unknown as PetManifest;

export function spriteDef(species: string, state: string): PetSpriteDef {
	if (state === 'egg' || species === 'egg') return PET_MANIFEST.sprites.egg.egg;
	const group = PET_MANIFEST.sprites[species];
	return group?.[state] ?? group?.well_loved ?? PET_MANIFEST.sprites.chick.well_loved;
}
