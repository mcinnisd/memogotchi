'use server';

import { createClient } from "@/utils/supabase/server";

export async function getDecks(userId: string) {
	const supabase = await createClient();

	const { data: decks, error } = await supabase
		.from('decks')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching decks:', error);
		return [];
	}

	return decks;
}
