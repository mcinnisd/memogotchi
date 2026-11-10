'use server';

import { ensureProfile } from '@/actions/session';

export async function initializeUser(userId: string) {
	await ensureProfile(userId);
	return { success: true };
}
