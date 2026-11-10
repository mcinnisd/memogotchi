'use client';

import type { CareStatus, PetStage, SpriteState } from '@/lib/care/types';
import type { SpeciesId } from '@/lib/species';
import { CardStack, type AnswerEvent, type StackCard } from '@/components/paper/CardStack';
import { Dock, DockButton } from '@/components/paper/Dock';
import { PaperTag } from '@/components/paper/PaperTag';
import { Windowsill } from '@/components/paper/Windowsill';
import { PetArt } from '@/components/pets/PetArt';

export function HomeScreen({
	name,
	topic,
	species,
	sprite,
	expression,
	brighten,
	resting,
	look,
	mood,
	speech,
	card,
	mode,
	revealed,
	showCoach,
	progress,
	highlightOption,
	initialFlipped,
	review,
	busy,
	onOpenFriends,
	onLook,
	onReaction,
	onAnswer,
	onFeed,
	onChat,
	onSkip,
	onKeep,
	onRest,
}: {
	name: string;
	topic: string;
	species: SpeciesId;
	sprite: SpriteState;
	expression: 'happy' | 'soft' | 'sad';
	brighten: number;
	resting?: boolean;
	look: number;
	mood: 'idle' | 'watching' | 'pleased' | 'gentle';
	speech?: string;
	card: StackCard | null;
	mode: 'idle' | 'play' | 'rest' | 'taste';
	revealed?: boolean;
	showCoach?: boolean;
	progress?: { index: number; total: number };
	highlightOption?: string;
	initialFlipped?: boolean;
	review?: { picked: string } | null;
	busy?: boolean;
	onOpenFriends: () => void;
	onLook: (value: number) => void;
	onReaction: (mood: 'idle' | 'watching' | 'pleased' | 'gentle') => void;
	onAnswer: (event: AnswerEvent) => void;
	onFeed: () => void;
	onChat: () => void;
	onSkip: () => void;
	onKeep: () => void;
	onRest: () => void;
}) {
	return (
		<div className="wall relative flex min-h-dvh flex-col">
			<div className="scrap-sheet relative mx-2 mt-3 flex min-h-0 flex-1 flex-col overflow-hidden shadow-paper">
				<div className="flex items-start justify-between gap-2 px-3 pt-3">
					<PaperTag onClick={onOpenFriends}>
						<span>{name}</span>
						<span className="inline-block h-7 w-7">
							<PetArt species={species} state={sprite === 'egg' ? 'hatchling' : sprite} expression={expression} brighten={brighten} />
						</span>
					</PaperTag>
					<PaperTag tone="sage" onClick={onOpenFriends}>{topic}</PaperTag>
				</div>
				<Windowsill speech={speech}>
					<div className="h-full">
						<PetArt
							species={species}
							state={sprite === 'egg' ? 'hatchling' : sprite}
							expression={expression}
							resting={resting}
							look={look}
							mood={mood}
							brighten={brighten}
						/>
					</div>
				</Windowsill>
				<div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-2">
					{busy ? (
						<div className="flex w-full flex-col items-center px-6">
							<p className="type-heading text-center text-ink">Making your cards</p>
							<div className="relative mt-5 h-36 w-48">
								<div className="deckle absolute inset-0 translate-y-3 -rotate-6 bg-[#e7b89a]" />
								<div className="deckle ruled absolute inset-0 translate-y-1.5 rotate-3" />
								<div className="deckle ruled absolute inset-0 -rotate-1 shadow-paper" />
							</div>
							<p className="type-helper mt-4 text-center text-ink-soft">A little pile, just for {topic}.</p>
						</div>
					) : (
						<CardStack
							card={card}
							mode={mode}
							revealed={revealed}
							showCoach={showCoach}
							progress={progress}
							highlightOption={highlightOption}
							initialFlipped={initialFlipped}
							review={review}
							onLook={onLook}
							onReaction={onReaction}
							onAnswer={onAnswer}
						/>
					)}
				</div>
				{mode === 'taste' ? (
					<Dock>
						<DockButton variant="quiet" className="w-64 text-lg" onClick={onSkip}>Skip if you're new</DockButton>
					</Dock>
				) : mode === 'rest' ? (
					<Dock>
						<DockButton className="w-44" onClick={onKeep}>Keep going</DockButton>
						<DockButton variant="secondary" className="w-28" onClick={onRest}>Rest</DockButton>
					</Dock>
				) : (
					<Dock>
						<DockButton className="w-44" onClick={onFeed} disabled={mode === 'play'}>
							<span aria-hidden className="text-[#4f7a3a]">
								<svg width="22" height="22" viewBox="0 0 22 22"><path d="M11 19 C12 12 15 10 19 8 C14 8 12 5 11 2 C10 5 8 8 3 8 C7 10 10 12 11 19Z" fill="#6f9a48" /></svg>
							</span>
							Feed
						</DockButton>
						<DockButton variant="secondary" className="h-14 w-[4.8rem] flex-col gap-0 px-0 text-sm leading-none" onClick={onChat}>
							<span className="text-base leading-none" aria-hidden>♡</span>
							Chat
						</DockButton>
					</Dock>
				)}
			</div>
		</div>
	);
}

export function expressionFor(status: CareStatus, sprite: SpriteState): 'happy' | 'soft' | 'sad' {
	if (sprite === 'needs_love' || status === 'needs_love') return 'sad';
	if (status === 'a_little_hungry') return 'soft';
	return 'happy';
}

export function stageSprite(stage: PetStage, sprite: SpriteState): SpriteState {
	return sprite === 'egg' ? stage : sprite;
}
