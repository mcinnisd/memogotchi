'use server';

import { createClient } from '@/utils/supabase/server';
import { generateDeck } from './generateDeck';
import { getTargetDifficulty } from './learningEngine';

export async function generateNextDeck(userId: string, currentTopic: string) {
	// 1. Get target difficulty from proficiency engine
	const target = await getTargetDifficulty(userId, currentTopic);

	console.log(`Adaptive: Topic=${currentTopic}, Proficiency=${target.proficiency.toFixed(0)}, Target=${target.difficultyLabel} (${target.difficulty}/10)`);

	// 2. Generate deck at target difficulty with new content
	return await generateDeck({
		topic: currentTopic,
		userId,
		difficulty: target.difficultyLabel,
		numericDifficulty: target.difficulty,
		// Request unique content
		additionalContext: `Generate COMPLETELY NEW content. Avoid repeating basic concepts. Session ID: ${Date.now()}`
	});
}
