import type { CareRules, PetMode, SpriteState, CareStatus, PetStage } from '@/lib/care/types';
import { homeyRules } from '@/lib/care/homey';

/**
 * Care rules are swappable by mode. V1 only ships `homey`.
 * Classic mode can register a second CareRules object here
 * (sharper hunger, separate care actions) without rewriting screens.
 * Until that exists, an unknown mode still uses homey so a flag cannot brick a pet.
 */
const RULES: Record<PetMode, CareRules> = {
	homey: homeyRules,
	classic: homeyRules,
};

export function getCareRules(mode: PetMode = 'homey'): CareRules {
	return RULES[mode] ?? homeyRules;
}

export function spriteFor(stage: PetStage, status: CareStatus, brighten: number): SpriteState {
	if (stage === 'egg') return 'egg';
	if (status === 'needs_love' && brighten < 0.85) return 'needs_love';
	if (stage === 'hatchling') return 'hatchling';
	if (stage === 'well_loved') return 'well_loved';
	return 'cared_for';
}

export { homeyRules } from '@/lib/care/homey';
export type { CareRules, PetCareSnapshot, PetRecord, PetMode, PetStage, CareStatus, SpriteState } from '@/lib/care/types';
