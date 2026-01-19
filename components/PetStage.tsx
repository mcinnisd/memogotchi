import React from 'react';

export function PetStage() {
	return (
		<div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-[#9ca04c]">
			{/* Pixel Grid Background */}
			<div
				className="absolute inset-0 opacity-20 pointer-events-none"
				style={{
					backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
					backgroundSize: '4px 4px'
				}}
			/>

			{/* The Egg */}
			{/* Uses standard Tailwind animate-bounce or a custom keyframe if needed. 
          To make it "wobble occasionally", we can use a custom animation class defined in globals.css or arbitrary value.
          For now, a simple bounce/wobble for the egg. */}
			<div className="relative w-16 h-20 bg-white rounded-[50%_50%_45%_45%] border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] animate-egg-wobble">
				{/* Shiny reflection */}
				<div className="absolute top-3 left-3 w-4 h-6 bg-white opacity-80 rounded-full rotate-[-45deg]" />
				{/* Cracks could go here later */}
			</div>
		</div>
	);
}
