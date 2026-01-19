import { getAllCards } from "@/actions/getAllCards";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CollectionPage() {
	const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
	const cards = await getAllCards(USER_ID);

	return (
		<div className="min-h-screen bg-black pb-24">
			<header className="px-4 py-4 border-b border-zinc-900 sticky top-0 bg-black/90 backdrop-blur z-10 flex items-center">
				<Link href="/" className="p-2 text-zinc-500 hover:text-white">
					<ArrowLeft size={20} />
				</Link>
				<h1 className="flex-1 text-sm font-bold text-zinc-500 uppercase tracking-widest text-center pr-8">
					All Cards ({cards.length})
				</h1>
			</header>

			<div className="p-4 grid grid-cols-2 gap-3">
				{cards.map((card: any) => (
					<div key={card.id} className="aspect-[3/4] bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
						<div className="absolute top-0 right-0 p-1.5 text-[8px] text-zinc-600 uppercase font-bold">
							{card.deck?.topic}
						</div>

						<div className="flex-1 flex items-center justify-center text-center pt-4">
							<p className="text-zinc-300 text-xs font-medium line-clamp-3">
								{card.content?.question || card.front}
							</p>
						</div>

						<div className="border-t border-zinc-800 pt-2 mt-2">
							<p className="text-[10px] text-green-500 font-mono truncate">
								{card.content?.answer || card.back}
							</p>
						</div>

						{/* SRS Info */}
						<div className="flex justify-between text-[8px] text-zinc-600 font-mono mt-1">
							<span>EF: {card.ease_factor?.toFixed(1)}</span>
							<span>INT: {card.interval}d</span>
						</div>
					</div>
				))}
				{cards.length === 0 && (
					<div className="col-span-2 text-center text-zinc-500 py-12">
						No cards yet. Start learning to see your collection!
					</div>
				)}
			</div>
		</div>
	);
}
