import type { CardContent } from '@/lib/types';
import type { PlacementDifficulty } from '@/lib/placement';

export interface FixtureQuestion {
	question: string;
	answer: string;
	explanation?: string;
	type: 'basic' | 'choice';
	options?: string[];
	difficulty: 'easy' | 'medium' | 'hard';
}

const SPANISH: FixtureQuestion[] = [
	{ type: 'basic', difficulty: 'easy', question: 'hola', answer: 'hello', explanation: 'A greeting.' },
	{ type: 'choice', difficulty: 'easy', question: 'What does hola mean?', answer: 'hello', options: ['hello', 'goodbye', 'please'] },
	{ type: 'basic', difficulty: 'easy', question: 'gracias', answer: 'thank you' },
	{ type: 'basic', difficulty: 'medium', question: 'buenos días', answer: 'good morning' },
	{ type: 'choice', difficulty: 'medium', question: 'How do you say “please”?', answer: 'por favor', options: ['por favor', 'lo siento', 'de nada'] },
	{ type: 'basic', difficulty: 'medium', question: 'gato', answer: 'cat' },
	{ type: 'basic', difficulty: 'hard', question: '¿Dónde está la biblioteca?', answer: 'Where is the library?' },
	{ type: 'choice', difficulty: 'hard', question: 'Which word means “to go”?', answer: 'ir', options: ['ser', 'ir', 'estar'] },
	{ type: 'basic', difficulty: 'easy', question: 'adiós', answer: 'goodbye' },
	{ type: 'basic', difficulty: 'medium', question: 'agua', answer: 'water' },
	{ type: 'choice', difficulty: 'easy', question: 'What does “sí” mean?', answer: 'yes', options: ['yes', 'no', 'maybe'] },
	{ type: 'basic', difficulty: 'hard', question: 'madrugada', answer: 'the early hours before dawn' },
];

const PYTHON: FixtureQuestion[] = [
	{ type: 'basic', difficulty: 'easy', question: 'What does print() do?', answer: 'It shows a value on the screen.' },
	{ type: 'choice', difficulty: 'easy', question: 'Which symbol starts a comment?', answer: '#', options: ['#', '//', '<!--'] },
	{ type: 'basic', difficulty: 'easy', question: 'What type is 3.14?', answer: 'float' },
	{ type: 'choice', difficulty: 'medium', question: 'Which collection keeps unique items?', answer: 'set', options: ['list', 'set', 'tuple'] },
	{ type: 'basic', difficulty: 'medium', question: 'What does len("hi") return?', answer: '2' },
	{ type: 'basic', difficulty: 'medium', question: 'How do you write a function?', answer: 'def name():' },
	{ type: 'choice', difficulty: 'hard', question: 'What does a list comprehension return?', answer: 'a new list', options: ['a new list', 'a generator only', 'None'] },
	{ type: 'basic', difficulty: 'hard', question: 'What is a dictionary key?', answer: 'The lookup name for a stored value.' },
	{ type: 'basic', difficulty: 'easy', question: 'What does == check?', answer: 'Whether two values are equal.' },
	{ type: 'choice', difficulty: 'medium', question: 'Which keyword defines a loop?', answer: 'for', options: ['for', 'loop', 'repeat'] },
];

const BIOLOGY: FixtureQuestion[] = [
	{ type: 'basic', difficulty: 'easy', question: 'What do plants breathe in to make food?', answer: 'carbon dioxide' },
	{ type: 'choice', difficulty: 'easy', question: 'Which organ pumps blood?', answer: 'heart', options: ['heart', 'lung', 'stomach'] },
	{ type: 'basic', difficulty: 'medium', question: 'What is a cell?', answer: 'The smallest living unit of a living thing.' },
	{ type: 'choice', difficulty: 'medium', question: 'Where does photosynthesis happen?', answer: 'chloroplast', options: ['mitochondria', 'chloroplast', 'nucleus'] },
	{ type: 'basic', difficulty: 'hard', question: 'What does DNA hold?', answer: 'Instructions for building and running a living thing.' },
	{ type: 'basic', difficulty: 'easy', question: 'Name one thing a seed needs to sprout.', answer: 'water' },
	{ type: 'choice', difficulty: 'hard', question: 'Which base pairs with adenine in DNA?', answer: 'thymine', options: ['guanine', 'thymine', 'cytosine'] },
	{ type: 'basic', difficulty: 'medium', question: 'What is an ecosystem?', answer: 'Living things and the place they share.' },
	{ type: 'basic', difficulty: 'easy', question: 'What do roots take in?', answer: 'water and minerals' },
	{ type: 'choice', difficulty: 'medium', question: 'A frog begins life as a…', answer: 'tadpole', options: ['tadpole', 'caterpillar', 'seed'] },
];

