'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAllCards(userId: string) {
	const supabase = await createClient()

	// Fetch all cards belonging to decks owned by the user
	const { data: validData, error: complexError } = await supabase
		.from('cards')
		.select(`
			*,
			deck:decks!inner(
				topic,
				user_id
			)
		`)
		.eq('deck.user_id', userId)
		.order('created_at', { ascending: false })

	if (complexError) {
		console.error('Error fetching cards collection:', complexError)
		return []
	}

	return validData || []
}
