export type GeneratedCardType = 'basic' | 'choice';

export interface GeneratedCard {
	question: string;
	answer: string;
	explanation?: string;
	type: GeneratedCardType;
	options?: string[];
}

export interface GenerateCardsRequest {
	topic: string;
	difficultyLabel: string;
	difficultyLevel: number;
	count?: number;
	additionalContext?: string;
}

/**
 * Model-agnostic card generation. Swap providers without rewriting product code.
 * Callers may invoke this from a background job later; the interface stays sync-Promise for now.
 */
export interface CardGenerationProvider {
	generateCards(request: GenerateCardsRequest): Promise<GeneratedCard[]>;
}
