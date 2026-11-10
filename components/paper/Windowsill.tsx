export function Windowsill({
	children,
	speech,
}: {
	children: React.ReactNode;
	speech?: string;
}) {
	return (
		<div className="relative mx-1 h-64 shrink-0">
			<div className="absolute left-[22%] right-3 top-1 h-40 overflow-hidden rounded-[3px] border-[8px] border-[#f4efe4] bg-[#c5e4f4] shadow-[inset_0_0_0_1px_rgba(90,60,40,0.15)]">
				<img src="/props/window.png" alt="" className="h-full w-full object-cover" />
				<div className="pointer-events-none absolute inset-y-0 left-1/2 w-[7px] -translate-x-1/2 bg-[#f4efe4]/95" />
				<div className="pointer-events-none absolute inset-x-0 top-[46%] h-[7px] -translate-y-1/2 bg-[#f4efe4]/95" />
			</div>
			<img
				src="/props/plant.png"
				alt=""
				className="pointer-events-none absolute -left-1 bottom-3 z-10 h-[15.5rem] w-auto max-w-[46%] object-contain object-bottom"
			/>
			<div
				className="absolute bottom-3 left-0 right-0 z-[25] h-7 rounded-sm shadow-[0_9px_0_#d7b184]"
				style={{
					backgroundColor: '#e8c99a',
					backgroundImage: 'url(/props/sill.png)',
					backgroundSize: '180px 100%',
					backgroundRepeat: 'repeat-x',
				}}
			/>
			<div className="absolute bottom-6 right-[4%] z-30 h-48 w-[46%]">{children}</div>
			{speech && (
				<div className="absolute bottom-[7.2rem] right-1 z-40 max-w-[7.5rem] rotate-2 bg-[#f7f1e4] px-2 py-1 text-center font-hand text-[1.05rem] leading-tight text-ink shadow-paper"
					style={{ clipPath: 'polygon(2% 8%, 8% 0, 96% 2%, 100% 18%, 98% 88%, 92% 100%, 6% 96%, 0 70%)' }}
				>
					{speech}
				</div>
			)}
		</div>
	);
}
