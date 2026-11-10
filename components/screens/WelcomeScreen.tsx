'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EggArt } from '@/components/pets/PetArt';
import { Dock, DockButton } from '@/components/paper/Dock';

const EASE = [0.22, 0.61, 0.36, 1] as const;

export function WelcomeScreen({ onHatch }: { onHatch: () => void }) {
	const reduce = useReducedMotion();
	const [crack, setCrack] = useState(0.45);

	const hatch = () => {
		if (reduce) {
			onHatch();
			return;
		}
		setCrack(1);
		window.setTimeout(onHatch, 680);
	};

	return (
		<div className="page relative flex min-h-dvh flex-col">
			<div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-16 text-center">
				<h1 className="type-display text-ink">Memogotchi</h1>
				<motion.div
					className="my-10 h-56 w-44"
					animate={reduce ? undefined : { rotate: crack > 0.8 ? [0, -2, 2, 0] : [0, -1.2, 1.2, 0] }}
					transition={{ duration: crack > 0.8 ? 0.6 : 3.2, repeat: crack > 0.8 ? 0 : Infinity, ease: 'easeInOut' }}
				>
					<EggArt crack={crack} />
				</motion.div>
				<p className="max-w-[16rem] type-heading leading-snug text-ink">
					Keep a little life by practicing a little every day.
				</p>
			</div>
			<Dock>
				<DockButton onClick={hatch} className="w-56">
					<motion.span
						animate={reduce || crack < 0.9 ? undefined : { opacity: [1, 0.7, 1] }}
						transition={{ duration: 0.4, ease: EASE }}
					>
						Hatch
					</motion.span>
				</DockButton>
			</Dock>
		</div>
	);
}
