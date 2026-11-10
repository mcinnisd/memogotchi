'use server';

import { createClient } from '@/utils/supabase/server';
import { isDemoMode } from '@/lib/runtime';
import { DEMO_USER_ID } from '@/lib/demo/store';

export interface SessionResult {
	mode: 'demo' | 'supabase';
	id: string | null;
	email: string | null;
	anonymous: boolean;
	error?: string;
}

export async function ensureSession(): Promise<SessionResult> {
	if (isDemoMode()) {
		return { mode: 'demo', id: DEMO_USER_ID, email: null, anonymous: true };
	}

	const supabase = await createClient();
	const { data: existing } = await supabase.auth.getUser();
	if (existing.user) {
		await ensureProfile(existing.user.id);
		return {
			mode: 'supabase',
			id: existing.user.id,
			email: existing.user.email ?? null,
			anonymous: Boolean((existing.user as { is_anonymous?: boolean }).is_anonymous),
		};
	}

	const { data, error } = await supabase.auth.signInAnonymously();
	if (error || !data.user) {
		return {
			mode: 'supabase',
			id: null,
			email: null,
			anonymous: true,
			error: error?.message ?? 'Sign-in failed',
		};
	}
	await ensureProfile(data.user.id);
	return { mode: 'supabase', id: data.user.id, email: data.user.email ?? null, anonymous: true };
}

export async function ensureProfile(userId: string) {
	if (isDemoMode()) return;
	const supabase = await createClient();
	const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
	if (data) return;
	await supabase.from('profiles').insert({
		id: userId,
		current_streak: 0,
		last_study_date: null,
		updated_at: new Date().toISOString(),
	});
}

export async function sendMagicLink(email: string): Promise<{ ok: boolean; message: string }> {
	const trimmed = email.trim();
	if (!trimmed.includes('@')) return { ok: false, message: 'That does not look like an email.' };
	if (isDemoMode()) {
		return { ok: false, message: 'Connect Supabase when you want this nest on another device.' };
	}

	const supabase = await createClient();
	const origin = process.env.NEXT_PUBLIC_SITE_URL;
	const redirect = origin ? `${origin}/auth/callback` : undefined;
	const { data: current } = await supabase.auth.getUser();

	const { error } = current.user
		? await supabase.auth.updateUser(redirect ? { email: trimmed } : { email: trimmed }, redirect ? { emailRedirectTo: redirect } : undefined)
		: await supabase.auth.signInWithOtp({
			email: trimmed,
			options: redirect ? { emailRedirectTo: redirect } : undefined,
		});

	if (error) return { ok: false, message: 'The link could not be sent. Try again in a moment.' };
	return { ok: true, message: 'Check your email. The link keeps this same nest.' };
}
