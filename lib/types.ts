import type { PetMode, PetRecord, PetStage } from '@/lib/care/types';
import type { SpeciesId } from '@/lib/species';

export type { PetMode, PetRecord, PetStage };

export interface Deck {
	id: string;
	user_id: string;
	pet_id: string | null;
	topic: string;
	title?: string;
	is_generated?: boolean;
	created_at: string;
}

export interface CardContent {
	question: string;
	answer: string;
	explanation?: string;
	type: 'basic' | 'choice';
	options?: string[];
}

export interface Card {
	id: string;
	deck_id: string;
	pet_id: string | null;
	front?: string;
	back?: string;
	content?: CardContent;
	card_type?: string;
	interval: number;
	ease_factor: number;
	next_review: string | null;
	difficulty?: number;
	created_at?: string;
}

/** A card the home stack can render and grade. */
export interface StudyCard {
	id: string;
	pet_id: string;
	deck_id: string;
	prompt: string;
	answer: string;
	explanation?: string;
	type: 'basic' | 'choice';
	options?: string[];
	difficulty: number;
	interval: number;
	ease_factor: number;
	next_review: string | null;
}

export interface Profile {
	id: string;
	current_streak: number;
	last_study_date: string | null;
	updated_at?: string;
}

export interface AppState {
	mode: 'demo' | 'supabase';
	userId: string | null;
	email: string | null;
	anonymous: boolean;
	profile: Profile | null;
	pets: PetRecord[];
	activePetId: string | null;
	dueCards: StudyCard[];
	keepsake: StudyCard | null;
}

export function isPetStage(value: string): value is PetStage {
	return value === 'egg' || value === 'hatchling' || value === 'cared_for' || value === 'well_loved';
}

export function isPetMode(value: string): value is PetMode {
	return value === 'homey' || value === 'classic';
}

export type { SpeciesId };
