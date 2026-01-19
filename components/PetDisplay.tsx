'use client';

import { Heart } from "lucide-react";
import { motion } from "framer-motion";

interface PetDisplayProps {
	health: number; // 0-100
	xp: number;     // Current XP
	stage: string;  // 'Egg', 'Baby', 'Teen', 'Adult'
	name: string;
}

export default function PetDisplay({ health, xp, stage, name }: PetDisplayProps) {
	// Calculate Hearts (1 Heart = 20 Health, Max 5)
	const hearts = Math.ceil(health / 20);
	const level = Math.floor(xp / 100) + 1;

	return (
		<div className="flex flex-col items-center justify-center space-y-4">
			{/* Pet Sprite Area - Compact */}
			<div className="relative w-36 h-36 bg-zinc-900/50 rounded-full border-2 border-zinc-800 flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.1)]">
				{/* The Pet */}
				<motion.div
					animate={{ y: [0, -8, 0] }}
					transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
					className="text-5xl filter drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
				>
					{stage.toLowerCase() === 'egg' && '🥚'}
					{stage.toLowerCase() === 'baby' && '👾'}
					{stage.toLowerCase() === 'teen' && '🦖'}
					{stage.toLowerCase() === 'adult' && '🐉'}
				</motion.div>
			</div>

			{/* Name & Stats Row - Compact */}
			<div className="flex flex-col items-center space-y-2">
				<h2 className="text-lg font-bold text-green-400 font-mono tracking-tighter uppercase">{name}</h2>

				{/* Compact Stats Row */}
				<div className="flex items-center space-x-4 text-xs">
					{/* Hearts */}
					<div className="flex items-center space-x-1">
						{[...Array(5)].map((_, i) => (
							<Heart
								key={i}
								size={12}
								className={i < hearts ? "fill-red-500 text-red-500" : "text-zinc-700"}
							/>
						))}
					</div>

					{/* Level */}
					<span className="text-zinc-500 font-mono">LVL {level}</span>

					{/* XP Bar */}
					<div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${Math.min(100, (xp % 100))}%` }}
							className="h-full bg-green-500 rounded-full"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
