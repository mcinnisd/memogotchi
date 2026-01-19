'use server';

import { createClient } from '@/utils/supabase/server';
import { Card } from '@/lib/types';

export async function getDueCards(userId: string, topic?: string) {
	const supabase = await createClient();

	const now = new Date().toISOString();

	let query = supabase
		.from('cards')
		.select('*, decks!inner(user_id, topic)')
		.eq('decks.user_id', userId)
		.lte('next_review', now)
		.order('next_review', { ascending: true });

	// Filter by topic if provided
	if (topic) {
		query = query.eq('decks.topic', topic);
	}

	const { data: cards, error } = await query;

	if (error) {
		console.error('Error fetching due cards:', error);
		throw new Error('Failed to fetch due cards');
	}

	return cards as (Card & { decks: { topic: string } })[];
}
