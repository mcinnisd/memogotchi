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
		<div className="page relative flex min-h-dvh flex-col">
			<div className="pt-4">
				<Windowsill>
					<div className="h-full">
						<PetArt species={species} state="well_loved" />
					</div>
				</Windowsill>
			</div>
			<div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-evenly px-4 py-6">
				<p className="notepad w-full bg-[#fbf6ec] px-4 py-3 text-center type-heading text-ink shadow-paper">
					I think I'll call you,
				</p>
				<label className="notepad ruled relative w-full px-4 py-5 shadow-paper">
					<img src="/props/washi-2.png" alt="" className="absolute -left-1 top-3 h-5 w-12 -rotate-6 object-cover" />
					<img src="/props/washi-0.png" alt="" className="absolute -right-1 bottom-3 h-5 w-12 rotate-3 object-cover" />
					<span className="sr-only">Name</span>
					<input
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={24}
						className="card-copy w-full bg-[#fbf6ec] text-center type-prompt-xl text-ink outline-none"
					/>
				</label>
				<p className="text-center type-helper text-ink-soft">You can always change this later.</p>
			</div>
			<Dock>
				<DockButton className="w-56" disabled={!name.trim()} onClick={() => onContinue(name.trim())}>
					Continue
				</DockButton>
			</Dock>
		</div>
	);
}
