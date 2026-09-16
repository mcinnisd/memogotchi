'use server';

import { createClient } from '@/utils/supabase/server';
import { getCardGenerationProvider } from '@/lib/generation';

interface GenerateDeckProps {
	topic: string;
	userId: string;
	difficulty?: string;
	numericDifficulty?: number;
	additionalContext?: string;
}

export async function generateDeck({
	topic,
	userId,
	difficulty = 'Beginner',
	numericDifficulty,
	additionalContext = '',
}: GenerateDeckProps) {
	const difficultyLevel =
		numericDifficulty ??
		(difficulty === 'Expert'
			? 9
			: difficulty === 'Advanced'
				? 7
				: difficulty === 'Intermediate'
					? 5
					: difficulty === 'Elementary'
						? 3
						: 2);

	try {
		const provider = getCardGenerationProvider();
		const cardsData = await provider.generateCards({
			topic,
			difficultyLabel: difficulty,
			difficultyLevel,
			count: 5,
			additionalContext,
		});

		const supabase = await createClient();
		const now = new Date().toISOString();

		const { data: deck, error: deckError } = await supabase
			.from('decks')
			.insert({
				user_id: userId,
				topic: topic.trim(),
			})
			.select()
			.single();

		if (deckError || !deck) {
			throw new Error(`Failed to create deck: ${deckError?.message}`);
		}

		// next_review must be set on create or getDueCards (.lte next_review, now) never returns them
		const cardsToInsert = cardsData.map((card) => ({
			deck_id: deck.id,
			front: card.question,
			back: card.answer,
			content: card,
			card_type: card.type,
			interval: 0,
			ease_factor: 2.5,
			difficulty: difficultyLevel,
			next_review: now,
		}));

		const { error: cardsError } = await supabase.from('cards').insert(cardsToInsert);

		if (cardsError) {
			throw new Error(`Failed to create cards: ${cardsError.message}`);
		}

		return { success: true as const, deckId: deck.id };
	} catch (error) {
		console.error('Error in generateDeck:', error);
		return {
			success: false as const,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}
