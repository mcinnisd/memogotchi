'use server';

import { createClient } from '@/utils/supabase/server';
import { Card, Deck, CardContent } from '@/lib/types';

interface GenerateDeckProps {
	topic: string;
	userId: string;
	difficulty?: string;
	numericDifficulty?: number; // 1-10 scale
	additionalContext?: string;
}

// Map numeric difficulty (1-10) to descriptive guidance
function getDifficultyGuidance(numericDiff: number): string {
	if (numericDiff <= 2) {
		return `Difficulty: Absolute Beginner (Level ${numericDiff}/10)
		- Define all terms
		- Use simple examples
		- Focus on foundational concepts
		- Multiple choice options should be clearly distinct`;
	} else if (numericDiff <= 4) {
		return `Difficulty: Beginner (Level ${numericDiff}/10)
		- Assume basic familiarity with the subject
		- Include some terminology without extensive definitions
		- Focus on core concepts`;
	} else if (numericDiff <= 6) {
		return `Difficulty: Intermediate (Level ${numericDiff}/10)
		- Assume working knowledge of fundamentals
		- Include application-based questions
		- Some nuanced distinctions required`;
	} else if (numericDiff <= 8) {
		return `Difficulty: Advanced (Level ${numericDiff}/10)
		- Assume strong foundation
		- Include edge cases and exceptions
		- Require synthesis of multiple concepts`;
	} else {
		return `Difficulty: Expert (Level ${numericDiff}/10)
		- Assume mastery of core content
		- Include subtle distinctions
		- Test deep understanding and rare scenarios`;
	}
}

export async function generateDeck({
	topic,
	userId,
	difficulty = 'Beginner',
	numericDifficulty,
	additionalContext = ''
}: GenerateDeckProps) {
	const XAI_API_KEY = process.env.XAI_API_KEY;

	if (!XAI_API_KEY) {
		throw new Error('XAI_API_KEY is not defined');
	}

	// Use numeric difficulty if provided, otherwise map from string
	const difficultyLevel = numericDifficulty ??
		(difficulty === 'Expert' ? 9 :
			difficulty === 'Advanced' ? 7 :
				difficulty === 'Intermediate' ? 5 :
					difficulty === 'Elementary' ? 3 : 2);

	const difficultyGuidance = getDifficultyGuidance(difficultyLevel);

	const systemPrompt = `
    You are a strictly JSON-speaking teacher. 
    Create a deck of 5 flashcards on the provided topic.
    
    ${difficultyGuidance}
    
    ${additionalContext}
    
    Output must be a raw JSON array of objects following this structure:
    {
      "question": "The question string",
      "answer": "The answer string",
      "explanation": "A short explanation of why this answer is correct",
      "type": "basic" | "choice",
      "options": ["Option A", "Option B", "Option C"] // Only required if type is "choice"
    }
    Mix "basic" and "choice" types.
    Do not include markdown formatting like \`\`\`json. 
    Example: [{"question": "Q?", "answer": "A", "explanation": "Exp", "type": "basic"}]
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
					{ role: 'user', content: `Topic: ${topic}, Difficulty: ${difficulty}` },
				],
				model: process.env.XAI_MODEL || 'grok-beta',
				stream: false,
				temperature: 0.9, // Higher temperature for more variety
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('xAI API Error:', errorText);
			throw new Error(`xAI API request failed: ${response.statusText}`);
		}

		const data = await response.json();
		const content = data.choices[0].message.content;

		// Clean up content if it contains markdown code blocks despite instructions
		const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

		let cardsData: CardContent[];
		try {
			cardsData = JSON.parse(cleanContent);
		} catch (e) {
			console.error('Failed to parse JSON from xAI:', cleanContent);
			throw new Error('Failed to parse generated flashcards');
		}

		const supabase = await createClient();

		// 1. Create Deck
		const { data: deck, error: deckError } = await supabase
			.from('decks')
			.insert({
				user_id: userId,
				topic: topic,
			})
			.select()
			.single();

		if (deckError || !deck) {
			throw new Error(`Failed to create deck: ${deckError?.message}`);
		}

		// 2. Create Cards with Rich Content and Difficulty
		const cardsToInsert = cardsData.map((card) => ({
			deck_id: deck.id,
			front: card.question,
			back: card.answer,
			content: card,
			card_type: card.type,
			interval: 0,
			ease_factor: 2.5,
			difficulty: difficultyLevel, // Store the difficulty level
		}));

		const { error: cardsError } = await supabase
			.from('cards')
			.insert(cardsToInsert);

		if (cardsError) {
			throw new Error(`Failed to create cards: ${cardsError.message}`);
		}

		return { success: true, deckId: deck.id };

	} catch (error) {
		console.error('Error in generateDeck:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
