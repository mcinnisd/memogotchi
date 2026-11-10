import type { ComponentType } from 'react';
import type { SpriteState } from '@/lib/care/types';
import type { SpeciesId } from '@/lib/species';

/**
 * Props every pet presenter receives. Homey draws the layered sprites.
 * A later classic mode, or a Rive / Lottie presenter, can take the same
 * props and replace the composer without the screens knowing.
 */
export interface PetViewProps {
	species: SpeciesId;
	state: SpriteState;
	expression?: 'happy' | 'soft' | 'sad';
	resting?: boolean;
	look?: number;
	mood?: 'idle' | 'watching' | 'pleased' | 'gentle';
	brighten?: number;
}

export type PetPresenter = ComponentType<PetViewProps>;
