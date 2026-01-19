"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { RetroCard } from "./RetroCard";

// Mock data for initial deck
const INITIAL_CARDS = [
	{ id: 1, front: "What is SRS?", back: "Spaced Repetition System" },
	{ id: 2, front: "React Key Prop", back: "Uniquely identifies elements" },
	{ id: 3, front: "Next.js Image", back: "Automatic optimization" },
	{ id: 4, front: "Tailwind", back: "Utility-first CSS framework" },
	{ id: 5, front: "TypeScript", back: "Static type checker for JS" },
];

export function SwipeableDeck() {
	const [cards, setCards] = useState(INITIAL_CARDS);
	const [swipeResult, setSwipeResult] = useState<string | null>(null);

	// If no cards left
	if (cards.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-retro-green">
				<h2 className="text-2xl font-display mb-4">ALL CLEAR</h2>
				<button
					onClick={() => setCards(INITIAL_CARDS)}
					className="px-6 py-2 border-2 border-retro-green hover:bg-retro-green hover:text-black transition-colors font-mono"
				>
					RESET DECK
				</button>
			</div>
		);
	}

	// We only render the top few cards for performance
	const activeCards = cards.slice(0, 2).reverse(); // Reverse so first index acts as top

	return (
		<div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
			{/* Swipe Feedback Overlay */}
			{swipeResult && (
				<div className="absolute top-10 z-50 animate-bounce">
					<span className="text-4xl font-display text-white bg-black px-4 py-2 border-4 border-white transform -rotate-6 shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
						{swipeResult}
					</span>
				</div>
			)}

			{activeCards.map((card, index) => {
				const isTop = index === activeCards.length - 1;
				return (
					<DraggableCard
						key={card.id}
						card={card}
						isTop={isTop}
						onSwipe={(result) => {
							setSwipeResult(result);
							setCards((prev) => prev.slice(1));
							setTimeout(() => setSwipeResult(null), 1000);
						}}
					/>
				);
			})}
		</div>
	);
}

interface DraggableCardProps {
	card: { id: number; front: string; back: string };
	isTop: boolean;
	onSwipe: (result: string) => void;
}

function DraggableCard({ card, isTop, onSwipe }: DraggableCardProps) {
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const controls = useAnimation();

	// Rotate based on X drag to simulate physics
	const rotate = useTransform(x, [-200, 200], [-25, 25]);

	// Opacity for stamps (optional visual feedback while dragging)
	const opacityRight = useTransform(x, [50, 150], [0, 1]);
	const opacityLeft = useTransform(x, [-50, -150], [0, 1]);
	const opacityUp = useTransform(y, [-50, -150], [0, 1]);
	const opacityDown = useTransform(y, [50, 150], [0, 1]);

	const handleDragEnd = async (_: unknown, info: PanInfo) => {
		const threshold = 100;

		if (info.offset.x > threshold) {
			// Swipe Right -> GOOD
			await controls.start({ x: 500, opacity: 0 });
			onSwipe("GOOD");
		} else if (info.offset.x < -threshold) {
			// Swipe Left -> AGAIN
			await controls.start({ x: -500, opacity: 0 });
			onSwipe("AGAIN");
		} else if (info.offset.y < -threshold) {
			// Swipe Up -> EASY
			await controls.start({ y: -500, opacity: 0 });
			onSwipe("EASY");
		} else if (info.offset.y > threshold) {
			// Swipe Down -> HARD
			await controls.start({ y: 500, opacity: 0 });
			onSwipe("HARD");
		} else {
			// Reset
			controls.start({ x: 0, y: 0, opacity: 1 });
		}
	};

	return (
		<motion.div
			style={{
				x: isTop ? x : 0,
				y: isTop ? y : 0,
				rotate: isTop ? rotate : 0,
				zIndex: isTop ? 10 : 0
			}}
			drag={isTop ? true : false}
			dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
			onDragEnd={handleDragEnd}
			animate={controls}
			className={`absolute top-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
		>
			{/* Visual Feedback Stamps while dragging */}
			{isTop && (
				<>
					<motion.div style={{ opacity: opacityRight }} className="absolute top-8 left-8 z-20 pointer-events-none transform -rotate-12 border-4 border-green-500 text-green-500 font-display text-4xl px-2">GOOD</motion.div>
					<motion.div style={{ opacity: opacityLeft }} className="absolute top-8 right-8 z-20 pointer-events-none transform rotate-12 border-4 border-red-500 text-red-500 font-display text-4xl px-2">AGAIN</motion.div>
					<motion.div style={{ opacity: opacityUp }} className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none border-4 border-blue-500 text-blue-500 font-display text-4xl px-2">EASY</motion.div>
					<motion.div style={{ opacity: opacityDown }} className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none border-4 border-orange-500 text-orange-500 font-display text-4xl px-2">HARD</motion.div>
				</>
			)}

			<RetroCard
				frontContent={card.front}
				backContent={card.back}
				className={!isTop ? "scale-[0.98] opacity-50 translate-y-4 pointer-events-none" : "shadow-xl"}
			/>
		</motion.div>
	);
}
