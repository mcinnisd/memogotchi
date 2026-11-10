'use client';

import { useState } from 'react';
import { SPECIES, SPECIES_IDS, type SpeciesId } from '@/lib/species';
import { Dock, DockButton } from '@/components/paper/Dock';
import { PaperTag } from '@/components/paper/PaperTag';
import { PetArt } from '@/components/pets/PetArt';

export function HatchScreen({
	topic,
	onContinue,
}: {
	topic: string;
	onContinue: (species: SpeciesId) => void;
}) {
	const [selected, setSelected] = useState<SpeciesId>('chick');
	const others = SPECIES_IDS.filter((id) => id !== selected);

	return (
		<div className="notebook page flex min-h-dvh flex-col px-4 pb-4 pt-8">
			<h1 className="type-display text-center text-ink">Who hatches?</h1>
			<div className="mt-3 flex justify-center">
				<PaperTag tone="sage">{topic}</PaperTag>
			</div>
			<button
				type="button"
				className="notepad mx-auto mt-4 flex w-[78%] flex-col items-center bg-[#fbf6ec] px-3 py-3 shadow-paper"
			>
				<div className="h-52 w-full">
					<PetArt species={selected} state="well_loved" />
				</div>
				<div className="type-heading text-ink">{SPECIES[selected].name}</div>
			</button>
			<div className="mt-4 grid grid-cols-3 gap-2">
				{others.slice(0, 3).map((id) => (
					<SpeciesTile key={id} id={id} onClick={() => setSelected(id)} />
				))}
			</div>
			<div className="mt-2 grid grid-cols-4 gap-2">
				{others.slice(3).map((id) => (
					<SpeciesTile key={id} id={id} onClick={() => setSelected(id)} />
				))}
			</div>
			<p className="type-helper mt-auto pt-4 text-right leading-tight text-ink-soft">
				Learn a little.<br />Care every day.<br />Grow together.<br />♡
			</p>
			<Dock>
				<DockButton className="w-48" onClick={() => onContinue(selected)}>Continue</DockButton>
			</Dock>
		</div>
	);
}

function SpeciesTile({ id, onClick }: { id: SpeciesId; onClick: () => void }) {
	return (
		<button type="button" onClick={onClick} className="notepad flex flex-col items-center bg-[#fbf6ec] px-1 py-1 shadow-sm">
			<div className="h-14 w-14">
				<PetArt species={id} state="well_loved" brighten={1} />
			</div>
			<span className="type-helper text-ink">{SPECIES[id].name}</span>
		</button>
	);
}