const HISTORY: FixtureQuestion[] = [
	{ type: 'basic', difficulty: 'easy', question: 'What is a primary source?', answer: 'A record from the time itself.' },
	{ type: 'choice', difficulty: 'easy', question: 'Which is a primary source?', answer: 'a diary', options: ['a diary', 'a textbook', 'a documentary made last year'] },
	{ type: 'basic', difficulty: 'medium', question: 'What was the Silk Road?', answer: 'A network of trade routes across Asia.' },
	{ type: 'choice', difficulty: 'medium', question: 'Who wrote the Declaration of Independence’s first draft?', answer: 'Thomas Jefferson', options: ['Thomas Jefferson', 'Benjamin Franklin', 'John Adams'] },
	{ type: 'basic', difficulty: 'hard', question: 'What does “BCE” mean?', answer: 'Before the Common Era.' },
	{ type: 'basic', difficulty: 'easy', question: 'What is a timeline for?', answer: 'Putting events in order.' },
	{ type: 'choice', difficulty: 'hard', question: 'The Renaissance began in which region?', answer: 'Italy', options: ['Italy', 'Norway', 'Japan'] },
	{ type: 'basic', difficulty: 'medium', question: 'What is an empire?', answer: 'A state that rules many peoples or lands.' },
	{ type: 'basic', difficulty: 'easy', question: 'Name one thing historians use besides books.', answer: 'letters, maps, or objects' },
	{ type: 'choice', difficulty: 'medium', question: 'Which came first?', answer: 'the printing press', options: ['the printing press', 'the telephone', 'the airplane'] },
];

const TRIVIA: FixtureQuestion[] = [
	{ type: 'basic', difficulty: 'easy', question: 'How many days are in a leap year?', answer: '366' },
	{ type: 'choice', difficulty: 'easy', question: 'Which planet is known for rings?', answer: 'Saturn', options: ['Mars', 'Saturn', 'Venus'] },
	{ type: 'basic', difficulty: 'medium', question: 'What is the largest ocean?', answer: 'the Pacific' },
	{ type: 'choice', difficulty: 'medium', question: 'How many strings does a standard violin have?', answer: '4', options: ['4', '5', '6'] },
	{ type: 'basic', difficulty: 'hard', question: 'What is the capital of Canada?', answer: 'Ottawa' },
	{ type: 'basic', difficulty: 'easy', question: 'What color is made from red and yellow?', answer: 'orange' },
	{ type: 'choice', difficulty: 'hard', question: 'Which metal is liquid at room temperature?', answer: 'mercury', options: ['mercury', 'iron', 'silver'] },
	{ type: 'basic', difficulty: 'medium', question: 'How many sides does a hexagon have?', answer: '6' },
	{ type: 'basic', difficulty: 'easy', question: 'What do bees collect from flowers?', answer: 'nectar' },
	{ type: 'choice', difficulty: 'medium', question: 'Which instrument has black and white keys?', answer: 'piano', options: ['piano', 'flute', 'drum'] },
];

function genericFor(topic: string): FixtureQuestion[] {
	return [
		{ type: 'basic', difficulty: 'easy', question: `What is one beginner idea in ${topic}?`, answer: `A small starting point you can practice today.` },
		{ type: 'choice', difficulty: 'easy', question: `When you are new to ${topic}, what helps most?`, answer: 'a little practice every day', options: ['a little practice every day', 'one huge cram session', 'never checking answers'] },
		{ type: 'basic', difficulty: 'medium', question: `Name something a learner of ${topic} might mix up.`, answer: 'Two similar ideas — the card back should keep them apart.' },
		{ type: 'basic', difficulty: 'medium', question: `Why review ${topic} on a later day?`, answer: 'Spacing the practice helps it stick.' },
		{ type: 'choice', difficulty: 'medium', question: 'What should you do when a card feels shaky?', answer: 'see it again sooner', options: ['see it again sooner', 'throw the card away', 'skip the subject'] },
		{ type: 'basic', difficulty: 'hard', question: `What is a deeper question about ${topic}?`, answer: 'How the basics connect when a situation changes.' },
		{ type: 'choice', difficulty: 'hard', question: 'A good explanation on the back of a card should…', answer: 'say why, in plain words', options: ['say why, in plain words', 'only repeat the question', 'use as many jargon words as possible'] },
		{ type: 'basic', difficulty: 'easy', question: `Finish the sentence: I am practicing ${topic} so I can…`, answer: 'remember a little more than yesterday.' },
		{ type: 'basic', difficulty: 'medium', question: 'What does “not yet” mean here?', answer: 'You will see it again. It is not a failure.' },
		{ type: 'choice', difficulty: 'easy', question: 'How long is a good session?', answer: 'a small handful of cards', options: ['a small handful of cards', 'until you are exhausted', 'only when a test is tomorrow'] },
	];
}

function bankFor(topic: string): FixtureQuestion[] {
	const key = topic.trim().toLowerCase();
	if (key === 'spanish') return SPANISH;
	if (key === 'python') return PYTHON;
	if (key === 'biology') return BIOLOGY;
	if (key === 'history') return HISTORY;
	if (key === 'trivia') return TRIVIA;
	return genericFor(topic.trim() || 'this');
}

export function fixtureQuestions(topic: string, avoid: string[] = [], count = 3): FixtureQuestion[] {
	const seen = new Set(avoid.map((item) => item.toLowerCase()));
	const fresh = bankFor(topic).filter((item) => !seen.has(item.question.toLowerCase()));
	return fresh.slice(0, count);
}

export function fixtureDeck(topic: string, count: number, level: PlacementDifficulty | string): CardContent[] {
	const numeric = level === 'Advanced' || level === 'Expert' ? 2 : level === 'Intermediate' ? 1 : 0;
	const pool = bankFor(topic);
	const cards: CardContent[] = [];
	for (let i = 0; i < count; i += 1) {
		const source = pool[i % pool.length];
		const bumped = i >= pool.length ? ` (${i + 1})` : '';
		cards.push({
			question: `${source.question}${bumped}`,
			answer: source.answer,
			explanation: source.explanation,
			type: source.type,
			options: source.options,
		});
	}
	if (numeric > 0 && cards[0]) {
		cards[0] = { ...cards[0], explanation: cards[0].explanation };
	}
	return cards;
}
