export function Windowsill({
	children,
	speech,
}: {
	children: React.ReactNode;
	speech?: string;
}) {
	return (
		<div className="relative mx-1 h-[17.5rem] shrink-0">
			<div className="absolute left-[34%] right-2 top-2 h-[9.6rem] overflow-hidden rounded-[2px] border-[7px] border-[#f6f0e4] bg-[#d7ecf6] shadow-[inset_0_0_0_1px_rgba(90,60,40,0.12)]">
				<img src="/props/window.png" alt="" className="h-full w-full object-cover" />
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120px_80px_at_30%_20%,rgba(255,255,255,0.55),transparent_70%)]" />
				<div className="pointer-events-none absolute inset-y-0 left-1/2 w-[6px] -translate-x-1/2 bg-[#f6f0e4]" />
				<div className="pointer-events-none absolute inset-x-0 top-[46%] h-[6px] -translate-y-1/2 bg-[#f6f0e4]" />
			</div>
			<img
				src="/props/plant.png"
				alt=""
				className="pointer-events-none absolute -left-1 bottom-[1.7rem] z-10 h-[14.2rem] w-auto max-w-[48%] object-contain object-bottom"
			/>
			<div className="sill-board absolute bottom-2 left-0 right-0 z-[25] h-8 rounded-sm" />
			<div className="pointer-events-none absolute bottom-[2.15rem] right-[10%] z-[26] h-3 w-[38%] rounded-[50%] bg-[rgba(120,80,50,0.18)] blur-[1px]" />
			<div className="absolute bottom-[2.35rem] right-[3%] z-30 h-[11.5rem] w-[48%]">{children}</div>
			{speech && (
				<div className="deckle absolute bottom-[8.4rem] right-1 z-40 max-w-[7.6rem] rotate-2 bg-[#f7f1e4] px-2 py-1 text-center type-helper text-ink shadow-paper">
					{speech}
				</div>
			)}
		</div>
	);
}
