'use server';

import { createClient } from '@/utils/supabase/server';
import { FEEDING } from '@/lib/config';
import { demoFallbackDeck, demoInsertDeck } from '@/lib/demo/store';
import { fixtureDeck } from '@/lib/fixtures';
import { isDemoMode } from '@/lib/runtime';
import { toStudyCard } from '@/lib/studyCard';
import type { CardContent, StudyCard } from '@/lib/types';

interface GenerateDeckProps {
	topic: string;
	userId: string;
	petId?: string;
	difficulty?: string;
	numericDifficulty?: number;
	additionalContext?: string;
	count?: number;
}

function difficultyLevelFrom(label: string | undefined, numeric?: number): number {
	if (typeof numeric === 'number') return numeric;
	if (label === 'Expert') return 9;
	if (label === 'Advanced') return 7;
	if (label === 'Intermediate') return 5;
	if (label === 'Elementary') return 3;
	return 2;
}

function guidance(level: number): string {
	if (level <= 2) return 'Absolute beginner. Define terms. Options must be clearly distinct.';
	if (level <= 4) return 'Beginner. Core ideas, light terminology.';
	if (level <= 6) return 'Intermediate. Apply an idea, not only define it.';
	if (level <= 8) return 'Advanced. Edge cases and combining two ideas.';
	return 'Expert. Subtle distinctions. Still plain language.';
}

function normalizeCards(raw: unknown, count: number): CardContent[] {
	if (!Array.isArray(raw)) throw new Error('Failed to parse generated flashcards');
	const cards: CardContent[] = [];
	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;
		const row = item as Record<string, unknown>;
		const question = String(row.question ?? '').trim();
		const answer = String(row.answer ?? '').trim();
		if (!question || !answer) continue;
		const type = row.type === 'choice' ? 'choice' : 'basic';
		const options = Array.isArray(row.options) ? row.options.map((option) => String(option)) : undefined;
		if (type === 'choice' && (!options || !options.includes(answer) || options.length < 2)) continue;
		cards.push({
			question,
			answer,
			explanation: row.explanation ? String(row.explanation) : undefined,
			type,
			options,
		});
	}
	return cards.slice(0, count);
}

export async function generateDeck({
	topic,
	userId,
	petId,
	difficulty = 'Beginner',
	numericDifficulty,
	additionalContext = '',
	count = FEEDING.minCards + 2,
}: GenerateDeckProps): Promise<{ success: boolean; deckId?: string; cards: StudyCard[]; error?: string }> {
	const level = difficultyLevelFrom(difficulty, numericDifficulty);
	const size = Math.min(FEEDING.maxCards, Math.max(1, count));

	if (isDemoMode()) {
		if (!petId) return { success: false, cards: [], error: 'A deck needs a pet' };
		const made = demoFallbackDeck(topic, petId, size, difficulty);
		return { success: true, deckId: made.deckId, cards: made.cards };
	}

	const apiKey = process.env.XAI_API_KEY;
	let cardsData: CardContent[];
	if (!apiKey) {
		cardsData = fixtureDeck(topic, size, difficulty);
	} else {
		try {
			cardsData = await requestCards(apiKey, topic, difficulty, level, size, additionalContext);
		} catch (error) {
			console.error('generateDeck fell back to a local deck', error);
			cardsData = fixtureDeck(topic, size, difficulty);
		}
	}

	try {
		const supabase = await createClient();
		const { data: deck, error: deckError } = await supabase
			.from('decks')
			.insert({
				user_id: userId,
				topic,
				title: topic,
				pet_id: petId ?? null,
				is_generated: true,
			})
			.select()
			.single();

		if (deckError || !deck) {
			throw new Error(`Failed to create deck: ${deckError?.message}`);
		}

		const now = new Date().toISOString();
		const cardsToInsert = cardsData.map((card) => ({
			deck_id: deck.id,
			pet_id: petId ?? null,
			front: card.question,
			back: card.answer,
			content: card,
			card_type: card.type,
			interval: 0,
			ease_factor: 2.5,
			difficulty: level,
			next_review: now,
		}));

		const inserted = await supabase.from('cards').insert(cardsToInsert).select();
		if (inserted.error) throw new Error(`Failed to create cards: ${inserted.error.message}`);

		const rows = (Array.isArray(inserted.data) ? inserted.data : cardsToInsert) as Array<Record<string, unknown>>;
		const cards = rows
			.map((row, index) => toStudyCard({
				id: String(row.id ?? `local-${index}`),
				pet_id: (row.pet_id as string | null) ?? petId ?? null,
				deck_id: String(row.deck_id ?? deck.id),
				front: row.front as string,
				back: row.back as string,
				content: (row.content as CardContent) ?? cardsData[index],
				card_type: row.card_type as string,
				difficulty: level,
				interval: 0,
				ease_factor: 2.5,
				next_review: now,
			}, petId))
			.filter((card): card is StudyCard => Boolean(card));

		if (!petId && cards.length === 0) {
			return { success: true, deckId: deck.id, cards: [] };
		}

		return { success: true, deckId: deck.id, cards };
	} catch (error) {
		console.error('Error in generateDeck:', error);
		if (petId && isDemoMode()) {
			const made = demoInsertDeck({ petId, topic, cards: cardsData, difficulty: level });
			return { success: true, deckId: made.deckId, cards: made.cards };
		}
		return { success: false, cards: [], error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

async function requestCards(apiKey: string, topic: string, difficulty: string, level: number, count: number, additionalContext: string) {
	const systemPrompt = `
You write flashcards for a gentle study app. Return ONLY a JSON array of ${count} cards.
${guidance(level)}
${additionalContext}

The learner may be new. If the prompt is in the language being learned, the answer MUST include a short English gloss.
Mix "basic" and "choice". About one card in four should be "choice".
Choice options are the real answers, never just "A" or "B", and "answer" must exactly match one option.
No markdown.

{"question":"...","answer":"...","explanation":"one short sentence","type":"basic"|"choice","options":["..."]}
`;

	const response = await fetch('https://api.x.ai/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: `Topic: ${topic}. Difficulty: ${difficulty}. Count: ${count}.` },
			],
			model: process.env.XAI_MODEL || 'grok-beta',
			stream: false,
			temperature: 0.9,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error('xAI API Error:', errorText);
		throw new Error(`xAI API request failed: ${response.statusText}`);
	}

	const data = await response.json();
	const content = data.choices[0].message.content as string;
	const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
	return normalizeCards(JSON.parse(clean), count);
}
