export function Windowsill({
	children,
	speech,
}: {
	children: React.ReactNode;
	speech?: string;
}) {
	return (
		<div className="relative mx-1 h-[13.5rem] shrink-0">
			<div className="absolute left-2 right-6 top-1 h-[8.6rem] overflow-hidden rounded-sm border-[7px] border-[#f4efe6] bg-[#b9ddf2] shadow-inner">
				<div className="absolute inset-0 bg-gradient-to-b from-[#d9f1ff] via-[#c5e7a4] to-[#8fb85a]" />
				<div className="absolute left-[8%] top-[18%] h-8 w-14 rounded-full bg-white/80" />
				<div className="absolute -bottom-2 left-[6%] h-16 w-16 rounded-full bg-[#7da348]" />
				<div className="absolute -bottom-3 left-[22%] h-20 w-20 rounded-full bg-[#9cbe55]" />
				<div className="absolute -bottom-4 right-[8%] h-24 w-24 rounded-full bg-[#6f9a3c]" />
				<div className="absolute -bottom-2 right-[28%] h-16 w-14 rounded-full bg-[#c3d56a]" />
				<div className="absolute inset-y-0 left-1/2 w-[7px] -translate-x-1/2 bg-[#f4efe6]/90" />
				<div className="absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2 bg-[#f4efe6]/90" />
			</div>
			<div className="absolute bottom-7 left-0 right-0 h-4 rounded-sm bg-gradient-to-b from-[#efd3a4] to-[#e2bc86] shadow-[0_6px_0_#d7b07a]" />
			<div className="absolute bottom-[1.7rem] left-2">
				<svg width="78" height="92" viewBox="0 0 78 92" aria-hidden>
					<ellipse cx="39" cy="86" rx="26" ry="5" fill="rgba(90,60,40,0.13)" />
					<path d="M18 40 h42 l-6 36 h-30 z" fill="#c4683e" />
					<path d="M16 36 h46 l-2 8 h-42 z" fill="#d4845c" />
					<ellipse cx="32" cy="58" rx="6" ry="4" fill="#b85a34" opacity="0.45" />
					<path d="M22 34 c4-16 8-22 12-22 c2 8 1 16-2 22" fill="#6e9a48" />
					<path d="M34 30 c6-18 14-24 16-22 c-2 10-6 18-12 24" fill="#8fb85a" />
					<path d="M40 32 c8-14 16-16 18-12 c-4 8-10 14-16 16" fill="#5e8a3e" />
				</svg>
			</div>
			<div className="absolute bottom-6 right-2 w-40">{children}</div>
			{speech && (
				<div className="absolute bottom-[6.2rem] right-1 max-w-[8.2rem] rotate-2 rounded-sm bg-paper px-2 py-1 text-center font-hand text-[0.95rem] leading-tight text-ink shadow-paper">
					{speech}
				</div>
			)}
		</div>
	);
}
