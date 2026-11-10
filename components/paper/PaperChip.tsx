import { cn } from '@/lib/cn';

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
				'notepad relative min-w-[7.5rem] px-4 py-3 text-center type-heading text-ink shadow-paper',
				selected ? 'bg-[#f4c3ae]' : 'bg-[#fbf6ec]',
				className
			)}
		>
			<img
				src={`/props/washi-${washi % 3}.png`}
				alt=""
				className="pointer-events-none absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 object-cover shadow-sm"
			/>
			{label}
		</button>
	);
}
