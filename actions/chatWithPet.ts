'use server';

export async function chatWithPet(message: string, context?: string) {
	const XAI_API_KEY = process.env.XAI_API_KEY;
	if (!XAI_API_KEY) throw new Error('XAI_API_KEY not defined');

	// Determine Persona based on context or default
	// Ideally we pass pet type/name here too.
	const systemPrompt = `
      You are a digital pet (Memogotchi) helping your owner learn.
      Your personality is cute, helpful, but slightly glitchy/cyberpunk.
      Keep responses short (under 50 words) and styled like a game dialogue.
      Current Learning Context: ${context || 'General Chat'}
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
					{ role: 'user', content: message },
				],
				model: process.env.XAI_MODEL || 'grok-beta',
				stream: false
			}),
		});

		if (!response.ok) throw new Error('xAI API failed');
		const data = await response.json();
		return data.choices[0].message.content;

	} catch (e) {
		console.error(e);
		return "I... I can't connect to the mainframe right now. *sad beep*";
	}
}
