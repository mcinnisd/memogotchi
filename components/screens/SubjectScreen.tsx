'use client';

import { useState } from 'react';
import { STARTER_SUBJECTS } from '@/lib/config';
import { Dock, DockButton } from '@/components/paper/Dock';
import { PaperChip } from '@/components/paper/PaperChip';

const PLACES: Record<string, string> = {
	python: 'right-2 top-2',
	biology: 'left-1 top-16',
	spanish: 'left-1/2 top-12 -translate-x-1/2',
	history: 'right-0 top-[5.5rem]',
	trivia: 'left-3 top-44',
	other: 'right-2 top-[12.5rem]',
};

export function SubjectScreen({
	onContinue,
}: {
	onContinue: (topic: string) => void;
}) {
	const [selected, setSelected] = useState<string | null>(null);
	const [custom, setCustom] = useState('');
	const ready = selected === 'other' ? custom.trim().length > 0 : Boolean(selected);

	return (
		<div className="wall relative flex min-h-dvh flex-col">
			<div className="daylight" />
			<div className="flex flex-1 flex-col px-4 pt-16">
				<h1 className="text-center font-display text-[2rem] font-semibold leading-tight text-ink">
					What are you practicing?
				</h1>
				<div className="relative mx-auto mt-8 h-80 w-full max-w-sm flex-1">
					{STARTER_SUBJECTS.map((subject, index) => (
						<div key={subject.id} className={`absolute ${PLACES[subject.id] ?? ''}`}>
							<PaperChip
								label={subject.label}
								rotation={subject.rotation}
								selected={selected === subject.id}
								washi={index}
								onClick={() => setSelected(subject.id)}
							/>
						</div>
					))}
				</div>
				{selected === 'other' && (
					<label className="mx-auto mt-2 block w-full max-w-xs">
						<span className="sr-only">Your topic</span>
						<input
							value={custom}
							onChange={(event) => setCustom(event.target.value)}
							placeholder="A short topic"
							maxLength={40}
							className="w-full rounded-xl border border-dashed border-[#6a4b38]/40 bg-paper px-3 py-2 text-center font-hand text-2xl text-ink outline-none"
							autoFocus
						/>
					</label>
				)}
			</div>
			<Dock>
				<DockButton
					disabled={!ready}
					className="w-56"
					onClick={() => onContinue(selected === 'other' ? custom.trim() : STARTER_SUBJECTS.find((item) => item.id === selected)?.label ?? '')}
				>
					Continue
				</DockButton>
			</Dock>
		</div>
	);
}
