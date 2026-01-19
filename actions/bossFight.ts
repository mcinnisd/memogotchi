'use server';

import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from '@/lib/types';
import { updatePetState } from './petLogic';

export async function generateBossEncounter(userId: string, topic: string) {
	const supabase = await createClient();

	// 1. Identify "Leech" Cards (Lowest Ease Factor) for this topic
	// Join Cards with Decks to filter by topic/user
	const { data: cards, error } = await supabase
		.from('cards')
		.select('content, ease_factor, decks!inner(topic)')
		.eq('decks.user_id', userId)
		.eq('decks.topic', topic)
		.lt('ease_factor', 2.3) // Hard cards
		.order('ease_factor', { ascending: true }) // Worst ones first
		.limit(5);

	if (error) {
		console.error('Error fetching boss cards:', error);
		throw new Error('Failed to retrieve boss encounter data');
	}

	if (!cards || cards.length < 3) {
		return {
			available: false,
			message: "Not enough 'Difficult' cards yet to spawn a boss. Keep studying!"
		};
	}

	// 2. Generate Challenge Questions using xAI
	// We extract the concepts (questions/answers) and ask for a "Boss" variant
	const concepts = cards.map(c => {
		const content = c.content as CardContent;
		return `Q: ${content?.question || 'Unknown'} | A: ${content?.answer || 'Unknown'}`;
	}).join('\n');

	const XAI_API_KEY = process.env.XAI_API_KEY;
	if (!XAI_API_KEY) throw new Error('XAI_API_KEY not defined');

	const systemPrompt = `
    You are the "Dungeon Master" of a learning game. 
    Create 3 ULTIMATE BOSS QUESTIONS based on the provided weak concepts.
    These should be rigorous testing of the concepts.
    Format as JSON array of CardLogic objects:
    [{"question": "...", "options": ["A","B","C","D"], "answer": "The Correct String", "explanation": "..."}]
  `;

	try {
		const response = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${XAI_API_KEY}` },
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: `Weak Concepts:\n${concepts}` }
				],
				model: process.env.XAI_MODEL || 'grok-beta',
			})
		});

		if (!response.ok) throw new Error('Failed to contact Boss AI');

		const data = await response.json();
		const cleanContent = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
		const bossQuestions = JSON.parse(cleanContent);

		return { available: true, questions: bossQuestions };

	} catch (err) {
		console.error('Boss Gen Error:', err);
		throw new Error('The Boss refused to appear (AI Error)');
	}
}

export async function submitBossResult(userId: string, passed: boolean) {
	const supabase = await createClient();

	if (passed) {
		// Massive Rewards
		// +100 XP, +50 Coins, Restore Full Health
		const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
		if (profile) {
			const newXp = (profile.xp || 0) + 100;
			const newCoins = (profile.coins || 0) + 50;

			await supabase.from('profiles').update({
				xp: newXp,
				coins: newCoins,
				health: 100 // Full restore
			}).eq('id', userId);

			// Trigger evolution check if needed (reusing petLogic logic implicitly or explicitly)
			// Ideally we call updatePetState(userId, 4) to handle logic, but we want custom values.
			// Let's just update directly for the "Boss Loot".

			return { success: true, reward: "100 XP, 50 Coins, Full Health!" };
		}
	} else {
		// Penalty: -20 Health
		const { data: profile } = await supabase.from('profiles').select('health').eq('id', userId).single();
		if (profile) {
			const newHealth = Math.max(0, (profile.health || 0) - 20);
			await supabase.from('profiles').update({ health: newHealth }).eq('id', userId);
			return { success: false, penalty: "-20 Health. The Boss defeated you." };
		}
	}
	return { success: false, error: "Profile not found" };
}
