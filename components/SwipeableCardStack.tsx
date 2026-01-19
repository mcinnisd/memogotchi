'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { submitReview } from "@/actions/submitReview";
import { generateNextDeck } from "@/actions/generateNextDeck";
import Flashcard from "./Flashcard";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface SwipeableCardStackProps {
	initialCards: any[];
	userId: string;
	onPetReaction: (sentiment: 'happy' | 'sad' | 'strain' | 'normal') => void;
	onSwipe?: () => void;
	currentTopic?: string;
}

export default function SwipeableCardStack({ initialCards, userId, onPetReaction, onSwipe, currentTopic }: SwipeableCardStackProps) {
	const [cards, setCards] = useState(initialCards);
	const [activeIndex, setActiveIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [wasFlipped, setWasFlipped] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [prefetching, setPrefetching] = useState(false);
	const cardStartTime = useRef<number>(Date.now());
	const { trigger } = useHaptic();
	const router = useRouter();

	// Motion values for the active card
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const controls = useAnimation();

	// Rotation based on X drag (tilt)
	const rotate = useTransform(x, [-200, 200], [-15, 15]);

	// Background/Feedback Opacity Indicators
	const opacityRight = useTransform(x, [50, 150], [0, 1]);
	const opacityLeft = useTransform(x, [-50, -150], [0, 1]);
	const opacityUp = useTransform(y, [-50, -150], [0, 1]);
	const opacityDown = useTransform(y, [50, 150], [0, 1]);

	const activeCard = cards[activeIndex];
	const topic = activeCard?.decks?.topic || currentTopic || 'Learning';

	// Reset timing when card changes
	useEffect(() => {
		cardStartTime.current = Date.now();
		setWasFlipped(false);
	}, [activeIndex]);

	// Track flip state
	const handleFlip = useCallback(() => {
		setIsFlipped(!isFlipped);
		if (!wasFlipped) setWasFlipped(true);
	}, [isFlipped, wasFlipped]);

	// Pre-fetch next deck when 3 cards remaining
	useEffect(() => {
		const cardsRemaining = cards.length - activeIndex;
		if (cardsRemaining === 3 && !prefetching) {
			setPrefetching(true);
			generateNextDeck(userId, topic).then(() => {
				setPrefetching(false);
			}).catch(console.error);
		}
	}, [activeIndex, cards.length, userId, topic, prefetching]);

	const handleDragEnd = async (_: any, info: PanInfo) => {
		const threshold = 100;

		if (info.offset.x > threshold) {
			await completeSwipe(5, { x: 500, y: 0 });
		} else if (info.offset.x < -threshold) {
			await completeSwipe(3, { x: -500, y: 0 });
		} else if (info.offset.y < -threshold) {
			await completeSwipe(4, { x: 0, y: -500 });
		} else if (info.offset.y > threshold) {
			await completeSwipe(1, { x: 0, y: 500 });
		} else {
			controls.start({ x: 0, y: 0 });
			onPetReaction('normal');
		}
	};

	const handleDrag = (_: any, info: PanInfo) => {
		if (info.offset.x > 50) onPetReaction('happy');
		else if (info.offset.x < -50) onPetReaction('strain');
		else if (info.offset.y < -50) onPetReaction('happy');
		else if (info.offset.y > 50) onPetReaction('sad');
		else onPetReaction('normal');
	};

	const completeSwipe = async (grade: number, exitVelocity: { x: number, y: number }) => {
		if (!activeCard) return;

		// Calculate response time
		const responseTimeMs = Date.now() - cardStartTime.current;

		if (grade === 1) trigger('error');
		else if (grade === 5) trigger('success');
		else trigger('medium');

		await controls.start({
			x: exitVelocity.x,
			y: exitVelocity.y,
			opacity: 0,
			transition: { duration: 0.2 }
		});

		// Submit review with learning signals
		submitReview(userId, activeCard.id, grade, topic, {
			responseTimeMs,
			wasFlipped,
			cardDifficulty: activeCard.difficulty ?? 5
		}).catch(console.error);

		setIsFlipped(false);

		// Trigger parent callback for boss encounters
		if (onSwipe) onSwipe();

		const nextIndex = activeIndex + 1;
		if (nextIndex < cards.length) {
			x.set(0);
			y.set(0);
			setActiveIndex(nextIndex);
			controls.set({ x: 0, y: 0, opacity: 1 });
			onPetReaction('normal');
		} else {
			// Deck Complete
			trigger('success');
			confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

			// Generate next deck
			setGenerating(true);
			await generateNextDeck(userId, topic);

			// Refresh page to get new cards
			router.refresh();
		}
	};

	// Empty/Loading State
	if (!activeCard) {
		if (generating) {
			return (
				<div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4">
					<Loader2 size={32} className="animate-spin text-green-500" />
					<p className="text-sm">Generating new cards...</p>
				</div>
			);
		}
		return (
			<div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4">
				<p className="text-4xl">🎉</p>
				<p className="text-sm">All caught up!</p>
				<p className="text-xs text-zinc-600">Come back later or add a new subject.</p>
			</div>
		);
	}

	return (
		<div className="relative w-full max-w-[320px] aspect-[3/4] mx-auto z-10">
			{/* Underlay Indicators (Visible when dragging) */}
			<motion.div style={{ opacity: opacityRight }} className="absolute inset-0 bg-green-500/20 rounded-3xl z-0 flex items-center justify-end pr-8 pointer-events-none">
				<span className="text-4xl font-black text-green-500 uppercase rotate-12">EASY</span>
			</motion.div>
			<motion.div style={{ opacity: opacityLeft }} className="absolute inset-0 bg-yellow-500/20 rounded-3xl z-0 flex items-center justify-start pl-8 pointer-events-none">
				<span className="text-4xl font-black text-yellow-500 uppercase -rotate-12">HARD</span>
			</motion.div>
			<motion.div style={{ opacity: opacityUp }} className="absolute inset-0 bg-blue-500/20 rounded-3xl z-0 flex items-start justify-center pt-8 pointer-events-none">
				<span className="text-4xl font-black text-blue-500 uppercase">GOOD</span>
			</motion.div>
			<motion.div style={{ opacity: opacityDown }} className="absolute inset-0 bg-red-500/20 rounded-3xl z-0 flex items-end justify-center pb-8 pointer-events-none">
				<span className="text-4xl font-black text-red-500 uppercase">AGAIN</span>
			</motion.div>

			{/* The Card */}
			<motion.div
				key={activeCard.id}
				drag={true}
				dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Constraints 0 allows drag but elastic snap back
				dragElastic={0.6} // Rubber band effect
				onDrag={handleDrag}
				onDragEnd={handleDragEnd}
				animate={controls}
				style={{ x, y, rotate, touchAction: "none" }}
				className="w-full h-full relative cursor-grab active:cursor-grabbing z-20"
			>
				<Flashcard
					content={activeCard.content || { question: activeCard.front, answer: activeCard.back }}
					isFlipped={isFlipped}
					onFlip={() => setIsFlipped(!isFlipped)}
				/>
			</motion.div>

			{/* Back Stack Visuals (Cards behind) */}
			{activeIndex + 1 < cards.length && (
				<div className="absolute top-2 left-2 w-full h-full bg-zinc-800 rounded-3xl border border-zinc-700 -z-10 scale-95" />
			)}
			{activeIndex + 2 < cards.length && (
				<div className="absolute top-4 left-4 w-full h-full bg-zinc-900 rounded-3xl border border-zinc-800 -z-20 scale-90" />
			)}
		</div>
	);
}
