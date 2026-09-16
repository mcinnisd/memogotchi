import type { GeneratedCard, GeneratedCardType } from './types';

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function normalizeType(value: unknown): GeneratedCardType {
	return value === 'choice' ? 'choice' : 'basic';
}

/**
 * Strict-ish structured validation for generated flashcards.
 * Rejects junk entries; prefers reversible Q/A over empty or malformed rows.
 */
export function validateGeneratedCards(raw: unknown): GeneratedCard[] {
	if (!Array.isArray(raw)) {
		throw new Error('Generated payload must be a JSON array of cards');
	}

	const cards: GeneratedCard[] = [];

	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;

		const record = item as Record<string, unknown>;
		const question = record.question;
		const answer = record.answer;

		if (!isNonEmptyString(question) || !isNonEmptyString(answer)) {
			continue;
		}

		const type = normalizeType(record.type);
		const explanation = isNonEmptyString(record.explanation)
			? record.explanation.trim()
			: undefined;

		let options: string[] | undefined;
		if (type === 'choice') {
			if (!Array.isArray(record.options)) continue;
			options = record.options
				.filter(isNonEmptyString)
				.map((opt) => opt.trim());
			if (options.length < 2) continue;
			if (!options.includes(answer.trim()) && !options.some((o) => o === answer)) {
				options = [...options, answer.trim()];
			}
		}

		cards.push({
			question: question.trim(),
			answer: answer.trim(),
			explanation,
			type,
			...(options ? { options } : {}),
		});
	}

	if (cards.length === 0) {
		throw new Error('No valid flashcards after validation');
	}

	return cards;
}

export function parseGeneratedCardsJson(content: string): GeneratedCard[] {
	const clean = content.replace(/```json/gi, '').replace(/```/g, '').trim();
	let parsed: unknown;
	try {
		parsed = JSON.parse(clean);
	} catch {
		throw new Error('Failed to parse generated flashcards JSON');
	}
	return validateGeneratedCards(parsed);
}
