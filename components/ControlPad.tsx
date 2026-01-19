'use client';

import { useHaptic } from "@/hooks/useHaptic";

interface ControlPadProps {
	onGrade: (grade: number) => void;
	disabled?: boolean;
}

export default function ControlPad({ onGrade, disabled }: ControlPadProps) {
	const { trigger } = useHaptic();

	const handlePress = (grade: number) => {
		if (disabled) return;

		// Haptic feedback based on grade
		if (grade === 1) trigger('error'); // Again
		else if (grade === 4) trigger('success'); // Good
		else if (grade === 5) trigger('light'); // Easy
		else trigger('medium'); // Hard

		onGrade(grade);
	};

	return (
		<div className="grid grid-cols-4 gap-2 w-full p-4 pb-safe">
			<button
				disabled={disabled}
				onClick={() => handlePress(1)}
				className="h-16 rounded-xl bg-red-900/30 border-2 border-red-900/50 text-red-500 font-bold uppercase tracking-wider text-xs active:bg-red-500 active:text-black transition-all flex flex-col items-center justify-center"
			>
				<span>Again</span>
				<span className="text-[9px] opacity-60">Wait..</span>
			</button>

			<button
				disabled={disabled}
				onClick={() => handlePress(3)}
				className="h-16 rounded-xl bg-yellow-900/30 border-2 border-yellow-900/50 text-yellow-500 font-bold uppercase tracking-wider text-xs active:bg-yellow-500 active:text-black transition-all flex flex-col items-center justify-center"
			>
				<span>Hard</span>
				<span className="text-[9px] opacity-60">Diff..</span>
			</button>

			<button
				disabled={disabled}
				onClick={() => handlePress(4)}
				className="h-16 rounded-xl bg-green-900/30 border-2 border-green-900/50 text-green-500 font-bold uppercase tracking-wider text-xs active:bg-green-500 active:text-black transition-all flex flex-col items-center justify-center"
			>
				<span>Good</span>
				<span className="text-[9px] opacity-60">Nice</span>
			</button>

			<button
				disabled={disabled}
				onClick={() => handlePress(5)}
				className="h-16 rounded-xl bg-blue-900/30 border-2 border-blue-900/50 text-blue-500 font-bold uppercase tracking-wider text-xs active:bg-blue-500 active:text-black transition-all flex flex-col items-center justify-center"
			>
				<span>Easy</span>
				<span className="text-[9px] opacity-60">Ez Pz</span>
			</button>
		</div>
	);
}
