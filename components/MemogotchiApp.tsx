'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { completeFeeding, createPet, deletePet, getAppState, renamePet } from '@/actions/pets';
import { ensureSession } from '@/actions/session';
import { generateDeck } from '@/actions/generateDeck';
import { generateNextDeck } from '@/actions/generateNextDeck';
import { getDueCards } from '@/actions/getDueCards';
import { initializeProficiency } from '@/actions/learningEngine';
import { evaluatePlacement, generatePlacementQuiz, type PlacementQuestion } from '@/actions/placementTest';
import { submitReview } from '@/actions/submitReview';
import { FEEDING, PLACEMENT } from '@/lib/config';
import { spriteFor } from '@/lib/care';
import { displayedCare, homeyCareMeter, homeyStatus } from '@/lib/care/homey';
import type { PetRecord } from '@/lib/care/types';
import { shouldContinuePlacement } from '@/lib/placement';
import { speciesName, type SpeciesId } from '@/lib/species';
import type { StudyCard } from '@/lib/types';
import { ChatSheet } from '@/components/ChatSheet';
import { EggArt } from '@/components/pets/PetArt';
import type { AnswerEvent, StackCard } from '@/components/paper/CardStack';
import { FriendsScreen } from '@/components/screens/FriendsScreen';
import { HatchScreen } from '@/components/screens/HatchScreen';
import { expressionFor, HomeScreen } from '@/components/screens/HomeScreen';
import { NameScreen } from '@/components/screens/NameScreen';
import { SubjectScreen } from '@/components/screens/SubjectScreen';
import { WelcomeScreen } from '@/components/screens/WelcomeScreen';

const EASE = [0.22, 0.61, 0.36, 1] as const;

type Phase = 'loading' | 'welcome' | 'subject' | 'hatch' | 'name' | 'taste' | 'home' | 'friends';

interface TasteCard extends PlacementQuestion {
	id: string;
}

type Session =
	| { kind: 'taste'; cards: TasteCard[]; index: number; responses: { correct: boolean; timeMs: number }[]; seen: string[] }
	| { kind: 'feed'; cards: StudyCard[]; index: number }
	| { kind: 'ended' };

function studyToStack(card: StudyCard): StackCard {
	return {
		id: card.id,
		type: card.type,
		prompt: card.prompt,
		answer: card.answer,
		explanation: card.explanation,
		options: card.options,
	};
}

function tasteToStack(card: TasteCard): StackCard {
	return {
		id: card.id,
		type: card.type,
		prompt: card.question,
		answer: card.answer,
		explanation: card.explanation,
		options: card.options,
	};
}

