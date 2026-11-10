export interface OwnedCard {
	id: string;
	pet_id?: string | null;
	topic?: string | null;
}

/**
 * A card belongs to one pet. Same topic string on another pet is still a bleed.
 */
export function cardsForPet<T extends OwnedCard>(cards: T[], petId: string): T[] {
	return cards.filter((card) => card.pet_id === petId);
}
