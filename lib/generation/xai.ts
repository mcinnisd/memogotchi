import type { CardGenerationProvider, GenerateCardsRequest, GeneratedCard } from './types';
import { parseGeneratedCardsJson } from './validate';

function getDifficultyGuidance(numericDiff: number): string {
	if (numericDiff <= 2) {
		return `Difficulty: Absolute Beginner (Level ${numericDiff}/10)
- Define all terms; use simple examples; foundational concepts only.`;
	}
	if (numericDiff <= 4) {
		return `Difficulty: Beginner (Level ${numericDiff}/10)
- Assume basic familiarity; focus on core concepts.`;
	}
	if (numericDiff <= 6) {
		return `Difficulty: Intermediate (Level ${numericDiff}/10)
- Working knowledge of fundamentals; application questions.`;
	}
	if (numericDiff <= 8) {
		return `Difficulty: Advanced (Level ${numericDiff}/10)
- Strong foundation; edge cases; synthesis of concepts.`;
	}
	return `Difficulty: Expert (Level ${numericDiff}/10)
- Mastery assumed; subtle distinctions and rare scenarios.`;
}

/**
 * xAI (Grok) implementation of CardGenerationProvider.
 * Other models can implement the same interface later.
 */
export class XaiCardProvider implements CardGenerationProvider {
	async generateCards(request: GenerateCardsRequest): Promise<GeneratedCard[]> {
		const apiKey = process.env.XAI_API_KEY;
		if (!apiKey) {
			throw new Error('XAI_API_KEY is not defined');
		}

		const count = request.count ?? 5;
		const difficultyGuidance = getDifficultyGuidance(request.difficultyLevel);

		const systemPrompt = `
You are a strictly JSON-speaking teacher.
Create exactly ${count} flashcards on the provided topic.

${difficultyGuidance}

${request.additionalContext || ''}

Prefer teachable, reversible question/answer pairs (definitions, translations, procedures).
Avoid unverifiable trivia or contested "facts".
For language topics, include enough scaffolding that a beginner can understand the prompt.

Output must be a raw JSON array of objects:
{
  "question": "string",
  "answer": "string",
  "explanation": "short why this is correct",
  "type": "basic" | "choice",
  "options": ["A", "B", "C"] // only if type is "choice"; must include the answer
}
Mix "basic" and "choice" types.
Do not wrap in markdown.
`.trim();

		const response = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: systemPrompt },
					{
						role: 'user',
						content: `Topic: ${request.topic}, Difficulty: ${request.difficultyLabel}`,
					},
				],
				model: process.env.XAI_MODEL || 'grok-2-latest',
				stream: false,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('xAI API Error:', errorText);
			throw new Error(`xAI API request failed: ${response.statusText}`);
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content;
		if (!content || typeof content !== 'string') {
			throw new Error('Empty generation response');
		}

		return parseGeneratedCardsJson(content);
	}
}
