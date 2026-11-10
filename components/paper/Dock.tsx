import { cn } from '@/lib/cn';

export function Dock({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={cn('flex items-end justify-center gap-3 px-4 pb-4 pt-1', className)}>
			{children}
		</div>
	);
}

export function DockButton({
	children,
	variant = 'primary',
	onClick,
	disabled,
	className,
	type = 'button',
}: {
	children: React.ReactNode;
	variant?: 'primary' | 'secondary' | 'quiet';
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	type?: 'button' | 'submit';
}) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'stitch relative inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 font-body text-xl font-extrabold text-ink transition-transform',
				'font-hand disabled:opacity-50',
				!disabled && 'active:translate-y-px',
				variant === 'primary' && 'bg-terracotta',
				variant === 'secondary' && 'bg-sage',
				variant === 'quiet' && 'bg-[#f6efe4]',
				className
			)}
		>
			{children}
		</button>
	);
}
