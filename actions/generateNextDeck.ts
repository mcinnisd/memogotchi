'use server';

import { generateDeck } from './generateDeck';
import { getTargetDifficulty } from './learningEngine';

/**
 * Continue the same subject after the due queue empties.
 * Provider-backed generation; safe to call from UI or a future background job.
 */
export async function generateNextDeck(userId: string, currentTopic: string) {
	const target = await getTargetDifficulty(userId, currentTopic);

	return generateDeck({
		topic: currentTopic,
		userId,
		difficulty: target.difficultyLabel,
		numericDifficulty: target.difficulty,
		additionalContext: `Generate COMPLETELY NEW content for topic "${currentTopic}". Do not repeat earlier cards. Session: ${Date.now()}`,
	});
}
