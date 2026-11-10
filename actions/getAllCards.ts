'use server';

import { createClient } from '@/utils/supabase/server';

export async function getAllCards(userId: string, petId?: string) {
	const supabase = await createClient();
	let query = supabase
		.from('cards')
		.select(`
			*,
			deck:decks!inner(
				topic,
				user_id,
				pet_id
			)
		`)
		.eq('deck.user_id', userId);

	if (petId) query = query.eq('pet_id', petId);

	const { data, error } = await query.order('created_at', { ascending: false });
	if (error) {
		console.error('Error fetching cards collection:', error);
		return [];
	}
	return data ?? [];
}
