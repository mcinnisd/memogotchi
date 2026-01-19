import { createClient } from '@/utils/supabase/server';
import { getDueCards } from '@/actions/getDueCards';
import { getDecks } from '@/actions/getDecks';
import HomeLoop from '@/components/HomeLoop';
import OnboardingWizard from '@/components/OnboardingWizard';

interface PageProps {
	searchParams: Promise<{ topic?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
	const supabase = await createClient();
	const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
	const params = await searchParams;
	const activeTopic = params.topic;

	// Fetch decks first to determine default topic
	const decks = await getDecks(USER_ID);

	// Determine which topic to load
	const topicToLoad = activeTopic || decks[0]?.topic;

	// Parallel Fetch: Profile + Cards (filtered by topic)
	const [profileRes, cards] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', USER_ID).single(),
		topicToLoad ? getDueCards(USER_ID, topicToLoad) : []
	]);

	const profile = profileRes.data;

	// Onboarding Check: If no profile or no decks (new user state)
	if (!profile || !decks || decks.length === 0) {
		return <OnboardingWizard userId={USER_ID} />;
	}

	return (
		<main className="min-h-screen bg-black">
			<HomeLoop
				initialProfile={profile}
				initialCards={cards}
				decks={decks}
				userId={USER_ID}
				activeTopic={topicToLoad}
			/>
		</main>
	);
}
