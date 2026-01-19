import { getDueCards } from "@/actions/getDueCards";
import StudySession from "@/components/StudySession";

export default async function StudyPage() {
	const USER_ID = 'user-1';

	// Fetch cards server-side
	const dueCards = await getDueCards(USER_ID);

	return (
		<div className="min-h-screen">
			<header className="px-6 py-4 border-b border-zinc-900">
				<h1 className="text-sm font-bold text-zinc-500 uppercase tracking-widest text-center">Study Session</h1>
			</header>

			<StudySession initialCards={dueCards} userId={USER_ID} />
		</div>
	);
}
