'use server';

import { createClient } from '@/utils/supabase/server';
import { getCareRules } from '@/lib/care';
import type { PetRecord } from '@/lib/care/types';
import {
	demoCompleteFeeding,
	demoCreatePet,
	demoDeletePet,
	demoDueCards,
	demoKeepsake,
	demoPets,
	demoProfile,
	demoRenamePet,
	DEMO_USER_ID,
	hydratePet,
} from '@/lib/demo/store';
import { pickLandingPet } from '@/lib/landing';
import { isDemoMode } from '@/lib/runtime';
import { isDue, toStudyCard } from '@/lib/studyCard';
import { nextStreak } from '@/lib/streak';
import type { AppState, CardContent, Profile, StudyCard } from '@/lib/types';
import { isSpeciesId, type SpeciesId } from '@/lib/species';
import { ensureProfile, ensureSession } from '@/actions/session';

function emptyState(mode: AppState['mode']): AppState {
	return {
		mode,
		userId: null,
		email: null,
		anonymous: true,
		profile: null,
		pets: [],
		activePetId: null,
		dueCards: [],
		keepsake: null,
	};
}

export async function getAppState(): Promise<AppState> {
	if (isDemoMode()) {
		const pets = demoPets();
		const active = pickLandingPet(pets.map((pet) => ({
			id: pet.id,
			last_fed_at: pet.lastFedAt,
			due_count: pet.due_count,
		})));
		return {
			mode: 'demo',
			userId: DEMO_USER_ID,
			email: null,
			anonymous: true,
			profile: demoProfile(),
			pets,
			activePetId: active?.id ?? null,
			dueCards: active ? demoDueCards(active.id) : [],
			keepsake: active ? demoKeepsake(active.id) : null,
		};
	}

	const session = await ensureSession();
	if (!session.id) return emptyState('supabase');
	const supabase = await createClient();
	const { data: profileRow } = await supabase
		.from('profiles')
		.select('id, current_streak, last_study_date, updated_at')
		.eq('id', session.id)
		.maybeSingle();

	const profile: Profile | null = profileRow
		? {
			id: profileRow.id,
			current_streak: profileRow.current_streak ?? 0,
			last_study_date: profileRow.last_study_date,
			updated_at: profileRow.updated_at,
		}
		: null;

	const { data: petRows } = await supabase.from('pets').select('*').eq('user_id', session.id);
	const ids = (petRows ?? []).map((row) => row.id as string);
	let cardRows: {
		id: string;
		pet_id: string | null;
		next_review: string | null;
		interval: number;
		deck_id: string;
		front: string;
		back: string;
		content: CardContent | null;
		card_type: string;
		difficulty: number;
		ease_factor: number;
		created_at: string;
	}[] = [];
	if (ids.length > 0) {
		const { data } = await supabase
			.from('cards')
			.select('*')
			.in('pet_id', ids);
		cardRows = (data ?? []) as typeof cardRows;
	}

	const now = new Date();
	const pets: PetRecord[] = (petRows ?? []).map((row) => {
		const due = cardRows.filter((card) => card.pet_id === row.id && isDue(card.next_review, now)).length;
		return hydratePet(row, due);
	});
	const active = pickLandingPet(pets.map((pet) => ({
		id: pet.id,
		last_fed_at: pet.lastFedAt,
		due_count: pet.due_count,
	})));
	const activeCards = active
		? cardRows.filter((card) => card.pet_id === active.id)
		: [];
	const dueCards = activeCards
		.filter((card) => isDue(card.next_review, now))
		.map((card) => toStudyCard(card))
		.filter((card): card is StudyCard => Boolean(card));
	const keepsake = [...activeCards]
		.filter((card) => (card.interval ?? 0) > 0)
		.map((card) => toStudyCard(card))
		.filter((card): card is StudyCard => Boolean(card))
		.at(-1) ?? null;

	return {
		mode: 'supabase',
		userId: session.id,
		email: session.email,
		anonymous: session.anonymous,
		profile,
		pets,
		activePetId: active?.id ?? null,
		dueCards,
		keepsake,
	};
}

