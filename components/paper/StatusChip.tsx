import type { CareStatus } from '@/lib/care/types';
import { cn } from '@/lib/cn';

const COPY: Record<CareStatus, string> = {
	looked_after: 'looked after',
	a_little_hungry: 'a little hungry',
	needs_love: 'needs love',
};

function Leaf() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
			<path d="M3 12 C4 6, 10 3, 13 3 C12 8, 8 12, 3 13 Z" fill="#6f8a52" />
			<path d="M4 12 C7 9, 10 6, 13 3" stroke="#3e2c22" strokeWidth="1" fill="none" />
		</svg>
	);
}

function Bowl() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
			<path d="M2 7 h12 a6 5 0 0 1 -12 0z" fill="#f4e2cf" stroke="#3e2c22" strokeWidth="1" />
			<path d="M6 4 h4" stroke="#3e2c22" strokeWidth="1" strokeLinecap="round" />
		</svg>
	);
}

export function StatusChip({ status, className }: { status: CareStatus; className?: string }) {
	const tone = status === 'needs_love'
		? 'bg-[#d36b4c] text-[#fff8f3]'
		: status === 'a_little_hungry'
			? 'bg-sage text-[#31422c]'
			: 'bg-[#f3e4cf] text-ink';
	return (
		<span className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-1 type-helper leading-none', tone, className)}>
			{status === 'a_little_hungry' && <Leaf />}
			{status === 'needs_love' && <Bowl />}
			{COPY[status]}
		</span>
	);
}
