import { cn } from '@/lib/cn';

export function PaperTag({
	children,
	tone = 'cream',
	onClick,
	className,
}: {
	children: React.ReactNode;
	tone?: 'cream' | 'sage';
	onClick?: () => void;
	className?: string;
}) {
	const Tag = onClick ? 'button' : 'div';
	return (
		<Tag
			onClick={onClick}
			className={cn(
				'stitch relative inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-hand text-2xl text-ink shadow-sm',
				tone === 'sage' ? 'bg-sage' : 'bg-paper',
				onClick && 'active:translate-y-px',
				className
			)}
		>
			{children}
		</Tag>
	);
}
