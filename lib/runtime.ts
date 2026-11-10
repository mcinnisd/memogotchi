export function isDemoMode(): boolean {
	if (process.env.NEXT_PUBLIC_DEMO === '1') return true;
	if (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test') return false;
	return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function hasSupabaseEnv(): boolean {
	return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
