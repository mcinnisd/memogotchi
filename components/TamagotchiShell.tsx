import React from 'react';

interface TamagotchiShellProps {
	children: React.ReactNode;
}

export function TamagotchiShell({ children }: TamagotchiShellProps) {
	return (
		<div className="relative w-[300px] h-[380px] bg-white rounded-[50%_50%_45%_45%] shadow-[0_10px_30px_rgba(0,0,0,0.3),inset_0_-10px_20px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center p-8 border-4 border-gray-200">
			{/* Key Chain Loop */}
			<div className="absolute -top-6 w-8 h-8 rounded-full border-4 border-gray-300 z-0 bg-transparent" />

			{/* Brand */}
			<div className="mb-4 text-center">
				<span className="font-display text-[10px] tracking-widest text-gray-400">MEMOGOTCHI</span>
			</div>

			{/* Screen Bezel */}
			<div className="w-[180px] h-[180px] bg-gray-100 rounded-[20px] p-4 flex items-center justify-center shadow-inner border border-gray-300">
				{/* The Actual LCD Screen */}
				<div className="w-full h-full bg-[#f0f4cc] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)] overflow-hidden relative border border-[#d0d4ac]">
					{children}
				</div>
			</div>

			{/* Controls */}
			<div className="w-full flex justify-center gap-6 mt-8 px-8">
				{/* Button A */}
				<button className="w-8 h-8 bg-yellow-400 rounded-full shadow-[0_4px_0_#d3a100] active:shadow-none active:translate-y-1 transform transition-transform" />
				{/* Button B */}
				<button className="w-8 h-8 bg-yellow-400 rounded-full shadow-[0_4px_0_#d3a100] active:shadow-none active:translate-y-1 transform transition-transform mt-4" />
				{/* Button C */}
				<button className="w-8 h-8 bg-yellow-400 rounded-full shadow-[0_4px_0_#d3a100] active:shadow-none active:translate-y-1 transform transition-transform" />
			</div>
		</div>
	);
}
