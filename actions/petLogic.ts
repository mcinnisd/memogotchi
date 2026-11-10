'use server';

import { careAfterReview } from '@/lib/care/homey';
import type { PetCareSnapshot } from '@/lib/care/types';

/**
 * A single review never changes care, hunger, or stage.
 * Days of practice are applied by completeFeeding when a batch ends.
 */
export async function updatePetState(_userId: string, _grade: number, snapshot?: PetCareSnapshot) {
	const unchanged = snapshot ? careAfterReview(snapshot) : null;
	return {
		success: true,
		evolved: false,
		careUnchanged: true,
		snapshot: unchanged,
	};
}
