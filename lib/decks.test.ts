import { cardsForPet } from '@/lib/decks';

describe('deck separation', () => {
	const cards = [
		{ id: 'hola', pet_id: 'pet-spanish', topic: 'Spanish' },
		{ id: 'adios', pet_id: 'pet-spanish', topic: 'Spanish' },
		{ id: 'print', pet_id: 'pet-python', topic: 'Python' },
		{ id: 'stray', pet_id: 'pet-other', topic: 'Spanish' },
	];

	test('a pet only receives its own cards', () => {
		expect(cardsForPet(cards, 'pet-spanish').map((card) => card.id)).toEqual(['hola', 'adios']);
	});

	test('a matching topic string does not leak another pet into the stack', () => {
		const spanish = cardsForPet(cards, 'pet-spanish');
		expect(spanish.find((card) => card.id === 'stray')).toBeUndefined();
		expect(spanish.every((card) => card.pet_id === 'pet-spanish')).toBe(true);
	});

	test('an empty pet gets an empty stack', () => {
		expect(cardsForPet(cards, 'pet-new')).toEqual([]);
	});
});
