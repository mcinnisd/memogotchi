'use client';

import { useState } from 'react';
import type { SpeciesId } from '@/lib/species';
import { speciesName } from '@/lib/species';
import { Dock, DockButton } from '@/components/paper/Dock';
import { LivingPet } from '@/components/pets/LivingPet';
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
			<div className="pt-6">
				<Windowsill>
					<LivingPet species={species} state="hatchling" />
				</Windowsill>
			</div>
			<div className="mx-auto mt-2 flex w-[88%] flex-col items-center gap-3">
				<p className="torn w-full bg-paper px-4 py-3 text-center font-hand text-2xl text-ink">
					I think I'll call you,
				</p>
				<label className="torn grid-paper relative w-full px-4 py-4">
					<span className="absolute -left-2 top-4 h-6 w-10 -rotate-6 bg-[#d9c7a4]/90" />
					<span className="absolute -right-2 bottom-3 h-6 w-10 rotate-6 bg-[#d9c7a4]/80" />
					<span className="sr-only">Name</span>
					<input
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={24}
						className="w-full bg-transparent text-center font-display text-4xl text-ink outline-none"
					/>
				</label>
				<p className="font-hand text-lg text-ink-soft">You can always change this later.</p>
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
