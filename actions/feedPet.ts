'use server';

import { createClient } from '@/utils/supabase/server';

export async function feedPet(userId: string) {
	const supabase = await createClient();

	// 1. Get current profile stats
	const { data: profile, error: fetchError } = await supabase
		.from('Profiles')
		.select('coins, health, xp')
		.eq('id', userId)
		.single();

	if (fetchError || !profile) {
		throw new Error('User not found');
	}

	const cost = 50;
	if (profile.coins < cost) {
		return { success: false, message: 'Not enough coins!' };
	}

	// 2. Calculate new stats
	const newCoins = profile.coins - cost;
	const newHealth = Math.min(100, profile.health + 20);
	const newXp = profile.xp + 5;

	// 3. Update DB
	const { error: updateError } = await supabase
		.from('Profiles')
		.update({
			coins: newCoins,
			health: newHealth,
			xp: newXp,
			updated_at: new Date().toISOString()
		})
		.eq('id', userId);

	if (updateError) {
		throw new Error('Failed to feed pet');
	}

	return { success: true, newStats: { coins: newCoins, health: newHealth, xp: newXp } };
}
