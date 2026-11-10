import type { PetMode } from '@/lib/care/types';
import type { PetPresenter, PetViewProps } from '@/lib/pets/presenter';
import { EggArt, LivingPet } from '@/components/pets/LivingPet';

/**
 * Homey is the only presenter shipped in v1. Classic mode can register
 * its own component here (Rive, Lottie, or another sprite set) and the
 * screens keep calling PetArt.
 */
const PRESENTERS: Record<PetMode, PetPresenter> = {
	homey: LivingPet,
	classic: LivingPet,
};

export function petPresenter(mode: PetMode = 'homey'): PetPresenter {
	return PRESENTERS[mode] ?? LivingPet;
}

export function PetArt(props: PetViewProps) {
	const Presenter = petPresenter('homey');
	return <Presenter {...props} />;
}

export { EggArt };
