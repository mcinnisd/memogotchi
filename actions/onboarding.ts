'use server';

import { createClient } from '@/utils/supabase/server';

export async function initializeUser(
	userId: string,
	petName: string,
	petType: string,
	goals: string[]
) {
	const supabase = await createClient();

	const { error } = await supabase.from('profiles').upsert({
		id: userId,
		pet_name: petName,
		pet_type: petType,
		learning_goals: goals,
		xp: 0,
		health: 100,
		coins: 0,
		current_streak: 0,
		stage: 'egg',
		updated_at: new Date().toISOString(),
	});

	if (error) {
		throw new Error(`Failed to init user: ${error.message}`);
	}
	return { success: true };
}
