
import { generateNextDeck } from '../actions/generateNextDeck';
import { generateDeck } from '../actions/generateDeck';
import { createClient } from '../utils/supabase/server';

// Mock dependencies
jest.mock('../utils/supabase/server', () => ({
	createClient: jest.fn(),
}));

jest.mock('../actions/generateDeck', () => ({
	generateDeck: jest.fn().mockResolvedValue({ success: true, deckId: 'new-deck' }),
}));

describe('Adaptive Learning Simulation', () => {
	let mockSupabase: any;

	beforeEach(() => {
		jest.clearAllMocks();

		const mockCardBuilder = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			then: (resolve: any) => resolve({ data: [], error: null }) // Default empty
		};

		mockSupabase = {
			from: jest.fn().mockReturnValue(mockCardBuilder),
		};

		(createClient as jest.Mock).mockResolvedValue(mockSupabase);
	});

	test('Scenario: High Performance -> Advanced Difficulty', async () => {
		// 1. Simulate finding recent cards with High Ease (Mean > 2.6)
		// Avg Ease = 2.8
		const highPerfCards = Array(5).fill({ interval: 10, ease_factor: 2.8, Decks: { topic: 'Spanish' } });

		const cardBuilder = mockSupabase.from('Cards');

		// Mock chain: select -> eq -> eq -> order -> limit -> then/resolve
		// We reuse the single builder mock pattern
		// IMPORTANT: We need to override the `then` logic for this specific test case
		const specificBuilder = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue({ data: highPerfCards, error: null }) // Use mockResolvedValue if assuming await on limit
		};
		// NOTE: The implementation uses `await supabase...limit(10)`. 
		// If the real code awaits the chain, the LAST method called usually returns the Promise.

		mockSupabase.from.mockReturnValue(specificBuilder);

		await generateNextDeck('user-1', 'Spanish');

		// Verify we calculated high ease and requested Advanced
		expect(generateDeck).toHaveBeenCalledWith(
			expect.objectContaining({
				topic: 'Spanish',
				userId: 'user-1',
				difficulty: 'Advanced'
			})
		);
	});

	test('Scenario: Low Performance -> Beginner Difficulty', async () => {
		// 2. Simulate finding recent cards with Low Ease (Mean < 2.3)
		// Avg Ease = 1.3
		const lowPerfCards = Array(5).fill({ interval: 1, ease_factor: 1.3, Decks: { topic: 'Spanish' } });

		const specificBuilder = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			order: jest.fn().mockReturnThis(),
			limit: jest.fn().mockResolvedValue({ data: lowPerfCards, error: null })
		};
		mockSupabase.from.mockReturnValue(specificBuilder);

		await generateNextDeck('user-1', 'Spanish');

		expect(generateDeck).toHaveBeenCalledWith(
			expect.objectContaining({
				difficulty: 'Beginner'
			})
		);
	});
});
