import { generateDeck } from './generateDeck';
import { submitReview } from './submitReview';
import { generateNextDeck } from './generateNextDeck';
import { generateBossEncounter } from './bossFight';
import { getAllCards } from './getAllCards';

// Mock everything
jest.mock('@/utils/supabase/server', () => ({
	createClient: jest.fn(),
}));

// Mock fetch for Grok
global.fetch = jest.fn();

const mockSupabase = {
	from: jest.fn(),
	select: jest.fn(),
	insert: jest.fn(),
	update: jest.fn(),
	eq: jest.fn(),
	single: jest.fn(),
	in: jest.fn(), // Needed for getDueCards or similar if used
	order: jest.fn(),
	limit: jest.fn(),
	lt: jest.fn(), // For boss fight
	rpc: jest.fn(), // If used
};

// Mock Builder with Thenable for update().eq() chains
const mockBuilder = {
	select: jest.fn().mockReturnThis(),
	insert: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	eq: jest.fn().mockReturnThis(),
	single: jest.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
	order: jest.fn().mockReturnThis(),
	limit: jest.fn().mockImplementation(() => Promise.resolve({ data: [], error: null })),
	lt: jest.fn().mockReturnThis(),
	in: jest.fn().mockReturnThis(),
	// Make the builder itself awaitable (for update().eq())
	then: jest.fn((resolve) => resolve({ data: null, error: null })),
};

describe('Spanish Learning Scenario', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		const { createClient } = require('@/utils/supabase/server');
		createClient.mockReturnValue(mockSupabase);

		// Default: return valid builder
		mockSupabase.from.mockReturnValue(mockBuilder);

		process.env.XAI_API_KEY = 'test';
	});

	it('Complete Flow: Beginner -> Review -> Next Deck -> Boss Fight -> Collection', async () => {
		// --- STEP 1: Generate Initial Spanish Deck ---
		// Fix: Output strictly as Array as expected by generateDeck.ts
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				choices: [{
					message: {
						content: JSON.stringify([
							{ question: 'Hola', answer: 'Hello', explanation: 'Basic greeting', type: 'flashcard' },
							{ question: 'Gato', answer: 'Cat', explanation: 'Animal', type: 'flashcard' }
						])
					}
				}]
			})
		});

		// Mock Deck Insert Return
		mockBuilder.single.mockResolvedValueOnce({ data: { id: 'deck-1' }, error: null });

		const deck = await generateDeck({ topic: 'Spanish', userId: 'user-1' });
		expect(deck).toBeDefined();

		// --- STEP 2: Submit Reviews (Simulate Learning) ---
		// Setup specific returns for the Review chain
		// 1. Get Card
		mockBuilder.single.mockResolvedValueOnce({ data: { id: 'c1', interval: 0, ease_factor: 2.5, next_review: new Date().toISOString() }, error: null });
		// 2. Update Card (Handled by builder.then)
		// 3. Get Profile (For pet logic)
		mockBuilder.single.mockResolvedValueOnce({ data: { id: 'user-1', coins: 100, xp: 0, health: 100 }, error: null });
		// 4. Update Profile (Handled by builder.then)

		await submitReview('user-1', 'c1', 5);

		// Verify SRS update
		expect(mockBuilder.update).toHaveBeenCalledWith(
			expect.objectContaining({ ease_factor: expect.closeTo(2.6, 1) })
		);

		// --- STEP 3: Generate Next Deck (Adaptive) ---
		// Mock recent reviews fetch (limit -> resolve)
		mockBuilder.limit.mockResolvedValueOnce({
			data: [
				{ ease_factor: 1.3 },
				{ ease_factor: 1.3 },
			],
			error: null
		});

		// Mock Grok for Next Deck
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				choices: [{
					message: {
						content: JSON.stringify([
							{ question: 'Perro', answer: 'Dog', type: 'flashcard' }
						])
					}
				}]
			})
		});

		// Mock Deck Insert
		mockBuilder.single.mockResolvedValueOnce({ data: { id: 'deck-2' }, error: null });

		await generateNextDeck('user-1', 'Spanish');


		// --- STEP 4: Trigger Boss Fight (Leech Detection) ---
		// Mock finding leeches (limit -> resolve)
		mockBuilder.limit.mockResolvedValueOnce({
			data: [
				{ id: 'c2', content: { question: 'Gato' }, ease_factor: 1.3 },
				{ id: 'c3', content: { question: 'Malo' }, ease_factor: 1.3 },
				{ id: 'c4', content: { question: 'Feo' }, ease_factor: 1.3 }
			],
			error: null
		});

		// Mock Grok for Boss Questions (JSON Object with questions array)
		// Note: Boss fight implementation expects "questions" key inside content
		(global.fetch as jest.Mock).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				choices: [{
					message: {
						content: JSON.stringify({
							questions: [
								{ question: 'Boss Q1', options: ['A', 'B'], answer: 'A' }
							]
						})
					}
				}]
			})
		});

		const bossEncounter = await generateBossEncounter('user-1', 'Spanish');
		expect(bossEncounter.available).toBe(true);


		// --- STEP 5: Collection View (getAllCards) ---
		// Mock getAllCards (order -> resolve)
		// getAllCards chain: select().eq().order()
		// Here order is terminal in implementation (it awaits the result of order()?)
		// Ah, getAllCards: await supabase...order()
		// If order() returns builder, then we await builder.
		// But we want data.

		// We override order implementation for this specific call or use a generic "then" response?
		// We need specific data.
		// Hack: Since 'then' returns generic null, we might need to mock implementation of order() or eq() 
		// to return a Promise that resolves to data.

		// Let's rely on `mockBuilder.order` returning `this`, and `this.then` returning the mock data.
		// We can override `then` implementation momentarily.
		mockBuilder.then.mockImplementation((resolve) => resolve({
			data: [
				{ id: 'c1', deck: { topic: 'Spanish', difficulty: 'Beginner' } }
			],
			error: null
		}));

		const collection = await getAllCards('user-1');
		expect(collection).toHaveLength(1);
		expect(collection[0].deck.topic).toBe('Spanish');
	});
});
