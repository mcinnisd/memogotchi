'use server';

import { completeFeeding } from '@/actions/pets';

/**
 * Feed starts care. It does not spend coins, and it never reads a
 * capital-P "Profiles" table. Finishing a batch is what restores care.
 */
export async function feedPet(userId: string, petId: string) {
	return completeFeeding(userId, petId);
}
