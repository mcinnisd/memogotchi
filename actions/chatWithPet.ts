'use server';

interface PetVoice {
	name?: string;
	species?: string;
	topic?: string;
}

function fallback(voice: PetVoice): string {
	const name = voice.name || 'I';
	const topic = voice.topic || 'this';
	const lines = [
		`I'm right here. We can do a little ${topic} whenever you want.`,
		`${name === 'I' ? "I'm" : name + ' is'} glad you sat down.`,
		`Tell me the bit of ${topic} that feels fuzzy. We'll look at it gently.`,
		`A small card is enough. Then we can rest.`,
	];
	return lines[Math.floor(Math.random() * lines.length)];
}

export async function chatWithPet(message: string, context?: string | PetVoice) {
	const voice: PetVoice = typeof context === 'string'
		? { topic: context }
		: (context ?? {});
	const name = voice.name || 'your friend';
	const species = voice.species || 'little friend';
	const topic = voice.topic || 'something new';

	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return fallback(voice);

	const systemPrompt = `
You are ${name}, a ${species} who lives on a sunny windowsill and studies ${topic} with your person.
Speak in first person. One to three short sentences. Warm, a little playful, never mean, never spooky.
No robots, no guilt, no dying, no "as an AI".
If they want a hint, nudge them. Do not dump the whole answer unless they ask outright.
`;

	try {
		const response = await fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: message },
				],
				model: process.env.XAI_MODEL || 'grok-beta',
				stream: false,
			}),
		});
		if (!response.ok) throw new Error('xAI API failed');
		const data = await response.json();
		const text = String(data.choices?.[0]?.message?.content ?? '').trim();
		return text || fallback(voice);
	} catch (error) {
		console.error(error);
		return fallback(voice);
	}
}
