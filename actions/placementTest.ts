'use server';

import { fixtureQuestions } from '@/lib/fixtures';
import { evaluatePlacementScore, type PlacementDifficulty } from '@/lib/placement';
import { isDemoMode } from '@/lib/runtime';

export interface PlacementQuestion {
	question: string;
	answer: string;
	explanation?: string;
	type: 'basic' | 'choice';
	options?: string[];
	difficulty: 'easy' | 'medium' | 'hard';
}

function cleanQuestions(raw: unknown): PlacementQuestion[] {
	if (!Array.isArray(raw)) return [];
	const questions: PlacementQuestion[] = [];
	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;
		const row = item as Record<string, unknown>;
		const question = String(row.question ?? '').trim();
		const answer = String(row.answer ?? '').trim();
		if (!question || !answer) continue;
		const options = Array.isArray(row.options) ? row.options.map((option) => String(option)) : undefined;
		const type = row.type === 'basic' || !options ? 'basic' : 'choice';
		if (type === 'choice') {
			if (!options || options.length < 2 || !options.includes(answer)) continue;
			if (options.some((option) => option.length <= 1 && /^[A-D]$/.test(option))) continue;
		}
		const difficulty = row.difficulty === 'hard' || row.difficulty === 'medium' ? row.difficulty : 'easy';
		questions.push({
			question,
			answer,
			explanation: row.explanation ? String(row.explanation) : undefined,
			type,
			options: type === 'choice' ? options : undefined,
			difficulty,
		});
	}
	return questions;
}

export async function generatePlacementQuiz(topic: string, avoidQuestions: string[] = []): Promise<{ questions: PlacementQuestion[] }> {
	if (isDemoMode() || !process.env.XAI_API_KEY) {
		return { questions: fixtureQuestions(topic, avoidQuestions, 3) };
	}

	const avoidClause = avoidQuestions.length > 0
		? `Do not repeat: ${avoidQuestions.slice(0, 8).join(' | ')}`
		: '';

	const systemPrompt = `
Write 3 placement cards about "${topic}" for a paper flashcard app.
Return ONLY a JSON array. Include easy, medium, and hard.
Most cards are type "basic" (a prompt and an answer, no options).
One card should be type "choice" with real answer options, and "answer" must match one option exactly.
If the prompt is in the target language, the answer must include an English gloss.
${avoidClause}
[{"question":"hola","answer":"hello","type":"basic","difficulty":"easy"},{"question":"What does hola mean?","options":["hello","goodbye","please"],"answer":"hello","type":"choice","difficulty":"easy"}]
`;

	try {
		const response = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.XAI_API_KEY}`,
			},
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: `Topic: ${topic}. Batch: ${Date.now()}` },
				],
				model: process.env.XAI_MODEL || 'grok-beta',
				temperature: 0.8,
			}),
		});
		if (!response.ok) throw new Error('Failed to generate quiz');
		const data = await response.json();
		const content = String(data.choices[0].message.content);
		const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
		const questions = cleanQuestions(JSON.parse(clean));
		if (questions.length === 0) return { questions: fixtureQuestions(topic, avoidQuestions, 3) };
		return { questions };
	} catch (error) {
		console.error('Placement quiz generation error:', error);
		return { questions: fixtureQuestions(topic, avoidQuestions, 3) };
	}
}

export async function evaluatePlacement(
	responses: { questionIndex: number; userAnswer: string; correct: boolean; timeMs: number }[]
): Promise<{ recommendedDifficulty: PlacementDifficulty; confidenceScore: number }> {
	return evaluatePlacementScore(responses.map((response) => ({
		correct: response.correct,
		timeMs: response.timeMs,
	})));
}
