'use client';

import { useState, useEffect } from "react";
import { Card } from "@/lib/types";
import { submitReview } from "@/actions/submitReview";
import { generateNextDeck } from "@/actions/generateNextDeck";
import Flashcard from "@/components/Flashcard";
import ControlPad from "@/components/ControlPad";
import { useRouter } from "next/navigation";
import { useHaptic } from "@/hooks/useHaptic";
import confetti from "canvas-confetti";

interface StudySessionProps {
	initialCards: any[]; // Using any for enriched card type for now
	userId: string;
}

export default function StudySession({ initialCards, userId }: StudySessionProps) {
	const [cards, setCards] = useState<any[]>(initialCards);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [isGrading, setIsGrading] = useState(false);
	const [sessionComplete, setSessionComplete] = useState(false);
	const router = useRouter();
	const { trigger } = useHaptic();

	const currentCard = cards[currentIndex];

	const handleGrade = async (grade: number) => {
		if (isGrading || !currentCard) return;
		setIsGrading(true);

		try {
			// Get topic from card's deck
			const topic = currentCard.decks?.topic || 'Learning';

			await submitReview(userId, currentCard.id, grade, topic);

			// Animation delay
			setTimeout(() => {
				setIsFlipped(false);
				if (currentIndex < cards.length - 1) {
					setCurrentIndex(prev => prev + 1);
				} else {
					// End of deck
					setSessionComplete(true);
					trigger('success');
					confetti({
						particleCount: 100,
						spread: 70,
						origin: { y: 0.6 }
					});
				}
				setIsGrading(false);
			}, 300);

		} catch (e) {
			console.error(e);
			trigger('error');
			setIsGrading(false);
		}
	};

	const handleFinish = async () => {
		// Generate next deck or go home
		// router.push('/');
		try {
			// Trigger adaptive generation in background?
			await generateNextDeck(userId, currentCard?.deck?.topic || 'Spanish');
			router.push('/');
		} catch (e) {
			router.push('/');
		}
	};

	if (sessionComplete) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-6 animate-in zoom-in duration-300">
				<h2 className="text-3xl font-bold text-green-400">SESSION COMPLETE!</h2>
				<div className="text-6xl">🎉</div>
				<p className="text-zinc-500">Good job!</p>
				<button
					onClick={handleFinish}
					className="bg-green-500 text-black px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform"
				>
					Return Home
				</button>
			</div>
		);
	}

	if (cards.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
				<p className="text-zinc-500">No cards due for review.</p>
				<button onClick={() => router.push('/')} className="text-green-400 underline">Back</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-[calc(100vh-80px)] justify-between">
			{/* Progress Bar */}
			<div className="px-6 py-4">
				<div className="w-full h-1 bg-zinc-900 rounded-full">
					<div
						className="h-full bg-green-500 rounded-full transition-all duration-300"
						style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
					></div>
				</div>
				<p className="text-center text-xs text-zinc-600 mt-2 uppercase tracking-widest">
					Card {currentIndex + 1} of {cards.length}
				</p>
			</div>

			{/* Card Area */}
			<div className="flex-1 px-4 flex items-center justify-center">
				{currentCard && (
					<Flashcard
						key={currentCard.id}
						content={currentCard.content || {
							question: currentCard.front || '?',
							answer: currentCard.back || '?'
						}}
						isFlipped={isFlipped}
						onFlip={() => setIsFlipped(!isFlipped)}
					/>
				)}
			</div>

			{/* Controls */}
			<div className={`transition-opacity duration-300 ${isFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-50 pointer-events-none grayscale'}`}>
				<ControlPad onGrade={handleGrade} disabled={!isFlipped || isGrading} />
			</div>
		</div>
	);
}
