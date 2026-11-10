'use client';

import { useState } from 'react';
import { STARTER_SUBJECTS } from '@/lib/config';
import { Dock, DockButton } from '@/components/paper/Dock';
import { PaperChip } from '@/components/paper/PaperChip';

const PLACES: Record<string, { top: string; left: string; rotate: number; z: number }> = {
	python: { top: '0%', left: '52%', rotate: 6, z: 2 },
	biology: { top: '14%', left: '-8%', rotate: -8, z: 4 },
	spanish: { top: '24%', left: '22%', rotate: -2, z: 5 },
	history: { top: '18%', left: '66%', rotate: 7, z: 4 },
	trivia: { top: '54%', left: '2%', rotate: -5, z: 2 },
	other: { top: '58%', left: '42%', rotate: 4, z: 3 },
};

export function SubjectScreen({
	onContinue,
	initial = null,
}: {
	onContinue: (topic: string) => void;
	initial?: string | null;
}) {
	const [selected, setSelected] = useState<string | null>(initial);
	const [custom, setCustom] = useState('');
	const ready = selected === 'other' ? custom.trim().length > 0 : Boolean(selected);

	return (
		<div className="wall relative flex min-h-dvh flex-col">
			<div className="daylight" />
			<div className="flex flex-1 flex-col px-4 pt-16">
				<h1 className="text-center font-display text-[2rem] font-semibold leading-tight text-ink">
					What are you practicing?
				</h1>
				<div className="relative mx-auto mt-6 h-[22rem] w-full max-w-[22rem]">
					{STARTER_SUBJECTS.map((subject, index) => {
						const place = PLACES[subject.id];
						return (
							<div
								key={subject.id}
								className="absolute"
								style={{ top: place.top, left: place.left, zIndex: selected === subject.id ? 6 : place.z }}
							>
								<PaperChip
									label={subject.label}
									rotation={place.rotate}
									selected={selected === subject.id}
									washi={index}
									className={subject.id === 'spanish' ? 'min-w-[8.5rem] px-5 py-4 text-[1.85rem]' : 'min-w-[7rem]'}
									onClick={() => setSelected(subject.id)}
								/>
							</div>
						);
					})}
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
