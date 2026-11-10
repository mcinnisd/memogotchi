import { generateNextDeck } from './generateNextDeck';
import { generateDeck } from './generateDeck';
import { createClient } from '@/utils/supabase/server';

jest.mock('@/utils/supabase/server', () => ({
	createClient: jest.fn(),
}));

jest.mock('./generateDeck', () => ({
	generateDeck: jest.fn().mockResolvedValue({ success: true, deckId: 'new-deck', cards: [] }),
}));

describe('generateNextDeck follows proficiency and stays on the pet', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	function mockProficiency(score: number | null) {
		const builder = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue(
				score === null
					? { data: null, error: { message: 'none' } }
					: { data: { proficiency_score: score, confidence: 0.8, total_reviews: 12 }, error: null }
			),
		};
		(createClient as jest.Mock).mockResolvedValue({
			from: () => builder,
		});
	}

	test('a high proficiency asks for an expert deck on that pet', async () => {
		mockProficiency(92);
		await generateNextDeck('user-1', 'Spanish', 'pet-spanish');
		expect(generateDeck).toHaveBeenCalledWith(expect.objectContaining({
			topic: 'Spanish',
			userId: 'user-1',
			petId: 'pet-spanish',
			difficulty: 'Expert',
		}));
	});

	test('a low proficiency stays gentle', async () => {
		mockProficiency(20);
		await generateNextDeck('user-1', 'Spanish', 'pet-spanish');
		expect(generateDeck).toHaveBeenCalledWith(expect.objectContaining({
			difficulty: 'Beginner',
			petId: 'pet-spanish',
		}));
	});

	test('a missing proficiency does not borrow another deck', async () => {
		mockProficiency(null);
		await generateNextDeck('user-1', 'Biology', 'pet-bio');
		expect(generateDeck).toHaveBeenCalledWith(expect.objectContaining({
			topic: 'Biology',
			petId: 'pet-bio',
			difficulty: 'Intermediate',
		}));
	});
});
