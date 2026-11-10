import { calendarDaysBetween, utcDayKey } from '@/lib/care/homey';

export interface StreakState {
	current_streak: number;
	last_study_date: string | null;
}

/** Daily "you showed up" streak. Calling twice on the same UTC day is a no-op. */
export function nextStreak(state: StreakState, now: Date): StreakState & { changed: boolean } {
	const today = utcDayKey(now);
	if (state.last_study_date && utcDayKey(new Date(state.last_study_date)) === today) {
		return { ...state, changed: false };
	}
	let streak = 1;
	if (state.last_study_date) {
		const gap = calendarDaysBetween(new Date(state.last_study_date), now);
		streak = gap === 1 ? state.current_streak + 1 : 1;
	}
	return {
		current_streak: streak,
		last_study_date: now.toISOString(),
		changed: true,
	};
}
