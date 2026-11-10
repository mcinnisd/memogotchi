'use server';

import { generateDeck } from './generateDeck';
import { getTargetDifficulty } from './learningEngine';
import { FEEDING } from '@/lib/config';

export async function generateNextDeck(userId: string, currentTopic: string, petId?: string) {
	const target = await getTargetDifficulty(userId, currentTopic);
	return generateDeck({
		topic: currentTopic,
		userId,
		petId,
		difficulty: target.difficultyLabel,
		numericDifficulty: target.difficulty,
		count: FEEDING.minCards + 2,
		additionalContext: `New cards only. Do not repeat a question you would use on day one if the learner is past beginner. Session ${Date.now()}`,
	});
}
