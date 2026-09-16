import type { CardGenerationProvider } from './types';
import { XaiCardProvider } from './xai';

export type { CardGenerationProvider, GeneratedCard, GenerateCardsRequest } from './types';
export { validateGeneratedCards, parseGeneratedCardsJson } from './validate';

/**
 * Resolve the active card-generation provider.
 * Swap implementations here (or via env) without touching deck persistence.
 */
export function getCardGenerationProvider(): CardGenerationProvider {
	const provider = (process.env.CARD_GENERATION_PROVIDER || 'xai').toLowerCase();

	switch (provider) {
		case 'xai':
		default:
			return new XaiCardProvider();
	}
}
