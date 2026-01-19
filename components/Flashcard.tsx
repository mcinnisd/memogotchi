'use client';

// import { useState } from "react";
import { motion } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import clsx from "clsx";

interface FlashcardProps {
	content: {
		question: string;
		answer: string;
		explanation?: string;
		type?: string;
		options?: string[];
	};
	isFlipped: boolean;
	onFlip: () => void;
}

export default function Flashcard({ content, isFlipped, onFlip }: FlashcardProps) {
	const { trigger } = useHaptic();

	const handleFlip = () => {
		trigger('light');
		onFlip();
	};

	return (
		<div className="w-full aspect-[3/4] max-h-[500px] perspective-1000 my-4" onClick={handleFlip}>
			<motion.div
				className="w-full h-full relative preserve-3d cursor-pointer"
				animate={{ rotateY: isFlipped ? 180 : 0 }}
				transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
				style={{ transformStyle: 'preserve-3d' }}
			>
				{/* FRONT */}
				<div
					className={clsx(
						"absolute inset-0 w-full h-full backface-hidden",
						"bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center",
						"shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
					)}
					style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
				>
					<span className="absolute top-6 left-6 text-xs text-zinc-600 uppercase tracking-widest font-bold">Question</span>
					<p className="text-2xl font-medium text-zinc-100 leading-relaxed font-mono">
						{content.question}
					</p>
					<span className="absolute bottom-6 text-xs text-zinc-700 uppercase tracking-widest animate-pulse">Tap to Flip</span>
				</div>

				{/* BACK */}
				<div
					className={clsx(
						"absolute inset-0 w-full h-full backface-hidden",
						"bg-zinc-900 border-2 border-green-900/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center",
						"shadow-[0_0_30px_rgba(74,222,128,0.1)]"
					)}
					style={{
						transform: 'rotateY(180deg)',
						backfaceVisibility: 'hidden',
						WebkitBackfaceVisibility: 'hidden'
					}}
				>
					<span className="absolute top-6 left-6 text-xs text-green-700 uppercase tracking-widest font-bold">Answer</span>

					<p className="text-3xl font-bold text-green-400 mb-6 font-mono">
						{content.answer}
					</p>

					{content.explanation && (
						<p className="text-sm text-zinc-400 leading-relaxed max-w-[90%] border-t border-zinc-800 pt-4 mt-2">
							{content.explanation}
						</p>
					)}
				</div>
			</motion.div>
		</div>
	);
}
