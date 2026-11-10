import { cn } from '@/lib/cn';

const WASHI = ['#d7c4a2', '#b7c4a2', '#e7b89a', '#c9c3a2', '#d8b7a4', '#aebf9a'];

export function PaperChip({
	label,
	rotation = 0,
	selected = false,
	washi = 0,
	onClick,
	className,
}: {
	label: string;
	rotation?: number;
	selected?: boolean;
	washi?: number;
	onClick?: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			style={{ transform: `rotate(${rotation}deg)` }}
			className={cn(
				'relative min-w-[7.5rem] px-4 py-3 text-center font-hand text-[1.65rem] leading-none text-ink shadow-paper',
				selected ? 'bg-[#f4c3ae]' : 'grid-paper',
				className
			)}
		>
			<span
				className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rounded-[1px] opacity-90"
				style={{
					backgroundColor: WASHI[washi % WASHI.length],
					backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.35) 3px, rgba(255,255,255,0.35) 5px)',
				}}
			/>
			<span className="pointer-events-none absolute inset-1 rounded-sm border border-dashed border-[#6a4b38]/25" />
			{label}
		</button>
	);
}
