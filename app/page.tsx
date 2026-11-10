import { MemogotchiApp } from '@/components/MemogotchiApp';
import { PreviewApp } from '@/components/PreviewApp';

export const dynamic = 'force-dynamic';

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ preview?: string }> | { preview?: string };
}) {
	const params = await searchParams;
	if (params.preview) {
		return (
			<main className="min-h-dvh">
				<PreviewApp name={params.preview} />
			</main>
		);
	}
	return (
		<main className="min-h-dvh">
			<MemogotchiApp />
		</main>
	);
}
