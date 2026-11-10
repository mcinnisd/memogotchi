'use server';

import { listDueCards } from '@/actions/pets';

/** Due cards for one pet. A missing pet id returns nothing rather than every subject. */
export async function getDueCards(userId: string, petId: string) {
	if (!petId) return [];
	return listDueCards(userId, petId);
}
