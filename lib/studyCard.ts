import type { CardContent, StudyCard } from '@/lib/types';

export function toStudyCard(row: {
	id: string;
	pet_id?: string | null;
	deck_id: string;
	front?: string | null;
	back?: string | null;
	content?: Partial<CardContent> | null;
	card_type?: string | null;
	difficulty?: number | null;
	interval?: number | null;
	ease_factor?: number | null;
	next_review?: string | null;
}, fallbackPetId?: string | null): StudyCard | null {
	const petId = row.pet_id || fallbackPetId;
	if (!petId) return null;
	const content = row.content ?? {};
	const rawType = content.type || row.card_type;
	const type = rawType === 'choice' ? 'choice' : 'basic';
	return {
		id: row.id,
		pet_id: petId,
		deck_id: row.deck_id,
		prompt: content.question || row.front || '',
		answer: content.answer || row.back || '',
		explanation: content.explanation,
		type,
		options: Array.isArray(content.options) ? content.options.filter((option) => option.length > 0) : undefined,
		difficulty: row.difficulty ?? 5,
		interval: row.interval ?? 0,
		ease_factor: row.ease_factor ?? 2.5,
		next_review: row.next_review ?? null,
	};
}

export function isDue(nextReview: string | null, now = new Date()): boolean {
	if (!nextReview) return true;
	const time = new Date(nextReview).getTime();
	if (Number.isNaN(time)) return true;
	return time <= now.getTime();
}