export async function createPet(input: { topic: string; species: string; name: string }) {
	if (!isSpeciesId(input.species)) throw new Error('Unknown species');
	const topic = input.topic.trim();
	const name = input.name.trim();
	if (!topic || !name) throw new Error('A friend needs a subject and a name');

	if (isDemoMode()) return demoCreatePet({ topic, species: input.species, name });

	const session = await ensureSession();
	if (!session.id) throw new Error('Sign in to hatch a friend');
	const supabase = await createClient();
	const { data: existingRows } = await supabase.from('pets').select('*').eq('user_id', session.id);
	const existing = (existingRows ?? []).find((row) => String(row.topic).toLowerCase() === topic.toLowerCase());
	if (existing) return { pet: hydratePet(existing), existed: true };

	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from('pets')
		.insert({
			user_id: session.id,
			topic,
			name,
			species: input.species as SpeciesId,
			stage: 'hatchling',
			care: 100,
			hunger: 0,
			health: 100,
			days_cared: 0,
			last_fed_at: now,
			mode: 'homey',
			mode_state: {},
		})
		.select()
		.single();
	if (error || !data) throw new Error(error?.message ?? 'Could not hatch');
	await ensureProfile(session.id);
	return { pet: hydratePet(data), existed: false };
}

export async function renamePet(petId: string, name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Name cannot be empty');
	if (isDemoMode()) {
		const pet = demoRenamePet(petId, trimmed);
		if (!pet) throw new Error('Friend not found');
		return pet;
	}
	const session = await ensureSession();
	if (!session.id) throw new Error('Sign in first');
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('pets')
		.update({ name: trimmed })
		.eq('id', petId)
		.eq('user_id', session.id)
		.select()
		.single();
	if (error || !data) throw new Error(error?.message ?? 'Could not rename');
	return hydratePet(data);
}

export async function deletePet(petId: string) {
	if (isDemoMode()) {
		demoDeletePet(petId);
		return { success: true };
	}
	const session = await ensureSession();
	if (!session.id) throw new Error('Sign in first');
	const supabase = await createClient();
	const { error } = await supabase.from('pets').delete().eq('id', petId).eq('user_id', session.id);
	if (error) throw new Error(error.message);
	return { success: true };
}

export async function completeFeeding(userId: string, petId: string) {
	if (isDemoMode()) {
		const pet = demoCompleteFeeding(petId);
		if (!pet) throw new Error('Friend not found');
		return { success: true, pet };
	}
	const supabase = await createClient();
	const { data: row, error } = await supabase
		.from('pets')
		.select('*')
		.eq('id', petId)
		.eq('user_id', userId)
		.single();
	if (error || !row) throw new Error('Friend not found');
	const pet = hydratePet(row);
	const rules = getCareRules(pet.mode);
	const next = rules.completeFeeding({
		stage: pet.stage,
		daysCared: pet.daysCared,
		lastFedAt: pet.lastFedAt,
		care: pet.care,
		hunger: pet.hunger,
	}, new Date());
	const { error: updateError } = await supabase
		.from('pets')
		.update({
			stage: next.stage,
			days_cared: next.daysCared,
			last_fed_at: next.lastFedAt,
			care: next.care,
			hunger: next.hunger,
		})
		.eq('id', petId);
	if (updateError) throw new Error(updateError.message);
	await touchStreak(userId);
	return { success: true, pet: { ...pet, ...next, due_count: pet.due_count } };
}

export async function touchStreak(userId: string) {
	if (isDemoMode()) return;
	const supabase = await createClient();
	const { data: profile } = await supabase
		.from('profiles')
		.select('current_streak, last_study_date')
		.eq('id', userId)
		.single();
	const next = nextStreak({
		current_streak: profile?.current_streak ?? 0,
		last_study_date: profile?.last_study_date ?? null,
	}, new Date());
	if (!next.changed) return;
	await supabase.from('profiles').update({
		current_streak: next.current_streak,
		last_study_date: next.last_study_date,
		updated_at: new Date().toISOString(),
	}).eq('id', userId);
}

export async function listDueCards(userId: string, petId: string): Promise<StudyCard[]> {
	if (isDemoMode()) return demoDueCards(petId);
	const supabase = await createClient();
	const now = new Date().toISOString();
	const { data, error } = await supabase
		.from('cards')
		.select('*, decks!inner(user_id, topic, pet_id)')
		.eq('pet_id', petId)
		.eq('decks.user_id', userId)
		.or(`next_review.is.null,next_review.lte."${now}"`)
		.order('next_review', { ascending: true })
		.limit(24);
	if (error) throw new Error(error.message);
	return (data ?? [])
		.map((row) => toStudyCard(row, petId))
		.filter((card): card is StudyCard => Boolean(card));
}
