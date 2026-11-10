'use client';

import { useState } from 'react';
import type { SpeciesId } from '@/lib/species';
import { speciesName } from '@/lib/species';
import { Dock, DockButton } from '@/components/paper/Dock';
import { PetArt } from '@/components/pets/PetArt';
import { Windowsill } from '@/components/paper/Windowsill';

export function NameScreen({
	species,
	onContinue,
}: {
	species: SpeciesId;
	onContinue: (name: string) => void;
}) {
	const [name, setName] = useState(speciesName(species));

	return (
		<div className="wall relative flex min-h-dvh flex-col">
			<div className="daylight" />
			<div className="pt-4">
				<Windowsill>
					<div className="h-full">
						<PetArt species={species} state="well_loved" />
					</div>
				</Windowsill>
			</div>
			<div className="mx-auto mt-4 flex w-[88%] flex-col items-center gap-4">
				<p className="deckle w-full bg-[#fbf6ec] px-4 py-3 text-center type-heading text-ink shadow-paper">
					I think I'll call you,
				</p>
				<label className="deckle ruled relative w-full px-4 py-5 shadow-paper">
					<img src="/props/washi-2.png" alt="" className="absolute -left-1 top-3 h-5 w-12 -rotate-12 object-cover" />
					<img src="/props/washi-0.png" alt="" className="absolute -right-1 bottom-3 h-5 w-12 rotate-6 object-cover" />
					<span className="sr-only">Name</span>
					<input
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={24}
						className="w-full bg-transparent text-center type-prompt-xl text-ink outline-none"
					/>
				</label>
				<p className="type-helper text-ink-soft">You can always change this later.</p>
			</div>
			<div className="mt-auto">
				<Dock>
					<DockButton className="w-56" disabled={!name.trim()} onClick={() => onContinue(name.trim())}>
						Continue
					</DockButton>
				</Dock>
			</div>
		</div>
	);
}
