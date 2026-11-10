import type { SpeciesId } from '@/lib/species';

export type PetStage = 'egg' | 'hatchling' | 'cared_for' | 'well_loved';
export type CareStatus = 'looked_after' | 'a_little_hungry' | 'needs_love';
export type PetMode = 'homey' | 'classic';
export type SpriteState = 'egg' | 'hatchling' | 'cared_for' | 'well_loved' | 'needs_love';

/**
 * The slice of a pet that care rules are allowed to see.
 * Presentation (sprites, paper, motion) stays outside this type.
 */
export interface PetCareSnapshot {
	stage: PetStage;
	daysCared: number;
	lastFedAt: string | null;
	/** 0–100. 100 means just looked after. */
	care: number;
	/** 0–100. Kept so a classic mode can read hunger without a migration. */
	hunger: number;
}

export interface CareRules {
	id: PetMode;
	status(lastFedAt: string | null, now: Date): CareStatus;
	careMeter(lastFedAt: string | null, now: Date): number;
	hungerMeter(lastFedAt: string | null, now: Date): number;
	/** Practice stages only. Egg is a pre-hatch presentation, not an evolution step. */
	stageForDays(daysCared: number): Exclude<PetStage, 'egg'>;
	/**
	 * Apply a finished feeding. Call once when the batch ends, never per card.
	 * Grade is intentionally not an argument: wrong answers do not change care.
	 */
	completeFeeding(pet: PetCareSnapshot, now: Date): PetCareSnapshot;
}

export interface PetRecord extends PetCareSnapshot {
	id: string;
	user_id: string;
	topic: string;
	name: string;
	species: SpeciesId;
	mode: PetMode;
	mode_state: Record<string, unknown>;
	created_at: string;
	due_count: number;
}
