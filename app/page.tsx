import { getDueCards } from '@/actions/getDueCards';
import { getDecks } from '@/actions/getDecks';
import HomeLoop from '@/components/HomeLoop';
import OnboardingWizard from '@/components/OnboardingWizard';
import { DEMO_USER_ID } from '@/lib/demo-user';
import { createClient } from '@/utils/supabase/server';

interface PageProps {
	searchParams: Promise<{ topic?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
	const supabase = await createClient();
	const userId = DEMO_USER_ID;
	const params = await searchParams;
	const activeTopic = params.topic;

	const decks = await getDecks(userId);
	const topicToLoad = activeTopic || decks[0]?.topic;

	const [profileRes, cards] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', userId).single(),
		topicToLoad ? getDueCards(userId, topicToLoad) : Promise.resolve([]),
	]);

	const profile = profileRes.data;

	if (!profile || decks.length === 0) {
		return <OnboardingWizard userId={userId} />;
	}

	return (
		<HomeLoop
			initialProfile={profile}
			initialCards={cards}
			decks={decks}
			userId={userId}
			activeTopic={topicToLoad}
		/>
	);
}
