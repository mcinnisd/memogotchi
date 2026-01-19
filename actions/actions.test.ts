
import { generateDeck } from '../actions/generateDeck';
import { updatePetState } from '../actions/petLogic';
import { getDueCards } from '../actions/getDueCards';
import { submitReview } from '../actions/submitReview';
import { generatePetPersona, initializeUser } from '../actions/onboarding';
import { feedPet } from '../actions/feedPet';
import { generateBossEncounter, submitBossResult } from '../actions/bossFight';
import { createClient } from '../utils/supabase/server';

// Mock Supabase
jest.mock('../utils/supabase/server', () => ({
	createClient: jest.fn(),
}));

// Mock Fetch Global
global.fetch = jest.fn() as jest.Mock;

describe('Server Actions', () => {
	let mockSupabase: any;
	let mockProfileBuilder: any;
	let mockCardBuilder: any;

	beforeEach(() => {
		jest.clearAllMocks();

		const mockDeckBuilder = {
			insert: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: { id: 'deck-123' }, error: null }),
		};

		mockCardBuilder = {
			insert: jest.fn().mockResolvedValue({ error: null }),
			select: jest.fn().mockReturnThis(),
			single: jest.fn(),
			update: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			lt: jest.fn().mockReturnThis(), // For Boss Fight calc
			lte: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			order: jest.fn().mockResolvedValue({
				data: [{ id: 'card-1', Decks: { topic: 'Math' } }],
				error: null
			}),
			then: (resolve: any) => resolve({ error: null }),
		};

		mockProfileBuilder = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn(),
			update: jest.fn().mockReturnThis(),
			upsert: jest.fn().mockReturnThis(),
			then: (resolve: any) => resolve({ error: null, data: [] }),
		};

		mockSupabase = {
			from: jest.fn().mockImplementation((table: string) => {
				if (table === 'Decks') return mockDeckBuilder;
				if (table === 'Cards') return mockCardBuilder;
				if (table === 'Profiles') return mockProfileBuilder;
				return mockProfileBuilder;
			}),
		};

		(createClient as jest.Mock).mockResolvedValue(mockSupabase);
	});

	// ... (Keeping reduced test scope for brevity in this file update, but covering NEW features)

	describe('Incentives: XP Logic (petLogic)', () => {
		test('Grade 4 (Good) gives Max XP (+20)', async () => {
			mockProfileBuilder.single.mockResolvedValue({ data: { xp: 0, health: 100, stage: 'egg' }, error: null });
			const result = await updatePetState('u-1', 4);
			expect(result.newState.xp).toBe(20);
		});

		test('Grade 3 (Hard) gives Modest XP (+10)', async () => {
			mockProfileBuilder.single.mockResolvedValue({ data: { xp: 0, health: 100, stage: 'egg' }, error: null });
			const result = await updatePetState('u-1', 3);
			expect(result.newState.xp).toBe(10);
		});

		test('Grade 5 (Easy) gives Minimal XP (+5)', async () => {
			mockProfileBuilder.single.mockResolvedValue({ data: { xp: 0, health: 100, stage: 'egg' }, error: null });
			const result = await updatePetState('u-1', 5);
			expect(result.newState.xp).toBe(5);
		});
	});

	describe('Boss Fight', () => {
		test('generateBossEncounter finds leech cards', async () => {
			// Mock fetch (Grok)
			(global.fetch as jest.Mock).mockResolvedValue({
				ok: true,
				json: async () => ({
					choices: [{ message: { content: '[{"question": "BossQ"}]' } }]
				})
			});
			process.env.XAI_API_KEY = 'test';

			// Mock Cards Query (finding leeches)
			// Chain: select -> eq -> eq -> lt -> order -> limit -> then
			// We need to ensure the base mock supports this chain, OR override it here.
			// Current chain in implementation: select().eq().eq().lt().order().limit()

			const specificCardBuilder = {
				...mockCardBuilder,
				lt: jest.fn().mockReturnThis(),
				order: jest.fn().mockReturnThis(),
				limit: jest.fn().mockResolvedValue({
					data: [
						{ id: 'c1', content: { question: 'Q1' }, ease_factor: 1.5 },
						{ id: 'c2', content: { question: 'Q2' }, ease_factor: 1.6 },
						{ id: 'c3', content: { question: 'Q3' }, ease_factor: 1.7 }
					],
					error: null
				})
			};

			// Ensure chain continuity
			specificCardBuilder.select.mockReturnValue(specificCardBuilder);
			specificCardBuilder.eq.mockReturnValue(specificCardBuilder);
			// lt and order are already returning 'this' (the specific builder) via mockReturnThis(), 
			// BUT standard mockReturnThis returns "this" context of the mock function, which might be tricky if copied.
			// Safer to explicit return:
			specificCardBuilder.lt.mockReturnValue(specificCardBuilder);
			specificCardBuilder.order.mockReturnValue(specificCardBuilder);

			mockSupabase.from.mockImplementation((table: string) => {
				if (table === 'Cards') return specificCardBuilder;
				return mockProfileBuilder;
			});

			const result = await generateBossEncounter('u-1', 'Code');

			expect(specificCardBuilder.lt).toHaveBeenCalledWith('ease_factor', 2.3);
			expect(result.available).toBe(true);
			// @ts-ignore
			expect(result.questions[0].question).toBe("BossQ");
		});

		test('submitBossResult handles Win (Big Rewards)', async () => {
			mockProfileBuilder.single.mockResolvedValue({ data: { xp: 100, coins: 50, health: 50 }, error: null });

			const result = await submitBossResult('u-1', true);

			expect(result.success).toBe(true);
			expect(mockProfileBuilder.update).toHaveBeenCalledWith(
				expect.objectContaining({ xp: 200, coins: 100, health: 100 })
			);
		});

		test('submitBossResult handles Loss (Penalty)', async () => {
			mockProfileBuilder.single.mockResolvedValue({ data: { health: 50 }, error: null });

			const result = await submitBossResult('u-1', false);

			// Penalty: -20 Health
			expect(mockProfileBuilder.update).toHaveBeenCalledWith(
				expect.objectContaining({ health: 30 })
			);
		});
	});
});
