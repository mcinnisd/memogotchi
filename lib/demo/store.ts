import { homeyCareMeter, homeyStageForDays, completeHomeyFeeding } from '@/lib/care/homey';
import type { PetRecord } from '@/lib/care/types';
import { fixtureDeck } from '@/lib/fixtures';
import { calculatePerformance, calculateProficiencyUpdate } from '@/lib/learning';
import { proficiencyFromPlacement, type PlacementDifficulty } from '@/lib/placement';
import { isDemoMode } from '@/lib/runtime';
import { calculateReview } from '@/lib/srs';
import { nextStreak } from '@/lib/streak';
import type { CardContent, Profile, StudyCard } from '@/lib/types';
import { isPetMode, isPetStage } from '@/lib/types';
import { isSpeciesId, type SpeciesId } from '@/lib/species';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

interface ProficiencyRow {
	topic: string;
	pet_id: string | null;
	proficiency_score: number;
	confidence: number;
	total_reviews: number;
}

interface DemoDb {
	profile: Profile;
	pets: PetRecord[];
	cards: StudyCard[];
	proficiency: ProficiencyRow[];
}

function emptyDb(): DemoDb {
	return {
		profile: {
			id: DEMO_USER_ID,
			current_streak: 0,
			last_study_date: null,
		},
		pets: [],
		cards: [],
		proficiency: [],
	};
}

function state(): DemoDb {
	const bag = globalThis as typeof globalThis & { __memogotchiDemo?: DemoDb };
	if (!bag.__memogotchiDemo) bag.__memogotchiDemo = emptyDb();
	return bag.__memogotchiDemo;
}

function uid(): string {
	return crypto.randomUUID();
}

export function demoEnabled(): boolean {
	return isDemoMode();
}

export function readDemo() {
	return state();
}

export function resetDemo() {
	(globalThis as typeof globalThis & { __memogotchiDemo?: DemoDb }).__memogotchiDemo = emptyDb();
}

function dueCount(petId: string, now = new Date()): number {
	return state().cards.filter((card) => card.pet_id === petId && (!card.next_review || new Date(card.next_review) <= now)).length;
}

function withDue(pet: PetRecord): PetRecord {
	return { ...pet, due_count: dueCount(pet.id) };
}

export function demoPets(): PetRecord[] {
	return state().pets.map(withDue);
}

export function demoProfile(): Profile {
	return state().profile;
}

export function demoCreatePet(input: { topic: string; species: SpeciesId; name: string }): { pet: PetRecord; existed: boolean } {
	const topic = input.topic.trim();
	const existing = state().pets.find((pet) => pet.topic.toLowerCase() === topic.toLowerCase());
	if (existing) return { pet: withDue(existing), existed: true };
	const now = new Date().toISOString();
	const pet: PetRecord = {
		id: uid(),
		user_id: DEMO_USER_ID,
		topic,
		name: input.name.trim() || input.species,
		species: input.species,
		stage: 'hatchling',
		care: 100,
		hunger: 0,
		daysCared: 0,
		lastFedAt: now,
		mode: 'homey',
		mode_state: {},
		created_at: now,
		due_count: 0,
	};
	state().pets.push(pet);
	return { pet, existed: false };
}

export function demoRenamePet(petId: string, name: string): PetRecord | null {
	const pet = state().pets.find((item) => item.id === petId);
	if (!pet) return null;
	pet.name = name.trim() || pet.name;
	return withDue(pet);
}

export function demoDeletePet(petId: string) {
	state().pets = state().pets.filter((pet) => pet.id !== petId);
	state().cards = state().cards.filter((card) => card.pet_id !== petId);
}

export function demoCompleteFeeding(petId: string, now = new Date()): PetRecord | null {
	const pet = state().pets.find((item) => item.id === petId);
	if (!pet) return null;
	const next = completeHomeyFeeding({
		stage: pet.stage,
		daysCared: pet.daysCared,
		lastFedAt: pet.lastFedAt,
		care: pet.care,
		hunger: pet.hunger,
	}, now);
	Object.assign(pet, next);
	demoTouchStreak(now);
	return withDue(pet);
}

export function demoDueCards(petId: string, limit = 24): StudyCard[] {
	const now = new Date();
	return state().cards
		.filter((card) => card.pet_id === petId && (!card.next_review || new Date(card.next_review) <= now))
		.slice(0, limit);
}

export function demoKeepsake(petId: string): StudyCard | null {
	const reviewed = state().cards.filter((card) => card.pet_id === petId && card.interval > 0);
	return reviewed[reviewed.length - 1] ?? null;
}

