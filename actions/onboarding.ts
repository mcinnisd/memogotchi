'use server';

import { createClient } from '@/utils/supabase/server';

export async function generatePetPersona(goals: string[]) {
	const XAI_API_KEY = process.env.XAI_API_KEY;
	if (!XAI_API_KEY) throw new Error('XAI_API_KEY not defined');

	const systemPrompt = `
    You are a creative pet generator. Based on the user's learning goals, 
    suggest a unique, fun "Pet Type" name (max 3 words) that fits the theme.
    Example: Goals=["Coding"] -> "Binary Dragon"
    Example: Goals=["Biology"] -> "Microbe Buddy"
    Output ONLY the JSON object: {"petType": "String", "description": "Short bio"}
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
					{ role: 'user', content: `Goals: ${goals.join(', ')}` },
				],
				model: process.env.XAI_MODEL || 'grok-beta',
				stream: false,
			}),
		});

		if (!response.ok) throw new Error('xAI API failed');
		const data = await response.json();
		const content = data.choices[0].message.content;

		// Parse JSON from content (handle potential markdown warppers)
		const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
		return JSON.parse(jsonStr);

	} catch (error) {
		console.error('Error generating persona:', error);
		return { petType: 'Generic Blob', description: 'A blob waiting to learn.' };
	}
}

export async function initializeUser(userId: string, petName: string, petType: string, goals: string[]) {

	const supabase = await createClient();

	const { error } = await supabase
		.from('profiles')
		.upsert({
			id: userId,
			pet_name: petName,
			pet_type: petType,
			learning_goals: goals,
			xp: 0,
			health: 100,
			coins: 0,
			current_streak: 0,
			stage: 'egg',
			updated_at: new Date().toISOString()
		});

	if (error) {
		throw new Error(`Failed to init user: ${error.message}`);
	}
	return { success: true };
}
