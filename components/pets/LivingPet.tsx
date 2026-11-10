'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { spriteDef, type PetLayer } from '@/lib/pets/manifest';
import type { PetViewProps } from '@/lib/pets/presenter';

const EASE = [0.22, 0.61, 0.36, 1] as const;

function motionFor(layer: PetLayer, reduce: boolean, droop: boolean) {
	if (reduce || layer.id === 'eyesClosed') return undefined;
	if (layer.animate === 'flap') {
		return { rotate: [0, 4, 0, -4, 0] };
	}
	if (layer.animate === 'wiggle') {
		return { rotate: droop ? [0, 3, 0] : [0, 2.5, 0, -2.5, 0] };
	}
	return { y: droop ? [1, 0, 1] : [0, -3.5, 0] };
}

function transitionFor(layer: PetLayer, reduce: boolean) {
	if (reduce) return { duration: 0 };
	if (layer.animate === 'flap') return { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const };
	if (layer.animate === 'wiggle') return { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const };
	return { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const };
}

export function EggArt({ crack: _crack = 0.4 }: { crack?: number }) {
	return (
		<img src="/pets/egg/egg/body.png" alt="" className="h-full w-full object-contain" />
	);
}

export function LivingPet({
	species,
	state,
	expression = 'happy',
	resting = false,
	look = 0,
	mood = 'idle',
	brighten = 1,
}: PetViewProps) {
	const reduce = useReducedMotion();
	const [blink, setBlink] = useState(false);
	const def = spriteDef(state === 'egg' ? 'egg' : species, state === 'egg' ? 'egg' : state);
	const droop = state === 'needs_love' || expression === 'sad';
	const layers = def.layers.filter((layer) => layer.separated);

	const canBlink = layers.some((layer) => layer.id === 'eyesClosed');
	useEffect(() => {
		if (reduce || resting || !canBlink) return;
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
			}, 2600 + Math.random() * 2400);
		};
		loop();
		return () => {
			cancel = true;
			window.clearTimeout(timer);
		};
	}, [reduce, resting, canBlink]);

	return (
		<motion.div
			className="relative h-full w-full"
			animate={mood === 'pleased' && !reduce ? { y: [0, -12, 0] } : mood === 'gentle' && !reduce ? { rotate: [0, -3, 0] } : undefined}
			transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
			style={{
				rotate: look * 5 + (droop ? 5 : 0),
				transformOrigin: '50% 92%',
				filter: `saturate(${0.86 + 0.2 * brighten}) brightness(${0.9 + 0.14 * brighten})`,
			}}
		>
			{layers.map((layer) => (
				<motion.img
					key={layer.file}
					src={layer.file}
					alt=""
					draggable={false}
					className="pointer-events-none absolute inset-0 h-full w-full object-contain"
					style={{
						zIndex: layer.z,
						transformOrigin: `${layer.anchor[0] * 100}% ${layer.anchor[1] * 100}%`,
						opacity: layer.id === 'eyesClosed' ? (blink || resting ? 1 : 0) : 1,
					}}
					animate={motionFor(layer, Boolean(reduce), droop)}
					transition={transitionFor(layer, Boolean(reduce))}
				/>
			))}
		</motion.div>
	);
}
