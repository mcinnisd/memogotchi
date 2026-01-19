'use server';

import { createClient } from '@/utils/supabase/server';
import { Profile } from '@/lib/types';

const STAGE_THRESHOLDS = {
	egg: 0,
	baby: 100,
	child: 500,
	adult: 1500,
};

export async function updatePetState(userId: string, grade: number) {
	const supabase = await createClient();

	// 1. Fetch current profile
	const { data: profile, error: fetchError } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	if (fetchError || !profile) {
		console.error('Error fetching profile:', fetchError);
		throw new Error('Profile not found');
	}

	let { xp, health, stage } = profile as Profile;
	let hasChanged = false;

	// 2. Logic: XP and Health updates (Revised Incentives)
	// Goal: Promote "Good" (active recall) over "Easy" (passive/spamming)
	// Fail (<=1): -10 Health (High stakes)
	// Hard (3): +10 XP (Reward effort)
	// Good (4): +20 XP (Target zone - Desirable Difficulty)
	// Easy (5): +5 XP (Diminished return)

	if (grade === 4) {
		xp += 20;
		hasChanged = true;
	} else if (grade === 3) {
		xp += 10;
		hasChanged = true;
	} else if (grade >= 5) {
		xp += 5;
		hasChanged = true;
	} else if (grade <= 1) {
		health = Math.max(0, health - 10);
		hasChanged = true;
	}

	// 3. Logic: Level Up (Stage evolution)
	// Check current stage and see if we crossed a threshold for the NEXT stage
	let newStage = stage;
	if (stage === 'egg' && xp >= STAGE_THRESHOLDS.baby) newStage = 'baby';
	else if (stage === 'baby' && xp >= STAGE_THRESHOLDS.child) newStage = 'child';
	else if (stage === 'child' && xp >= STAGE_THRESHOLDS.adult) newStage = 'adult';

	if (newStage !== stage) {
		stage = newStage;
		hasChanged = true;
		// Optional: Restore health on evolution?
		health = 100;
	}

	// 4. Update Database
	if (hasChanged) {
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ xp, health, stage, updated_at: new Date().toISOString() })
			.eq('id', userId);

		if (updateError) {
			throw new Error(`Failed to update pet state: ${updateError.message}`);
		}
	}

	return {
		success: true,
		newState: { xp, health, stage },
		evolved: newStage !== (profile as Profile).stage
	};
}
