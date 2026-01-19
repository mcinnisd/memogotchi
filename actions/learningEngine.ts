'use server';

import { createClient } from '@/utils/supabase/server';
import {
	calculateProficiencyUpdate,
	calculateTargetDifficulty,
	type PerformanceResult,
	type ReviewSignals
} from '@/lib/learning';

/**
 * Update user's topic proficiency based on performance
 */
export async function updateProficiency(
	userId: string,
	topic: string,
	performance: PerformanceResult,
	responseTimeMs: number
): Promise<{ newProficiency: number; newConfidence: number }> {
	const supabase = await createClient();

	// Get or create proficiency record
	let { data: proficiency, error } = await supabase
		.from('topic_proficiency')
		.select('*')
		.eq('user_id', userId)
		.eq('topic', topic)
		.single();

	if (error || !proficiency) {
		// Create new proficiency record with default 50
		const { data: newProf, error: insertError } = await supabase
			.from('topic_proficiency')
			.insert({
				user_id: userId,
				topic: topic,
				proficiency_score: 50.0,
				confidence: 0.3,
				total_reviews: 0,
				avg_response_time_ms: null
			})
			.select()
			.single();

		if (insertError) {
			console.error('Failed to create proficiency:', insertError);
			return { newProficiency: 50, newConfidence: 0.3 };
		}
		proficiency = newProf;
	}

	// Use pure function for calculation
	const update = calculateProficiencyUpdate(
		proficiency.proficiency_score,
		proficiency.confidence,
		performance
	);

	// Rolling average response time
	const newAvgTime = proficiency.avg_response_time_ms
		? Math.round(proficiency.avg_response_time_ms * 0.9 + responseTimeMs * 0.1)
		: responseTimeMs;

	// Update database
	await supabase
		.from('topic_proficiency')
		.update({
			proficiency_score: update.newProficiency,
			confidence: update.newConfidence,
			total_reviews: proficiency.total_reviews + 1,
			avg_response_time_ms: newAvgTime,
			last_updated: new Date().toISOString()
		})
		.eq('id', proficiency.id);

	return { newProficiency: update.newProficiency, newConfidence: update.newConfidence };
}

/**
 * Record detailed review signals for analysis
 */
export async function recordReviewSignal(
	userId: string,
	cardId: string,
	signals: ReviewSignals,
	proficiencyAtTime: number
): Promise<void> {
	const supabase = await createClient();

	await supabase
		.from('review_signals')
		.insert({
			user_id: userId,
			card_id: cardId,
			grade: signals.grade,
			response_time_ms: signals.responseTimeMs,
			was_flipped: signals.wasFlipped,
			card_difficulty: signals.cardDifficulty,
			proficiency_at_time: proficiencyAtTime
		});
}

/**
 * Get user's current proficiency for a topic
 */
export async function getProficiency(userId: string, topic: string): Promise<{
	proficiency: number;
	confidence: number;
	totalReviews: number;
} | null> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from('topic_proficiency')
		.select('proficiency_score, confidence, total_reviews')
		.eq('user_id', userId)
		.eq('topic', topic)
		.single();

	if (error || !data) return null;

	return {
		proficiency: data.proficiency_score,
		confidence: data.confidence,
		totalReviews: data.total_reviews
	};
}

/**
 * Get target difficulty for generating new cards
 */
export async function getTargetDifficulty(userId: string, topic: string): Promise<{
	difficulty: number;
	difficultyLabel: string;
	proficiency: number;
}> {
	const prof = await getProficiency(userId, topic);
	const proficiency = prof?.proficiency ?? 50;

	// Target slightly above current level with stretch factor
	const stretchFactor = 0.15;
	const targetDifficulty = Math.min(10, Math.max(1,
		(proficiency / 10) * (1 + stretchFactor)
	));

	// Map to difficulty label for AI prompt
	let difficultyLabel: string;
	if (proficiency < 30) {
		difficultyLabel = 'Beginner';
	} else if (proficiency < 50) {
		difficultyLabel = 'Elementary';
	} else if (proficiency < 70) {
		difficultyLabel = 'Intermediate';
	} else if (proficiency < 85) {
		difficultyLabel = 'Advanced';
	} else {
		difficultyLabel = 'Expert';
	}

	return {
		difficulty: Math.round(targetDifficulty),
		difficultyLabel,
		proficiency
	};
}

/**
 * Initialize proficiency from placement test result
 */
export async function initializeProficiency(
	userId: string,
	topic: string,
	placementResult: 'Beginner' | 'Intermediate' | 'Advanced',
	placementConfidence: number
): Promise<void> {
	const supabase = await createClient();

	const proficiencyMap = {
		'Beginner': 25,
		'Intermediate': 50,
		'Advanced': 75
	};

	const initialProficiency = proficiencyMap[placementResult];
	const initialConfidence = Math.min(0.6, placementConfidence / 100);

	await supabase
		.from('topic_proficiency')
		.upsert({
			user_id: userId,
			topic: topic,
			proficiency_score: initialProficiency,
			confidence: initialConfidence,
			total_reviews: 0,
			last_updated: new Date().toISOString()
		}, {
			onConflict: 'user_id,topic'
		});
}
