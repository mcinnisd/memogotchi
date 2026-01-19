'use client';

import { useCallback } from 'react';

type HapticType = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy';

export function useHaptic() {
	const trigger = useCallback((type: HapticType) => {
		// Check if navigator.vibrate is supported
		if (typeof navigator === 'undefined' || !navigator.vibrate) return;

		switch (type) {
			case 'success':
				// Two short pulses
				navigator.vibrate([50, 50, 50]);
				break;
			case 'warning':
				navigator.vibrate([100]);
				break;
			case 'error':
				// Long heavy vibration
				navigator.vibrate([200, 100, 200]);
				break;
			case 'light':
				navigator.vibrate(10);
				break;
			case 'medium':
				navigator.vibrate(20);
				break;
			case 'heavy':
				navigator.vibrate(40);
				break;
		}
	}, []);

	return { trigger };
}
