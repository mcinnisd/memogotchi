export type PetStage = 'egg' | 'baby' | 'adult';
export type PetSpecies = 'glitch_cat' | 'neon_dragon' | 'cyber_fox';

export interface Pet {
	id: string;
	user_id: string;
	name: string;
	species: PetSpecies;
	stage: PetStage;
	health: number; // 0-100
	hunger: number; // 0-100
	exp: number;
	last_fed_at: string; // ISO Date
	created_at: string; // ISO Date
}

export interface Deck {
	id: string;
	user_id: string;
	title: string;
	is_generated: boolean;
	created_at: string;
}

export interface Card {
	id: string;
	deck_id: string;
	front: string;
	back: string;
	hint?: string;
	fun_fact?: string;
	next_review: string | null; // Null if new
	interval: number;
	ease_factor: number;
	created_at: string;
}
