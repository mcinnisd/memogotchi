import { feedPet } from './feedPet';
import { getDueCards } from './getDueCards';
import { generateDeck } from './generateDeck';
import { updatePetState } from './petLogic';
import { createClient } from '@/utils/supabase/server';
import type { PetCareSnapshot } from '@/lib/care/types';

jest.mock('@/utils/supabase/server', () => ({
	createClient: jest.fn(),
}));

global.fetch = jest.fn() as jest.Mock;

function chain(resolved: { data: unknown; error: unknown }) {
	const builder: Record<string, jest.Mock> = {};
	const self = () => builder;
	builder.insert = jest.fn(() => builder);
	builder.select = jest.fn(() => builder);
	builder.update = jest.fn(() => builder);
	builder.delete = jest.fn(() => builder);
	builder.eq = jest.fn(() => builder);
	builder.or = jest.fn(() => builder);
	builder.order = jest.fn(() => builder);
	builder.limit = jest.fn(() => builder);
	builder.in = jest.fn(() => builder);
	builder.single = jest.fn().mockResolvedValue(resolved);
	builder.then = jest.fn((resolve: (value: unknown) => void) => resolve(resolved));
	void self;
	return builder;
}

describe('pet care actions', () => {
	const petRow = {
		id: 'pet-1',
		user_id: 'user-1',
		name: 'Fox',
		species: 'fox',
		stage: 'hatchling',
		topic: 'Python',
		care: 22,
		hunger: 78,
		days_cared: 2,
		last_fed_at: '2026-06-10T12:00:00.000Z',
		mode: 'homey',
		mode_state: {},
		created_at: '2026-06-01T12:00:00.000Z',
	};

	let pets: ReturnType<typeof chain>;
	let profiles: ReturnType<typeof chain>;
	let cards: ReturnType<typeof chain>;
	let decks: ReturnType<typeof chain>;

	beforeEach(() => {
		jest.clearAllMocks();
		pets = chain({ data: petRow, error: null });
		profiles = chain({ data: { current_streak: 1, last_study_date: '2026-06-14T12:00:00.000Z' }, error: null });
		cards = chain({ data: [], error: null });
		decks = chain({ data: { id: 'deck-1' }, error: null });
		(createClient as jest.Mock).mockResolvedValue({
			from: (table: string) => {
				if (table === 'pets') return pets;
				if (table === 'profiles') return profiles;
				if (table === 'cards') return cards;
				if (table === 'decks') return decks;
				throw new Error(`unexpected table ${table}`);
			},
		});
	});

	test('finishing a feeding restores care on pets, not a coin balance', async () => {
		const result = await feedPet('user-1', 'pet-1');
		expect(result.success).toBe(true);
		expect(pets.update).toHaveBeenCalledWith(expect.objectContaining({
			care: 100,
			hunger: 0,
		}));
		expect(profiles.update).not.toHaveBeenCalledWith(expect.objectContaining({ coins: expect.anything() }));
		const tables = (createClient as jest.Mock).mock.results[0].value;
		void tables;
		expect(pets.update).toHaveBeenCalled();
		expect(profiles.update.mock.calls.some((call) => 'health' in (call[0] as object))).toBe(false);
	});

	test('due cards are queried for a single pet', async () => {
		await getDueCards('user-1', 'pet-1');
		expect(cards.eq).toHaveBeenCalledWith('pet_id', 'pet-1');
		expect(cards.eq).toHaveBeenCalledWith('decks.user_id', 'user-1');
	});

	test('a new deck is stored on that pet', async () => {
		process.env.XAI_API_KEY = 'test';
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({
				choices: [{
					message: {
						content: JSON.stringify([
							{ question: 'hola', answer: 'hello', type: 'basic' },
							{ question: 'What does gato mean?', answer: 'cat', type: 'choice', options: ['cat', 'dog'] },
						]),
					},
				}],
			}),
		});

		const result = await generateDeck({
			topic: 'Spanish',
			userId: 'user-1',
			petId: 'pet-spanish',
			count: 2,
		});

		expect(result.success).toBe(true);
		expect(decks.insert).toHaveBeenCalledWith(expect.objectContaining({
			pet_id: 'pet-spanish',
			topic: 'Spanish',
			user_id: 'user-1',
		}));
		expect(cards.insert).toHaveBeenCalledWith(expect.arrayContaining([
			expect.objectContaining({ pet_id: 'pet-spanish', front: 'hola' }),
		]));
		const inserted = cards.insert.mock.calls[0][0] as { pet_id: string }[];
		expect(inserted.every((card) => card.pet_id === 'pet-spanish')).toBe(true);
	});

	test('a wrong answer does not change the care snapshot', async () => {
		const before: PetCareSnapshot = {
			stage: 'cared_for',
			daysCared: 6,
			lastFedAt: '2026-06-14T12:00:00.000Z',
			care: 68,
			hunger: 32,
		};
		const result = await updatePetState('user-1', 1, before);
		expect(result.evolved).toBe(false);
		expect(result.snapshot).toEqual(before);
	});
});
