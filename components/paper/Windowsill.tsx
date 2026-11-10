export function Windowsill({
	children,
	speech,
}: {
	children: React.ReactNode;
	speech?: string;
}) {
	return (
		<div className="relative mx-4 mt-3">
			<img src="/props/sill-scene.png" alt="" className="pointer-events-none block h-auto w-full select-none" />
			<div className="absolute bottom-[16%] right-[5%] h-[48%] w-[38%]">{children}</div>
			{speech && (
				<div className="notepad absolute bottom-[48%] right-[3%] z-10 max-w-[8rem] rotate-1 bg-[#f7f1e4] px-2 py-1 text-center type-helper text-ink shadow-paper">
					{speech}
				</div>
			)}
		</div>
	);
}
