import { updatePetState } from '../actions/petLogic';
import { createClient } from '../utils/supabase/server';

jest.mock('../utils/supabase/server', () => ({
	createClient: jest.fn(),
}));

describe('Server Actions (core)', () => {
	let mockSupabase: any;
	let mockProfileBuilder: any;

	beforeEach(() => {
		jest.clearAllMocks();

		mockProfileBuilder = {
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn(),
			update: jest.fn().mockReturnThis(),
			then: (resolve: any) => resolve({ error: null, data: [] }),
		};

		mockSupabase = {
			from: jest.fn().mockImplementation((table: string) => {
				if (table === 'profiles' || table === 'Profiles') return mockProfileBuilder;
				return mockProfileBuilder;
			}),
		};

		(createClient as jest.Mock).mockResolvedValue(mockSupabase);
	});

	describe('petLogic XP incentives', () => {
		test('Grade 4 (Good) gives Max XP (+20)', async () => {
			mockProfileBuilder.single.mockResolvedValue({
				data: { xp: 0, health: 100, stage: 'egg' },
				error: null,
			});
			const result = await updatePetState('u-1', 4);
			expect(result.newState.xp).toBe(20);
		});

		test('Grade 3 (Hard) gives Modest XP (+10)', async () => {
			mockProfileBuilder.single.mockResolvedValue({
				data: { xp: 0, health: 100, stage: 'egg' },
				error: null,
			});
			const result = await updatePetState('u-1', 3);
			expect(result.newState.xp).toBe(10);
		});

		test('Grade 5 (Easy) gives Minimal XP (+5)', async () => {
			mockProfileBuilder.single.mockResolvedValue({
				data: { xp: 0, health: 100, stage: 'egg' },
				error: null,
			});
			const result = await updatePetState('u-1', 5);
			expect(result.newState.xp).toBe(5);
		});

		test('Grade 1 drains health', async () => {
			mockProfileBuilder.single.mockResolvedValue({
				data: { xp: 0, health: 100, stage: 'egg' },
				error: null,
			});
			const result = await updatePetState('u-1', 1);
			expect(result.newState.health).toBe(90);
		});
	});
});
