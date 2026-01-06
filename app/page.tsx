import { GameShell } from "@/components/GameShell";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24">
			<GameShell>
				<div className="flex flex-col items-center justify-center h-full text-retro-black">
					<h1 className="text-xl font-display mb-4 animate-pulse">MEMOGOTCHI</h1>
					<p className="text-sm">PRESS START</p>
				</div>
			</GameShell>
		</main>
	);
}
