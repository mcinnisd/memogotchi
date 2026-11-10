'use client';

import type { PetRecord, SpriteState } from '@/lib/care/types';
import { SPECIES_IDS } from '@/lib/species';
import { PetArt } from '@/components/pets/PetArt';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';
import { SubjectScreen } from '@/components/screens/SubjectScreen';
import { HatchScreen } from '@/components/screens/HatchScreen';
import { NameScreen } from '@/components/screens/NameScreen';
import { expressionFor, HomeScreen } from '@/components/screens/HomeScreen';
import { FriendsScreen } from '@/components/screens/FriendsScreen';
import type { StackCard } from '@/components/paper/CardStack';

const NOW = new Date();

function daysAgo(days: number) {
	const date = new Date(NOW);
	date.setUTCDate(date.getUTCDate() - days);
	return date.toISOString();
}

function friend(partial: Pick<PetRecord, 'id' | 'name' | 'species' | 'topic' | 'stage' | 'lastFedAt' | 'daysCared'>): PetRecord {
	return {
		user_id: 'preview',
		care: 80,
		hunger: 20,
		mode: 'homey',
		mode_state: {},
		created_at: daysAgo(12),
		due_count: 1,
		...partial,
	};
}

const CHICK = friend({ id: 'chick', name: 'Chick', species: 'chick', topic: 'Spanish', stage: 'well_loved', lastFedAt: daysAgo(0), daysCared: 12 });
const FOX = friend({ id: 'fox', name: 'Fox', species: 'fox', topic: 'Python', stage: 'cared_for', lastFedAt: daysAgo(5), daysCared: 6 });
const SPROUT = friend({ id: 'sprout', name: 'Sprout', species: 'sprout', topic: 'Biology', stage: 'cared_for', lastFedAt: daysAgo(1), daysCared: 5 });
const BUN = friend({ id: 'bun', name: 'Bun', species: 'bun', topic: 'History', stage: 'well_loved', lastFedAt: daysAgo(0), daysCared: 12 });

const HOLA: StackCard = { id: 'hola', type: 'basic', prompt: 'hola', answer: 'hello', explanation: 'A greeting.' };
const CHOICE: StackCard = {
	id: 'choice',
	type: 'choice',
	prompt: 'What does hola mean?',
	answer: 'hello',
	options: ['hello', 'goodbye', 'please'],
};
const NOTE: StackCard = { id: 'note', type: 'note', prompt: 'Looked after for now.', answer: '' };
const PRINT: StackCard = { id: 'print', type: 'basic', prompt: 'print()', answer: 'shows a value', explanation: 'It writes to the screen.' };

const noop = () => undefined;

const STATES: SpriteState[] = ['hatchling', 'cared_for', 'well_loved', 'needs_love'];

export function PreviewApp({ name }: { name: string }) {
	if (name === 'pets') {
		return (
			<div className="min-h-dvh px-2 py-4" style={{ background: '#b7aa9a' }}>
				<h1 className="type-heading text-center text-ink">States</h1>
				{SPECIES_IDS.map((id) => (
					<div key={id} className="mt-3 grid grid-cols-4 gap-1">
						{STATES.map((state) => (
							<div key={state} className="flex h-28 items-end justify-center overflow-hidden">
								<div className="h-24 w-full">
									<PetArt species={id} state={state} expression={state === 'needs_love' ? 'sad' : 'happy'} />
								</div>
							</div>
						))}
					</div>
				))}
			</div>
		);
	}
	if (name === 'subject') return <SubjectScreen initial="spanish" onContinue={noop} />;
	if (name === 'subject-custom') return <SubjectScreen startCustom onContinue={noop} />;
	if (name === 'hatch') return <HatchScreen topic="Spanish" onContinue={noop} />;
	if (name === 'name') return <NameScreen species="chick" onContinue={noop} />;
	if (name === 'friends') {
		return (
			<FriendsScreen
				pets={[CHICK, FOX, SPROUT, BUN]}
				onOpen={noop}
				onRename={noop}
				onDelete={noop}
				onHatch={noop}
			/>
		);
	}
	if (name === 'welcome') return <WelcomeScreen onHatch={noop} />;

	const needs = name === 'needs-love';
	const ended = name === 'session-end';
	const choice = name === 'taste-choice' || name === 'taste-choice-answered';
	const taste = name.startsWith('taste');
	const feeding = name === 'feeding';
	const pet = needs ? FOX : CHICK;
	const card = ended ? NOTE : needs ? PRINT : choice ? CHOICE : feeding ? { ...HOLA, id: 'feed', prompt: 'hola' } : HOLA;
	const sprite = needs ? 'needs_love' as const : 'well_loved' as const;
	const status = needs ? 'needs_love' as const : 'looked_after' as const;

	return (
		<HomeScreen
			name={pet.name}
			topic={pet.topic}
			species={pet.species}
			sprite={sprite}
			expression={expressionFor(status, sprite)}
			brighten={needs ? 0.45 : 1}
			resting={ended}
			look={0}
			mood="idle"
			speech={needs ? 'Could use a little love.' : undefined}
			card={name === 'generating' ? null : card}
			mode={ended ? 'rest' : taste || name === 'generating' ? 'taste' : feeding ? 'play' : 'idle'}
			revealed={false}
			showCoach={name === 'taste-swipe'}
			progress={taste ? { index: choice ? 1 : 0, total: 5 } : feeding ? { index: 3, total: 10 } : undefined}
			highlightOption={name === 'taste-choice' ? 'hello' : undefined}
			initialFlipped={name === 'taste-flipped'}
			review={name === 'taste-choice-answered' ? { picked: 'goodbye' } : null}
			busy={name === 'generating'}
			onOpenFriends={noop}
			onLook={noop}
			onReaction={noop}
			onAnswer={noop}
			onFeed={noop}
			onChat={noop}
			onSkip={noop}
			onKeep={noop}
			onRest={noop}
		/>
	);
}
