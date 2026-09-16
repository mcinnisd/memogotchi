'use client';

import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface PetDisplayProps {
	health: number;
	xp: number;
	stage: string;
	name: string;
	sentiment?: 'happy' | 'sad' | 'strain' | 'normal';
}

function stageEmoji(stage: string): string {
	switch (stage.toLowerCase()) {
		case 'baby':
			return '👾';
		case 'child':
			return '🦖';
		case 'adult':
			return '🐉';
		case 'egg':
		default:
			return '🥚';
	}
}

export default function PetDisplay({
	health,
	xp,
	stage,
	name,
	sentiment = 'normal',
}: PetDisplayProps) {
	const hearts = Math.ceil(health / 20);
	const level = Math.floor(xp / 100) + 1;

	const bounce =
		sentiment === 'happy'
			? [0, -12, 0]
			: sentiment === 'sad'
				? [0, 4, 0]
				: sentiment === 'strain'
					? [0, -4, 0, 4, 0]
					: [0, -8, 0];

	return (
		<div className="flex flex-col items-center justify-center space-y-3">
			<div className="relative w-32 h-32 bg-zinc-900/50 rounded-full border-2 border-zinc-800 flex items-center justify-center">
				<motion.div
					animate={{ y: bounce }}
					transition={{ repeat: Infinity, duration: sentiment === 'strain' ? 0.6 : 2, ease: 'easeInOut' }}
					className="text-5xl"
				>
					{stageEmoji(stage)}
				</motion.div>
			</div>

			<div className="flex flex-col items-center space-y-2">
				<h2 className="text-lg font-bold text-green-400 font-mono tracking-tighter uppercase">
					{name}
				</h2>
				<div className="flex items-center space-x-4 text-xs">
					<div className="flex items-center space-x-1">
						{[...Array(5)].map((_, i) => (
							<Heart
								key={i}
								size={12}
								className={i < hearts ? 'fill-red-500 text-red-500' : 'text-zinc-700'}
							/>
						))}
					</div>
					<span className="text-zinc-500 font-mono uppercase">{stage}</span>
					<span className="text-zinc-500 font-mono">LVL {level}</span>
					<div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${Math.min(100, xp % 100)}%` }}
							className="h-full bg-green-500 rounded-full"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
