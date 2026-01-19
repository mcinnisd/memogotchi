'use server';

import { createClient } from '@/utils/supabase/server';

interface PlacementQuestion {
	question: string;
	options: string[];
	answer: string;
	difficulty: 'easy' | 'medium' | 'hard';
}

interface PlacementResult {
	questions: PlacementQuestion[];
	confidenceScore: number;
	recommendedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

// Generate placement quiz questions for a new topic
export async function generatePlacementQuiz(
	topic: string,
	avoidQuestions: string[] = []
): Promise<{ questions: PlacementQuestion[] }> {
	const XAI_API_KEY = process.env.XAI_API_KEY;
	if (!XAI_API_KEY) throw new Error('XAI_API_KEY not defined');

	const avoidClause = avoidQuestions.length > 0
		? `\nDO NOT repeat these questions: ${avoidQuestions.slice(0, 5).join('; ')}`
		: '';

	const systemPrompt = `
You are creating a placement quiz for a learning app about "${topic}".
Generate exactly 3 unique multiple-choice questions to assess user knowledge level.
Include 1 easy, 1 medium, and 1 hard question.
${avoidClause}

CRITICAL FORMATTING RULES:
1. Options must be the ACTUAL ANSWER CHOICES, not letters like "A", "B", etc.
2. The "answer" field must EXACTLY match one of the options
3. Return ONLY valid JSON, no markdown

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "answer": "Paris",
    "difficulty": "easy"
  }
]
`;

	try {
		const response = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${XAI_API_KEY}`,
			},
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: `Generate placement quiz for: ${topic}. Session: ${Date.now()}` },
				],
				model: process.env.XAI_MODEL || 'grok-beta',
				temperature: 0.8, // Higher for variety
			}),
		});

		if (!response.ok) throw new Error('Failed to generate quiz');

		const data = await response.json();
		const content = data.choices[0].message.content;
		const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
		const questions = JSON.parse(cleanContent) as PlacementQuestion[];

		// Validate questions
		const validQuestions = questions.filter(q => {
			// Ensure answer is in options
			const answerInOptions = q.options.includes(q.answer);
			// Ensure options are not just letters
			const realOptions = q.options.every(opt => opt.length > 1 || !/^[A-D]$/.test(opt));
			return answerInOptions && realOptions && q.options.length >= 2;
		});

		return { questions: validQuestions };
	} catch (err) {
		console.error('Placement quiz generation error:', err);
		return { questions: [] };
	}
}

// Evaluate user's placement quiz responses
export async function evaluatePlacement(
	responses: { questionIndex: number; userAnswer: string; correct: boolean; timeMs: number }[]
): Promise<{ recommendedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced'; confidenceScore: number }> {

	// Calculate score based on correctness and speed
	const correctCount = responses.filter(r => r.correct).length;
	const totalQuestions = responses.length;
	const avgTimeMs = responses.reduce((sum, r) => sum + r.timeMs, 0) / totalQuestions;

	// Fast and correct = higher level
	// Slow but correct = medium level
	// Incorrect = lower level

	let score = 0;
	responses.forEach(r => {
		if (r.correct) {
			// Base points for correct
			score += 1;
			// Bonus for fast answers (under 10 seconds)
			if (r.timeMs < 10000) score += 0.5;
		}
	});

	const maxScore = totalQuestions * 1.5;
	const percentage = (score / maxScore) * 100;

	let recommendedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
	let confidenceScore: number;

	if (percentage >= 70) {
		recommendedDifficulty = 'Advanced';
		confidenceScore = Math.min(90, percentage);
	} else if (percentage >= 40) {
		recommendedDifficulty = 'Intermediate';
		confidenceScore = Math.min(85, 50 + percentage / 2);
	} else {
		recommendedDifficulty = 'Beginner';
		confidenceScore = Math.min(80, 30 + percentage);
	}

	return { recommendedDifficulty, confidenceScore };
}
