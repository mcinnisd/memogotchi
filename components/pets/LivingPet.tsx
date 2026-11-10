'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { SpeciesId } from '@/lib/species';
import type { SpriteState } from '@/lib/care/types';
import { PetArt } from '@/components/pets/PetArt';

const EASE = [0.22, 0.61, 0.36, 1] as const;

export function LivingPet({
	species,
	state,
	expression = 'happy',
	resting = false,
	look = 0,
	mood = 'idle',
	brighten = 1,
}: {
	species: SpeciesId;
	state: SpriteState;
	expression?: 'happy' | 'soft' | 'sad';
	resting?: boolean;
	look?: number;
	mood?: 'idle' | 'watching' | 'pleased' | 'gentle';
	brighten?: number;
}) {
	const reduce = useReducedMotion();
	const [blink, setBlink] = useState(false);

	useEffect(() => {
		if (reduce || resting) return;
		let cancel = false;
		let timer = 0;
		const loop = () => {
			timer = window.setTimeout(() => {
				if (cancel) return;
				setBlink(true);
				window.setTimeout(() => {
					if (!cancel) setBlink(false);
				}, 140);
				loop();
			}, 2800 + Math.random() * 2200);
		};
		loop();
		return () => {
			cancel = true;
			window.clearTimeout(timer);
		};
	}, [reduce, resting]);

	const breathe = reduce || mood === 'pleased' || mood === 'gentle'
		? { y: 0 }
		: { y: [0, -3, 0] };

	return (
		<motion.div
			className="living-pet h-full w-full"
			animate={mood === 'pleased' && !reduce ? { y: [0, -8, 0] } : mood === 'gentle' && !reduce ? { rotate: [0, -4, 0] } : breathe}
			transition={mood === 'pleased' || mood === 'gentle'
				? { duration: reduce ? 0 : 0.45, ease: EASE }
				: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
			style={{
				rotate: look * 6,
				filter: `saturate(${0.72 + 0.28 * brighten}) brightness(${0.9 + 0.12 * brighten})`,
			}}
		>
			<PetArt species={species} state={state} expression={expression} resting={resting || blink} />
		</motion.div>
	);
}
