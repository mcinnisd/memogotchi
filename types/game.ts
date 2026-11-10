import type { CareStatus, PetMode, PetStage, SpriteState } from '@/lib/care/types';
import type { SpeciesId } from '@/lib/species';

export type { CareStatus, PetMode, PetStage, SpeciesId, SpriteState };

/** @deprecated Use PetRecord from lib/types. Kept so older imports still typecheck. */
export interface Pet {
	id: string;
	user_id: string;
	name: string;
	species: SpeciesId;
	stage: PetStage;
	topic: string;
	care: number;
	hunger: number;
	days_cared: number;
	last_fed_at: string;
	mode: PetMode;
	created_at: string;
}

export interface Deck {
	id: string;
	user_id: string;
	pet_id: string | null;
	topic: string;
	is_generated: boolean;
	created_at: string;
}

export interface Card {
	id: string;
	deck_id: string;
	pet_id: string | null;
	front: string;
	back: string;
	hint?: string;
	fun_fact?: string;
	next_review: string | null;
	interval: number;
	ease_factor: number;
	created_at: string;
}
