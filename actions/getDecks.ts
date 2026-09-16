'use server';

import { createClient } from '@/utils/supabase/server';

export interface TopicDeck {
	id: string;
	topic: string;
	created_at: string;
}

/**
 * One row per subject/topic (latest deck id for that topic).
 * Multiple generation batches share a topic; the UI should switch by topic, not by batch.
 */
export async function getDecks(userId: string): Promise<TopicDeck[]> {
	const supabase = await createClient();

	const { data: decks, error } = await supabase
		.from('decks')
		.select('id, topic, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching decks:', error);
		return [];
	}

	const seen = new Set<string>();
	const unique: TopicDeck[] = [];
	for (const deck of decks || []) {
		if (!deck.topic || seen.has(deck.topic)) continue;
		seen.add(deck.topic);
		unique.push(deck);
	}
	return unique;
}
