'use client';

import { useState, useCallback } from "react";
import PetDisplay from "@/components/PetDisplay";
import SwipeableCardStack from "@/components/SwipeableCardStack";
import SubjectSelector from "@/components/SubjectSelector";
import AIChatOverlay from "@/components/AIChatOverlay";
import BossFightModal from "@/components/BossFightModal";
import { MessageCircle, Apple, BarChart3, Menu } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { useRouter } from "next/navigation";
import { generateBossEncounter } from "@/actions/bossFight";

interface HomeLoopProps {
	initialProfile: any;
	initialCards: any[];
	decks: any[];
	userId: string;
	activeTopic?: string;
}

export default function HomeLoop({ initialProfile, initialCards, decks, userId, activeTopic }: HomeLoopProps) {
	const [petSentiment, setPetSentiment] = useState<'happy' | 'sad' | 'strain' | 'normal'>('normal');
	const [showSubjectSelector, setShowSubjectSelector] = useState(false);
	const [showChat, setShowChat] = useState(false);
	const [showBoss, setShowBoss] = useState(false);
	const [bossQuestions, setBossQuestions] = useState<any[]>([]);
	const [bossLoading, setBossLoading] = useState(false);
	const router = useRouter();
	const { trigger } = useHaptic();

	// Use the active topic from props
	const currentTopic = activeTopic || initialCards[0]?.decks?.topic || decks[0]?.topic || 'Memogotchi';

	// Navigate to different topic via URL
	const handleDeckSelect = (deckId: string) => {
		const selectedDeck = decks.find((d: any) => d.id === deckId);
		if (selectedDeck) {
			trigger('light');
			setShowSubjectSelector(false);
			// Navigate to topic-specific URL
			router.push(`/?topic=${encodeURIComponent(selectedDeck.topic)}`);
		}
	};

	// Random Boss Trigger
	const handleSwipe = useCallback(async () => {
		// 10% chance to trigger boss
		if (Math.random() < 0.1) {
			setBossLoading(true);
			try {
				const result = await generateBossEncounter(userId, currentTopic);
				if (result.available && result.questions) {
					setBossQuestions(result.questions);
					setShowBoss(true);
				}
			} catch (err) {
				console.error("Boss generation failed:", err);
			} finally {
				setBossLoading(false);
			}
		}
	}, [userId, currentTopic]);

	return (
		<div className="flex flex-col h-screen overflow-hidden bg-black text-green-400 font-pixel relative">

			{/* Boss Loading Indicator */}
			{bossLoading && (
				<div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center">
					<div className="text-red-500 text-2xl font-bold animate-pulse">⚔️ BOSS INCOMING...</div>
				</div>
			)}

			{/* 1. TOP BAR */}
			<div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-start pointer-events-none">
				<button
					className="pointer-events-auto bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg active:scale-95 transition-transform"
					onClick={() => { trigger('light'); setShowSubjectSelector(true); }}
				>
					<div className="w-6 h-6 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 animate-pulse" />
					<span className="text-xs font-bold uppercase tracking-widest text-white">{currentTopic}</span>
					<Menu size={14} className="text-zinc-500" />
				</button>

				<div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full px-3 py-1 flex items-center space-x-1">
					<div className="w-2 h-2 rounded-full bg-green-500" />
					<span className="text-[10px] font-mono text-zinc-300">{initialProfile.current_streak} DAY</span>
				</div>
			</div>

			{/* 2. Pet Section - Compact, below top bar */}
			<div className="flex-none h-[30%] flex items-center justify-center pt-16 pointer-events-none">
				<PetDisplay
					health={initialProfile.health}
					xp={initialProfile.xp}
					stage={initialProfile.stage}
					name={initialProfile.pet_name || 'Pet'}
				/>
			</div>

			{/* 3. Cards Section */}
			<div className="flex-1 relative z-20 flex items-center justify-center -mt-8">
				<SwipeableCardStack
					initialCards={initialCards}
					userId={userId}
					onPetReaction={setPetSentiment}
					onSwipe={handleSwipe}
					currentTopic={currentTopic}
				/>
			</div>

			{/* 4. Action Dock */}
			<div className="flex-none h-[15%] pb-safe px-6 flex items-center justify-center space-x-6 z-50">
				<ActionButton icon={Apple} label="Feed" onClick={() => trigger('light')} />
				<ActionButton icon={MessageCircle} label="Chat" onClick={() => { trigger('light'); setShowChat(true); }} highlight />
				<ActionButton icon={BarChart3} label="Stats" onClick={() => router.push('/collection')} />
			</div>

			{/* Overlays */}
			<SubjectSelector
				isOpen={showSubjectSelector}
				onClose={() => setShowSubjectSelector(false)}
				decks={decks}
				onSelect={handleDeckSelect}
				userId={userId}
			/>

			<AIChatOverlay
				isOpen={showChat}
				onClose={() => setShowChat(false)}
				context={`Learning ${currentTopic}`}
			/>

			{/* Boss Fight Modal */}
			{showBoss && bossQuestions.length > 0 && (
				<BossFightModal
					questions={bossQuestions}
					userId={userId}
					onClose={() => {
						setShowBoss(false);
						setBossQuestions([]);
						router.refresh();
					}}
				/>
			)}
		</div>
	);
}

function ActionButton({ icon: Icon, label, onClick, highlight }: any) {
	return (
		<button
			onClick={onClick}
			className={`flex flex-col items-center justify-center space-y-1 w-16 h-16 rounded-2xl transition-all active:scale-90 ${highlight ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
		>
			<Icon size={24} strokeWidth={2.5} />
		</button>
	)
}
