import { generateDeck } from './generateDeck';
import { submitReview } from './submitReview';
import { getAllCards } from './getAllCards';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
	createClient: jest.fn(),
}));

global.fetch = jest.fn() as jest.Mock;

describe('Spanish subject stays on its own pet', () => {
	let cards: Record<string, jest.Mock>;
	let decks: Record<string, jest.Mock>;
	let profiles: Record<string, jest.Mock>;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.XAI_API_KEY = 'test';

		const make = (singleData: unknown) => {
			const builder: Record<string, jest.Mock> = {};
			builder.insert = jest.fn(() => builder);
			builder.select = jest.fn(() => builder);
			builder.update = jest.fn(() => builder);
			builder.eq = jest.fn(() => builder);
			builder.order = jest.fn(() => builder);
			builder.single = jest.fn().mockResolvedValue({ data: singleData, error: null });
			builder.then = jest.fn((resolve: (value: unknown) => void) => resolve({ data: singleData, error: null }));
			return builder;
		};

		decks = make({ id: 'deck-1' });
		cards = make({
			id: 'c1',
			interval: 0,
			ease_factor: 2.5,
			difficulty: 2,
			decks: { topic: 'Spanish' },
		});
		profiles = make({ current_streak: 2, last_study_date: new Date().toISOString() });

		(createClient as jest.Mock).mockResolvedValue({
			from: (table: string) => {
				if (table === 'decks') return decks;
				if (table === 'cards') return cards;
				if (table === 'profiles') return profiles;
				return profiles;
			},
		});
	});

	it('creates a Spanish deck on the Spanish pet, grades a card, and lists only that user', async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: true,
			json: async () => ({
				choices: [{
					message: {
						content: JSON.stringify([
							{ question: 'Hola', answer: 'Hello', explanation: 'A greeting', type: 'basic' },
							{ question: 'Gato', answer: 'Cat', type: 'basic' },
						]),
					},
				}],
			}),
		});

		const deck = await generateDeck({ topic: 'Spanish', userId: 'user-1', petId: 'pet-spanish', count: 2 });
		expect(deck.success).toBe(true);
		expect(decks.insert).toHaveBeenCalledWith(expect.objectContaining({ pet_id: 'pet-spanish', topic: 'Spanish' }));

		await submitReview('user-1', 'c1', 4, 'Spanish');
		expect(cards.update).toHaveBeenCalledWith(expect.objectContaining({
			ease_factor: expect.any(Number),
			interval: expect.any(Number),
		}));
		expect(profiles.update).not.toHaveBeenCalledWith(expect.objectContaining({ health: expect.anything() }));
		expect(profiles.update).not.toHaveBeenCalledWith(expect.objectContaining({ coins: expect.anything() }));

		cards.then.mockImplementation((resolve: (value: unknown) => void) => resolve({
			data: [{ id: 'c1', pet_id: 'pet-spanish', deck: { topic: 'Spanish', user_id: 'user-1', pet_id: 'pet-spanish' } }],
			error: null,
		}));

		const collection = await getAllCards('user-1', 'pet-spanish');
		expect(cards.eq).toHaveBeenCalledWith('pet_id', 'pet-spanish');
		expect(collection).toHaveLength(1);
		expect(collection[0].deck.topic).toBe('Spanish');
		expect(collection[0].pet_id).toBe('pet-spanish');
	});
});
