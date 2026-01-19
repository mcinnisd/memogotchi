"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface RetroCardProps {
	frontContent?: React.ReactNode;
	backContent?: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
}

export function RetroCard({
	frontContent = "FRONT",
	backContent = "BACK",
	className = "",
	style
}: RetroCardProps) {
	const [isFlipped, setIsFlipped] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	const handleFlip = () => {
		if (!isAnimating) {
			setIsFlipped(!isFlipped);
			setIsAnimating(true);
		}
	};

	return (
		<div
			className={`w-[300px] h-[450px] cursor-pointer perspective-1000 group font-mono ${className}`}
			onClick={handleFlip}
			style={style}
		>
			<motion.div
				className="w-full h-full relative preserve-3d"
				initial={false}
				animate={{ rotateY: isFlipped ? 180 : 0 }}
				transition={{ duration: 0.6 }}
				onAnimationComplete={() => setIsAnimating(false)}
				style={{ transformStyle: "preserve-3d" }}
			>
				{/* Front Face */}
				<div
					className="absolute inset-0 backface-hidden w-full h-full bg-black border-4 border-gray-600 flex flex-col items-center justify-center p-4 shadow-[4px_4px_0_#444]"
					style={{ backfaceVisibility: 'hidden' }}
				>
					<div className="border-2 border-retro-green w-full h-full flex items-center justify-center p-2">
						<span className="text-retro-green text-2xl animate-pulse">{frontContent}</span>
					</div>
					<div className="absolute bottom-2 right-2 text-[10px] text-gray-500">ID: 001</div>
				</div>

				{/* Back Face */}
				<div
					className="absolute inset-0 backface-hidden w-full h-full bg-gray-800 border-4 border-gray-600 flex items-center justify-center p-4 rotate-y-180"
					style={{
						backfaceVisibility: 'hidden',
						transform: 'rotateY(180deg)'
					}}
				>
					<div className="w-full h-full bg-[repeating-linear-gradient(45deg,#333_25%,transparent_25%,transparent_75%,#333_75%,#333),repeating-linear-gradient(45deg,#333_25%,#222_25%,#222_75%,#333_75%,#333)] bg-[length:10px_10px] flex items-center justify-center border-2 border-white">
						<span className="bg-black text-white px-2 py-1 font-display text-xs">{backContent}</span>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
