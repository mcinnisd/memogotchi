'use client';

import { useState } from 'react';
import PetDisplay from '@/components/PetDisplay';
import SwipeableCardStack from '@/components/SwipeableCardStack';
import SubjectSelector from '@/components/SubjectSelector';
import { Menu } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';
import type { TopicDeck } from '@/actions/getDecks';

interface HomeLoopProps {
	initialProfile: Profile;
	initialCards: any[];
	decks: TopicDeck[];
	userId: string;
	activeTopic?: string;
}

export default function HomeLoop({
	initialProfile,
	initialCards,
	decks,
	userId,
	activeTopic,
}: HomeLoopProps) {
	const [petSentiment, setPetSentiment] = useState<'happy' | 'sad' | 'strain' | 'normal'>(
		'normal'
	);
	const [showSubjectSelector, setShowSubjectSelector] = useState(false);
	const router = useRouter();
	const { trigger } = useHaptic();

	const currentTopic =
		activeTopic || initialCards[0]?.decks?.topic || decks[0]?.topic || 'Memogotchi';

	const handleTopicSelect = (topic: string) => {
		trigger('light');
		setShowSubjectSelector(false);
		router.push(`/?topic=${encodeURIComponent(topic)}`);
	};

	return (
		<div className="flex flex-col h-[100dvh] overflow-hidden bg-black text-green-400 font-mono relative">
			{/* Top bar: subject + streak */}
			<div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-start pointer-events-none">
				<button
					className="pointer-events-auto bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg active:scale-95 transition-transform"
					onClick={() => {
						trigger('light');
						setShowSubjectSelector(true);
					}}
				>
					<div className="w-6 h-6 rounded-full bg-gradient-to-tr from-green-400 to-emerald-700 animate-pulse" />
					<span className="text-xs font-bold uppercase tracking-widest text-white">
						{currentTopic}
					</span>
					<Menu size={14} className="text-zinc-500" />
				</button>

				<div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full px-3 py-1 flex items-center space-x-1">
					<div className="w-2 h-2 rounded-full bg-green-500" />
					<span className="text-[10px] font-mono text-zinc-300">
						{initialProfile.current_streak} DAY
					</span>
				</div>
			</div>

			{/* Thin pet pulse */}
			<div className="flex-none h-[28%] flex items-center justify-center pt-14 pointer-events-none">
				<PetDisplay
					health={initialProfile.health}
					xp={initialProfile.xp}
					stage={initialProfile.stage}
					name={initialProfile.pet_name || 'Pet'}
					sentiment={petSentiment}
				/>
			</div>

			{/* Study stack */}
			<div className="flex-1 relative z-20 flex items-center justify-center px-4 pb-8">
				<SwipeableCardStack
					initialCards={initialCards}
					userId={userId}
					onPetReaction={setPetSentiment}
					currentTopic={currentTopic}
				/>
			</div>

			<SubjectSelector
				isOpen={showSubjectSelector}
				onClose={() => setShowSubjectSelector(false)}
				decks={decks}
				onSelect={handleTopicSelect}
				userId={userId}
				activeTopic={currentTopic}
			/>
		</div>
	);
}
