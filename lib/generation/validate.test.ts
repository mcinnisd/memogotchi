import { validateGeneratedCards, parseGeneratedCardsJson } from './validate';

describe('validateGeneratedCards', () => {
	test('accepts valid basic and choice cards', () => {
		const cards = validateGeneratedCards([
			{ question: 'Q1?', answer: 'A1', type: 'basic', explanation: 'Because' },
			{
				question: 'Q2?',
				answer: 'B',
				type: 'choice',
				options: ['A', 'B', 'C'],
			},
		]);
		expect(cards).toHaveLength(2);
		expect(cards[0].type).toBe('basic');
		expect(cards[1].options).toContain('B');
	});

	test('rejects empty or malformed entries', () => {
		expect(() => validateGeneratedCards([])).toThrow(/No valid/);
		expect(() => validateGeneratedCards([{ question: '', answer: 'x' }])).toThrow(/No valid/);
		expect(() =>
			validateGeneratedCards([{ question: 'Q', answer: 'A', type: 'choice', options: ['only'] }])
		).toThrow(/No valid/);
	});

	test('parses markdown-wrapped JSON', () => {
		const cards = parseGeneratedCardsJson(
			'```json\n[{"question":"Hi?","answer":"Hello","type":"basic"}]\n```'
		);
		expect(cards[0].answer).toBe('Hello');
	});
});
