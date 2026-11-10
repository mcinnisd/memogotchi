'use server';

import { createClient } from '@/utils/supabase/server';
import { demoGetProficiency, demoInitProficiency } from '@/lib/demo/store';
import { isDemoMode } from '@/lib/runtime';
import {
	calculateProficiencyUpdate,
	calculateTargetDifficulty,
	type PerformanceResult,
	type ReviewSignals,
} from '@/lib/learning';
import type { PlacementDifficulty } from '@/lib/placement';

export async function updateProficiency(
	userId: string,
	topic: string,
	performance: PerformanceResult,
	responseTimeMs: number
): Promise<{ newProficiency: number; newConfidence: number }> {
	const supabase = await createClient();
	const { data: existing, error } = await supabase
		.from('topic_proficiency')
		.select('*')
		.eq('user_id', userId)
		.eq('topic', topic)
		.single();

	let proficiency = existing;
	if (error || !proficiency) {
		const { data: created, error: insertError } = await supabase
			.from('topic_proficiency')
			.insert({
				user_id: userId,
				topic,
				proficiency_score: 50.0,
				confidence: 0.3,
				total_reviews: 0,
				avg_response_time_ms: null,
			})
			.select()
			.single();
		if (insertError || !created) return { newProficiency: 50, newConfidence: 0.3 };
		proficiency = created;
	}

	const update = calculateProficiencyUpdate(
		proficiency.proficiency_score,
		proficiency.confidence,
		performance
	);
	const newAvgTime = proficiency.avg_response_time_ms
		? Math.round(proficiency.avg_response_time_ms * 0.9 + responseTimeMs * 0.1)
		: responseTimeMs;

	await supabase.from('topic_proficiency').update({
		proficiency_score: update.newProficiency,
		confidence: update.newConfidence,
		total_reviews: (proficiency.total_reviews ?? 0) + 1,
		avg_response_time_ms: newAvgTime,
		last_updated: new Date().toISOString(),
	}).eq('id', proficiency.id);

	return { newProficiency: update.newProficiency, newConfidence: update.newConfidence };
}

export async function recordReviewSignal(
	userId: string,
	cardId: string,
	signals: ReviewSignals,
	proficiencyAtTime: number
): Promise<void> {
	const supabase = await createClient();
	await supabase.from('review_signals').insert({
		user_id: userId,
		card_id: cardId,
		grade: signals.grade,
		response_time_ms: signals.responseTimeMs,
		was_flipped: signals.wasFlipped,
		card_difficulty: signals.cardDifficulty,
		proficiency_at_time: proficiencyAtTime,
	});
}

export async function getProficiency(userId: string, topic: string): Promise<{
	proficiency: number;
	confidence: number;
	totalReviews: number;
} | null> {
	if (isDemoMode()) return demoGetProficiency(topic);
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('topic_proficiency')
		.select('proficiency_score, confidence, total_reviews')
		.eq('user_id', userId)
		.eq('topic', topic)
		.single();
	if (error || !data || typeof data.proficiency_score !== 'number') return null;
	return {
		proficiency: data.proficiency_score,
		confidence: data.confidence,
		totalReviews: data.total_reviews,
	};
}

export async function getTargetDifficulty(userId: string, topic: string): Promise<{
	difficulty: number;
	difficultyLabel: string;
	proficiency: number;
}> {
	const prof = await getProficiency(userId, topic);
	const proficiency = prof?.proficiency ?? 50;
	const target = calculateTargetDifficulty(proficiency);
	return { ...target, proficiency };
}

export async function initializeProficiency(
	userId: string,
	topic: string,
	placementResult: PlacementDifficulty,
	placementConfidence: number,
	petId?: string
): Promise<void> {
	if (isDemoMode()) {
		demoInitProficiency(topic, petId ?? null, placementResult, placementConfidence);
		return;
	}
	const supabase = await createClient();
	const proficiencyMap = { Beginner: 25, Intermediate: 50, Advanced: 75 };
	await supabase.from('topic_proficiency').upsert({
		user_id: userId,
		topic,
		pet_id: petId ?? null,
		proficiency_score: proficiencyMap[placementResult],
		confidence: Math.min(0.6, placementConfidence / 100),
		total_reviews: 0,
		last_updated: new Date().toISOString(),
	}, { onConflict: 'user_id,topic' });
}