export function demoInsertDeck(input: {
	petId: string;
	topic: string;
	cards: CardContent[];
	difficulty: number;
}): { deckId: string; cards: StudyCard[] } {
	const deckId = uid();
	const now = new Date().toISOString();
	const created = input.cards.map((card) => {
		const study: StudyCard = {
			id: uid(),
			pet_id: input.petId,
			deck_id: deckId,
			prompt: card.question,
			answer: card.answer,
			explanation: card.explanation,
			type: card.type === 'choice' ? 'choice' : 'basic',
			options: card.options,
			difficulty: input.difficulty,
			interval: 0,
			ease_factor: 2.5,
			next_review: now,
		};
		state().cards.push(study);
		return study;
	});
	return { deckId, cards: created };
}

export function demoFallbackDeck(topic: string, petId: string, count: number, level: string) {
	const numeric = level === 'Expert' ? 9 : level === 'Advanced' ? 7 : level === 'Intermediate' ? 5 : level === 'Elementary' ? 3 : 2;
	return demoInsertDeck({
		petId,
		topic,
		cards: fixtureDeck(topic, count, level),
		difficulty: numeric,
	});
}

export function demoSubmitReview(cardId: string, grade: number, signals?: { responseTimeMs: number; wasFlipped: boolean; cardDifficulty?: number }) {
	const card = state().cards.find((item) => item.id === cardId);
	if (!card) throw new Error('Card not found');
	const srs = calculateReview(card.interval, card.ease_factor, grade);
	card.interval = srs.interval;
	card.ease_factor = srs.easeFactor;
	card.next_review = srs.nextReview;
	demoTouchStreak(new Date());
	const prof = demoProficiency(card.pet_id);
	if (signals && prof) {
		const performance = calculatePerformance({
			grade,
			responseTimeMs: signals.responseTimeMs,
			wasFlipped: signals.wasFlipped,
			cardDifficulty: signals.cardDifficulty ?? card.difficulty,
		}, prof.proficiency_score);
		const update = calculateProficiencyUpdate(prof.proficiency_score, prof.confidence, performance);
		prof.proficiency_score = update.newProficiency;
		prof.confidence = update.newConfidence;
		prof.total_reviews += 1;
	}
	return { success: true, cardUpdate: srs };
}

function demoProficiency(petId: string): ProficiencyRow | undefined {
	const pet = state().pets.find((item) => item.id === petId);
	if (!pet) return undefined;
	return state().proficiency.find((row) => row.topic.toLowerCase() === pet.topic.toLowerCase());
}

export function demoGetProficiency(topic: string) {
	const row = state().proficiency.find((item) => item.topic.toLowerCase() === topic.toLowerCase());
	if (!row) return null;
	return {
		proficiency: row.proficiency_score,
		confidence: row.confidence,
		totalReviews: row.total_reviews,
	};
}

export function demoInitProficiency(topic: string, petId: string | null, level: PlacementDifficulty, confidence: number) {
	const score = proficiencyFromPlacement(level);
	const existing = state().proficiency.find((item) => item.topic.toLowerCase() === topic.toLowerCase());
	const row: ProficiencyRow = {
		topic,
		pet_id: petId,
		proficiency_score: score,
		confidence: Math.min(0.6, confidence / 100),
		total_reviews: existing?.total_reviews ?? 0,
	};
	if (existing) Object.assign(existing, row);
	else state().proficiency.push(row);
}

export function demoTouchStreak(now = new Date()) {
	const next = nextStreak(state().profile, now);
	state().profile = {
		id: DEMO_USER_ID,
		current_streak: next.current_streak,
		last_study_date: next.last_study_date,
	};
}

export function demoCardsForUser(petId?: string): StudyCard[] {
	return state().cards.filter((card) => !petId || card.pet_id === petId);
}

export function hydratePet(row: Record<string, unknown>, due = 0): PetRecord {
	const species = isSpeciesId(String(row.species)) ? row.species as SpeciesId : 'chick';
	const stage = isPetStage(String(row.stage)) ? row.stage as PetRecord['stage'] : 'hatchling';
	const mode = isPetMode(String(row.mode ?? 'homey')) ? row.mode as PetRecord['mode'] : 'homey';
	const lastFed = typeof row.last_fed_at === 'string' ? row.last_fed_at : null;
	return {
		id: String(row.id),
		user_id: String(row.user_id),
		topic: String(row.topic ?? ''),
		name: String(row.name ?? species),
		species,
		stage,
		care: typeof row.care === 'number' ? row.care : homeyCareMeter(lastFed, new Date()),
		hunger: typeof row.hunger === 'number' ? row.hunger : 0,
		daysCared: typeof row.days_cared === 'number' ? row.days_cared : 0,
		lastFedAt: lastFed,
		mode,
		mode_state: (row.mode_state as Record<string, unknown>) ?? {},
		created_at: String(row.created_at ?? new Date().toISOString()),
		due_count: due,
	};
}

export function stageFromRow(days: number) {
	return homeyStageForDays(days);
}
