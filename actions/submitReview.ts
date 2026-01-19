'use server';

import { createClient } from '@/utils/supabase/server';
import { calculateReview } from '@/lib/srs';
import { updatePetState } from './petLogic';
import { Card } from '@/lib/types';
import { calculatePerformance, type ReviewSignals as LearningSignals } from '@/lib/learning';
import {
	updateProficiency,
	recordReviewSignal,
	getProficiency
} from './learningEngine';

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
	const supabase = await createClient();

	// 1. Fetch the card's current state
	const { data: card, error: fetchError } = await supabase
		.from('cards')
		.select('*, decks(topic)')
		.eq('id', cardId)
		.single();

	if (fetchError || !card) {
		throw new Error('Card not found');
	}

	const currentCard = card as Card & { decks?: { topic: string } };
	const cardTopic = topic || currentCard.decks?.topic || 'General';

	// 2. Calculate new SRS values
	const srsResult = calculateReview(
		currentCard.interval,
		currentCard.ease_factor,
		grade
	);

	// 3. Update Pet State
	const petResult = await updatePetState(userId, grade);

	// 4. Learning Engine: Update proficiency if signals provided
	let proficiencyUpdate = null;
	if (signals) {
		// Get current proficiency for performance calculation
		const currentProf = await getProficiency(userId, cardTopic);
		const currentProficiency = currentProf?.proficiency ?? 50;

		const performance = calculatePerformance({
			grade,
			responseTimeMs: signals.responseTimeMs,
			wasFlipped: signals.wasFlipped,
			cardDifficulty: signals.cardDifficulty ?? currentCard.difficulty ?? 5
		}, currentProficiency);

		// Update proficiency
		proficiencyUpdate = await updateProficiency(
			userId,
			cardTopic,
			performance,
			signals.responseTimeMs
		);

		// Record detailed signal for analysis (non-blocking)
		recordReviewSignal(
			userId,
			cardId,
			{
				grade,
				responseTimeMs: signals.responseTimeMs,
				wasFlipped: signals.wasFlipped,
				cardDifficulty: signals.cardDifficulty ?? 5
			},
			currentProficiency
		).catch(console.error);

		// Pass proficiency info to SRS (affect ease factor)
		// Higher proficiency = can handle slightly harder intervals
		if (proficiencyUpdate.newProficiency > 70) {
			srsResult.easeFactor = Math.min(3.0, srsResult.easeFactor * 1.05);
		}
	}

	// 5. Gamification: Coins & Streaks
	const coinReward = 10;
	const today = new Date();
	const todayStr = today.toISOString().split('T')[0];

	const { data: profile } = await supabase
		.from('profiles')
		.select('current_streak, last_study_date, coins')
		.eq('id', userId)
		.single();

	let newStreak = profile?.current_streak || 0;
	const lastDateStr = profile?.last_study_date
		? new Date(profile.last_study_date).toISOString().split('T')[0]
		: null;

	if (lastDateStr !== todayStr) {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split('T')[0];
		newStreak = lastDateStr === yesterdayStr ? newStreak + 1 : 1;
	}

	const newCoins = (profile?.coins || 0) + coinReward;

	await supabase.from('profiles').update({
		current_streak: newStreak,
		last_study_date: new Date().toISOString(),
		coins: newCoins
	}).eq('id', userId);

	// 6. Update Card in DB with SRS values
	await supabase
		.from('cards')
		.update({
			interval: srsResult.interval,
			ease_factor: srsResult.easeFactor,
			next_review: srsResult.nextReview,
		})
		.eq('id', cardId);

	return {
		success: true,
		cardUpdate: srsResult,
		petUpdate: petResult,
		proficiencyUpdate
	};
}
