'use server';

import { createClient } from '@/utils/supabase/server';
import { touchStreak } from '@/actions/pets';
import { demoGetProficiency, demoSubmitReview } from '@/lib/demo/store';
import { calculatePerformance } from '@/lib/learning';
import { isDemoMode } from '@/lib/runtime';
import { calculateReview } from '@/lib/srs';
import type { Card } from '@/lib/types';
import { getProficiency, recordReviewSignal, updateProficiency } from './learningEngine';

interface ReviewSignals {
	responseTimeMs: number;
	wasFlipped: boolean;
	cardDifficulty?: number;
}

export async function submitReview(
	userId: string,
	cardId: string,
	grade: number,
	topic: string,
	signals?: ReviewSignals
) {
	if (isDemoMode()) return demoSubmitReview(cardId, grade, signals);

	const supabase = await createClient();
	const { data: card, error: fetchError } = await supabase
		.from('cards')
		.select('*, decks(topic)')
		.eq('id', cardId)
		.single();

	if (fetchError || !card) throw new Error('Card not found');

	const currentCard = card as Card & { decks?: { topic: string } };
	const cardTopic = topic || currentCard.decks?.topic || 'General';
	const srsResult = calculateReview(currentCard.interval ?? 0, currentCard.ease_factor ?? 2.5, grade);

	let proficiencyUpdate = null;
	if (signals) {
		const currentProf = await getProficiency(userId, cardTopic);
		const currentProficiency = currentProf?.proficiency ?? 50;
		const performance = calculatePerformance({
			grade,
			responseTimeMs: signals.responseTimeMs,
			wasFlipped: signals.wasFlipped,
			cardDifficulty: signals.cardDifficulty ?? currentCard.difficulty ?? 5,
		}, currentProficiency);
		proficiencyUpdate = await updateProficiency(userId, cardTopic, performance, signals.responseTimeMs);
		recordReviewSignal(userId, cardId, {
			grade,
			responseTimeMs: signals.responseTimeMs,
			wasFlipped: signals.wasFlipped,
			cardDifficulty: signals.cardDifficulty ?? currentCard.difficulty ?? 5,
		}, currentProficiency).catch(console.error);
		if (proficiencyUpdate.newProficiency > 70) {
			srsResult.easeFactor = Math.min(3.0, parseFloat((srsResult.easeFactor * 1.05).toFixed(2)));
		}
	}

	await touchStreak(userId);

	await supabase.from('cards').update({
		interval: srsResult.interval,
		ease_factor: srsResult.easeFactor,
		next_review: srsResult.nextReview,
	}).eq('id', cardId);

	return { success: true, cardUpdate: srsResult, proficiencyUpdate };
}

export async function readProficiency(userId: string, topic: string) {
	if (isDemoMode()) return demoGetProficiency(topic);
	return getProficiency(userId, topic);
}