export function MemogotchiApp({ start = 'home' }: { start?: 'home' | 'friends' }) {
	const reduce = useReducedMotion();
	const [phase, setPhase] = useState<Phase>('loading');
	const [pets, setPets] = useState<PetRecord[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [anonymous, setAnonymous] = useState(true);
	const [runtime, setRuntime] = useState<'demo' | 'supabase'>('demo');
	const [topic, setTopic] = useState('');
	const [species, setSpecies] = useState<SpeciesId>('chick');
	const [session, setSession] = useState<Session | null>(null);
	const [keepsake, setKeepsake] = useState<StudyCard | null>(null);
	const [look, setLook] = useState(0);
	const [mood, setMood] = useState<'idle' | 'watching' | 'pleased' | 'gentle'>('idle');
	const [chat, setChat] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);

	const applyState = useCallback((state: Awaited<ReturnType<typeof getAppState>>, prefer?: Phase) => {
		setPets(state.pets);
		setUserId(state.userId);
		setAnonymous(state.anonymous);
		setRuntime(state.mode);
		setKeepsake(state.keepsake);
		setActiveId(state.activePetId);
		if (prefer) {
			setPhase(prefer);
			return;
		}
		if (state.pets.length === 0) setPhase('welcome');
		else setPhase(start === 'friends' ? 'friends' : 'home');
	}, [start]);

	useEffect(() => {
		let cancel = false;
		(async () => {
			try {
				let state = await getAppState();
				if (!state.userId && state.mode === 'supabase') {
					const sessionResult = await ensureSession();
					if (!sessionResult.id) {
						if (!cancel) {
							setNotice(sessionResult.error ?? 'Sign in to keep a nest.');
							setRuntime('supabase');
							setPhase('welcome');
						}
						return;
					}
					state = await getAppState();
				}
				if (!cancel) applyState(state);
			} catch (error) {
				console.error(error);
				if (!cancel) {
					setNotice('The nest could not be opened.');
					setPhase('welcome');
				}
			}
		})();
		return () => {
			cancel = true;
		};
	}, [applyState]);

	const pet = pets.find((item) => item.id === activeId) ?? null;

	const reload = async (prefer?: Phase) => {
		const state = await getAppState();
		applyState(state, prefer);
		return state;
	};

	const beginTaste = async (petId: string, subject: string) => {
		setBusy(true);
		setPhase('taste');
		try {
			const quiz = await generatePlacementQuiz(subject, []);
			const cards: TasteCard[] = quiz.questions.map((question, index) => ({
				...question,
				id: `taste-${index}-${question.question.slice(0, 12)}`,
			}));
			if (cards.length === 0) {
				await settleBeginner(petId, subject);
				return;
			}
			setSession({
				kind: 'taste',
				cards,
				index: 0,
				responses: [],
				seen: cards.map((card) => card.question),
			});
		} finally {
			setBusy(false);
		}
	};

	const settleBeginner = async (petId: string, subject: string) => {
		if (!userId) return;
		await initializeProficiency(userId, subject, 'Beginner', 40, petId);
		const deck = await generateDeck({ topic: subject, userId, petId, difficulty: 'Beginner', count: 10 });
		setKeepsake(deck.cards[0] ?? null);
		setSession(null);
		await reload('home');
	};

	const finishTaste = async (responses: { correct: boolean; timeMs: number }[], level: 'Beginner' | 'Intermediate' | 'Advanced', confidence: number) => {
		if (!userId || !pet) return;
		setBusy(true);
		try {
			await initializeProficiency(userId, pet.topic, level, confidence, pet.id);
			const deck = await generateDeck({
				topic: pet.topic,
				userId,
				petId: pet.id,
				difficulty: level,
				count: 10,
			});
			await completeFeeding(userId, pet.id);
			setKeepsake(deck.cards[0] ?? null);
			setSession(null);
			await reload('home');
		} finally {
			setBusy(false);
		}
	};

	const answerTaste = async (correct: boolean, timeMs: number) => {
		if (session?.kind !== 'taste' || !pet) return;
		const responses = [...session.responses, { correct, timeMs }];
		const nextIndex = session.index + 1;
		if (nextIndex < session.cards.length) {
			setSession({ ...session, index: nextIndex, responses });
			return;
		}
		const evaluation = await evaluatePlacement(responses.map((response, index) => ({
			questionIndex: index,
			userAnswer: response.correct ? 'yes' : 'no',
			correct: response.correct,
			timeMs: response.timeMs,
		})));
		const moreWanted = shouldContinuePlacement({
			answered: responses.length,
			confidence: evaluation.confidenceScore,
			moreAvailable: true,
			minConfidence: PLACEMENT.minConfidence,
			maxQuestions: PLACEMENT.maxQuestions,
		});
		if (moreWanted) {
			const extra = await generatePlacementQuiz(pet.topic, session.seen);
			const fresh = extra.questions.filter((question) => !session.seen.includes(question.question));
			if (shouldContinuePlacement({
				answered: responses.length,
				confidence: evaluation.confidenceScore,
				moreAvailable: fresh.length > 0,
			})) {
				const added: TasteCard[] = fresh.map((question, index) => ({
					...question,
					id: `taste-more-${responses.length}-${index}`,
				}));
				setSession({
					kind: 'taste',
					cards: [...session.cards, ...added],
					index: nextIndex,
					responses,
					seen: [...session.seen, ...added.map((card) => card.question)],
				});
				return;
			}
		}
		await finishTaste(responses, evaluation.recommendedDifficulty, evaluation.confidenceScore);
	};

	const startFeed = async () => {
		if (!userId || !pet || session?.kind === 'feed') return;
		setBusy(true);
		try {
			let cards = await getDueCards(userId, pet.id);
			if (cards.length < FEEDING.minCards) {
				const more = await generateNextDeck(userId, pet.topic, pet.id);
				const seen = new Set(cards.map((card) => card.id));
				cards = [...cards, ...more.cards.filter((card) => !seen.has(card.id))];
			}
			cards = cards.slice(0, FEEDING.maxCards);
			if (cards.length === 0) {
				setNotice('The cards are still settling. Try once more.');
				return;
			}
			setSession({ kind: 'feed', cards, index: 0 });
			setPhase('home');
		} finally {
			setBusy(false);
		}
	};

	const answerFeed = (event: AnswerEvent) => {
		if (session?.kind !== 'feed' || !pet || !userId) return;
		const card = session.cards[session.index];
		if (!card) return;
		const next = session.index + 1;
		void submitReview(userId, card.id, event.grade, pet.topic, {
			responseTimeMs: event.responseTimeMs,
			wasFlipped: event.wasFlipped,
			cardDifficulty: card.difficulty,
		}).catch(console.error);
		setKeepsake(card);
		if (next >= session.cards.length) {
			void completeFeeding(userId, pet.id).then((result) => {
				setPets((current) => current.map((item) => item.id === pet.id ? result.pet : item));
			}).catch(console.error);
			setSession({ kind: 'ended' });
			return;
		}
		setSession({ ...session, index: next });
		window.setTimeout(() => setMood('idle'), 700);
	};

	const keepGoing = async () => {
		if (!userId || !pet) return;
		setBusy(true);
		try {
			const more = await generateNextDeck(userId, pet.topic, pet.id);
			if (more.cards.length === 0) {
				setNotice('Nothing new just now.');
				return;
			}
			setSession({ kind: 'feed', cards: more.cards.slice(0, FEEDING.maxCards), index: 0 });
		} finally {
			setBusy(false);
		}
	};

	const homeCard = (): StackCard | null => {
		if (session?.kind === 'ended') return { id: 'looked-after', type: 'note', prompt: 'Looked after for now.', answer: '' };
		if (session?.kind === 'feed') {
			const card = session.cards[session.index];
			return card ? studyToStack(card) : null;
		}
		if (session?.kind === 'taste') {
			const card = session.cards[session.index];
			return card ? tasteToStack(card) : null;
		}
		if (keepsake) return { ...studyToStack(keepsake), id: `keep-${keepsake.id}` };
		return null;
	};

	const status = pet ? homeyStatus(pet.lastFedAt, new Date()) : 'looked_after';
	const care = pet ? homeyCareMeter(pet.lastFedAt, new Date()) : 100;
	const progress = session?.kind === 'feed'
		? session.index / Math.max(1, session.cards.length)
		: session?.kind === 'ended' ? 1 : 0;
	const brighten = displayedCare(care, progress) / 100;
	const sprite = pet ? spriteFor(pet.stage, status, brighten) : 'hatchling';
	const speech = pet && status !== 'looked_after' && session?.kind !== 'feed' && session?.kind !== 'ended'
		? (status === 'needs_love' ? 'Could use a little love.' : 'a little hungry.')
		: undefined;

	const openPet = (id: string) => {
		setActiveId(id);
		setSession(null);
		setKeepsake(null);
		setMood('idle');
		setPhase('home');
		const chosen = pets.find((item) => item.id === id);
		if (chosen) {
			void getDueCards(chosen.user_id, chosen.id).then((cards) => {
				const reviewed = cards.find((card) => card.interval > 0);
				if (reviewed) setKeepsake(reviewed);
			}).catch(() => undefined);
		}
	};

	return (
		<div className="mx-auto min-h-dvh w-full max-w-md">
			{notice && phase === 'welcome' && (
				<p className="px-6 pt-4 text-center font-hand text-lg text-ink-soft">{notice}</p>
			)}
			<AnimatePresence mode="wait">
				<motion.div
					key={phase === 'home' || phase === 'taste' ? `${phase}-${activeId}` : phase}
					initial={reduce ? false : { x: 28, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					exit={reduce ? undefined : { x: -24, opacity: 0 }}
					transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
				>
					{phase === 'loading' && (
						<div className="wall flex min-h-dvh flex-col items-center justify-center">
							<div className="h-40 w-32"><EggArt crack={0.4} /></div>
							<p className="mt-4 font-hand text-2xl text-ink">Memogotchi</p>
						</div>
					)}
					{phase === 'welcome' && <WelcomeScreen onHatch={() => setPhase('subject')} />}
					{phase === 'subject' && (
						<SubjectScreen onContinue={(nextTopic) => {
							const existing = pets.find((item) => item.topic.toLowerCase() === nextTopic.toLowerCase());
							if (existing) {
								openPet(existing.id);
								return;
							}
							setTopic(nextTopic);
							setPhase('hatch');
						}} />
					)}
					{phase === 'hatch' && (
						<HatchScreen topic={topic} onContinue={(next) => { setSpecies(next); setPhase('name'); }} />
					)}
					{phase === 'name' && (
						<NameScreen
							species={species}
							onContinue={async (name) => {
								setBusy(true);
								try {
									const created = await createPet({ topic, species, name: name || speciesName(species) });
									setPets((current) => {
										const without = current.filter((item) => item.id !== created.pet.id);
										return [...without, created.pet];
									});
									setActiveId(created.pet.id);
									setUserId(created.pet.user_id);
									if (created.existed) {
										setPhase('home');
										return;
									}
									await beginTaste(created.pet.id, created.pet.topic);
								} catch (error) {
									console.error(error);
									setNotice('Hatching needs another try.');
								} finally {
									setBusy(false);
								}
							}}
						/>
					)}
					{(phase === 'home' || phase === 'taste') && pet && (
						<HomeScreen
							name={pet.name}
							topic={pet.topic}
							species={pet.species}
							sprite={sprite}
							expression={expressionFor(status, sprite)}
							brighten={brighten}
							resting={session?.kind === 'ended'}
							look={look}
							mood={mood}
							speech={speech}
							card={homeCard()}
							mode={session?.kind === 'ended' ? 'rest' : session?.kind === 'taste' ? 'taste' : session?.kind === 'feed' ? 'play' : 'idle'}
							revealed={!session && Boolean(keepsake)}
							showCoach={session?.kind === 'taste' && session.index < 2 && session.cards[session.index]?.type === 'basic'}
							progress={session?.kind === 'taste' ? { index: session.index, total: Math.min(PLACEMENT.maxQuestions, Math.max(session.cards.length, session.index + 1)) } : undefined}
							busy={busy}
							onOpenFriends={() => setPhase('friends')}
							onLook={setLook}
							onReaction={setMood}
							onAnswer={(event) => {
								if (session?.kind === 'taste') {
									const card = session.cards[session.index];
									const correct = card?.type === 'choice'
										? event.grade >= 3
										: event.grade >= 3;
									void answerTaste(correct, event.responseTimeMs);
									return;
								}
								answerFeed(event);
							}}
							onFeed={() => { void startFeed(); }}
							onChat={() => setChat(true)}
							onSkip={() => { if (pet) void settleBeginner(pet.id, pet.topic); }}
							onKeep={() => { void keepGoing(); }}
							onRest={() => { setSession(null); void reload('home'); }}
						/>
					)}
					{phase === 'friends' && (
						<FriendsScreen
							pets={pets}
							showNest={runtime === 'supabase' && anonymous}
							onOpen={openPet}
							onRename={(id, name) => {
								void renamePet(id, name).then((updated) => {
									setPets((current) => current.map((item) => item.id === id ? { ...item, name: updated.name } : item));
								});
							}}
							onDelete={(id) => {
								void deletePet(id).then(() => {
									const next = pets.filter((item) => item.id !== id);
									setPets(next);
									if (activeId === id) setActiveId(next[0]?.id ?? null);
									if (next.length === 0) setPhase('welcome');
								});
							}}
							onHatch={() => { setSession(null); setPhase('subject'); }}
						/>
					)}
				</motion.div>
			</AnimatePresence>
			{chat && pet && (
				<ChatSheet name={pet.name} species={pet.species} topic={pet.topic} onClose={() => setChat(false)} />
			)}
		</div>
	);
}
