import React from 'react';

interface GameShellProps {
	children: React.ReactNode;
}

export function GameShell({ children }: GameShellProps) {
	return (
		<div className="relative w-[320px] h-[580px] bg-gameboy-purple rounded-[20px] p-8 shadow-[0_0_20px_rgba(138,43,226,0.3)] border-4 border-[rgba(100,20,180,0.5)] flex flex-col items-center">
			{/* Power LED */}
			<div className="absolute top-10 left-4 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse opacity-80" />

			{/* Screen Bezel */}
			<div className="w-full h-[280px] bg-[#5a5a6a] rounded-t-[10px] rounded-b-[30px] p-6 flex items-center justify-center mb-6 shadow-inner relative">
				<div className="absolute top-2 text-[10px] tracking-widest text-[#8a8a9a] font-display uppercase">Dot Matrix Stereo Sound</div>

				{/* The Actual LCD Screen */}
				<div className="w-full h-full bg-[#9ca04c] shadow-[inset_0_0_10px_rgba(0,0,0,0.4)] overflow-hidden relative">
					{/* Pixel Grid Overlay for Effect */}
					<div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,6px_100%]" />
					<div className="relative z-0 h-full w-full p-2 overflow-hidden flex flex-col">
						{children}
					</div>
				</div>
			</div>

			{/* Brand */}
			<div className="text-[#330066] font-display italic text-lg mb-8 tracking-tighter opacity-60">Nintendo GAME BOY</div>

			{/* Controls Mockup */}
			<div className="w-full flex justify-between px-4">
				{/* D-Pad */}
				<div className="w-24 h-24 relative">
					<div className="absolute top-0 left-1/3 w-1/3 h-full bg-[#333] rounded-sm shadow-md" />
					<div className="absolute top-1/3 left-0 w-full h-1/3 bg-[#333] rounded-sm shadow-md" />
					<div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-[#222] rounded-full radial-gradient-center" />
				</div>

				{/* A/B Buttons */}
				<div className="w-24 h-24 relative flex items-center justify-center gap-2 transform rotate-[-25deg] mt-4">
					<div className="flex flex-col items-center">
						<div className="w-10 h-10 bg-[#A020F0] rounded-full shadow-md active:shadow-inner mb-1" />
						<span className="text-[#330066] text-xs font-bold font-sans">B</span>
					</div>
					<div className="flex flex-col items-center mt-[-10px]">
						<div className="w-10 h-10 bg-[#A020F0] rounded-full shadow-md active:shadow-inner mb-1" />
						<span className="text-[#330066] text-xs font-bold font-sans">A</span>
					</div>
				</div>
			</div>

			{/* Start/Select */}
			<div className="flex gap-4 mt-8">
				<div className="w-12 h-3 bg-[#333] rounded-full transform rotate-[-25deg] shadow-sm" />
				<div className="w-12 h-3 bg-[#333] rounded-full transform rotate-[-25deg] shadow-sm" />
			</div>
		</div>
	);
}
