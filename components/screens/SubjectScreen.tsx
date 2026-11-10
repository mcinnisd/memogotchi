'use client';

import { useState } from 'react';
import { STARTER_SUBJECTS } from '@/lib/config';
import { Dock, DockButton } from '@/components/paper/Dock';
import { PaperChip } from '@/components/paper/PaperChip';

const PLACES: Record<string, { top: string; left: string; rotate: number; z: number }> = {
	python: { top: '0%', left: '50%', rotate: 2, z: 2 },
	biology: { top: '20%', left: '0%', rotate: -2, z: 3 },
	spanish: { top: '38%', left: '20%', rotate: -1, z: 5 },
	history: { top: '22%', left: '62%', rotate: 1.5, z: 3 },
	trivia: { top: '60%', left: '0%', rotate: -1.5, z: 2 },
	other: { top: '70%', left: '38%', rotate: 1.5, z: 4 },
};

const IDEAS = ['Cooking', 'Piano', 'Geography', 'Origami'];

export function SubjectScreen({
	onContinue,
	initial = null,
	startCustom = false,
}: {
	onContinue: (topic: string) => void;
	initial?: string | null;
	startCustom?: boolean;
}) {
	const [selected, setSelected] = useState<string | null>(startCustom ? 'other' : initial);
	const [customOpen, setCustomOpen] = useState(startCustom);
	const [custom, setCustom] = useState('');
	const ready = selected === 'other' ? custom.trim().length > 0 : Boolean(selected);

	const choose = (id: string) => {
		setSelected(id);
		if (id === 'other') setCustomOpen(true);
	};

	return (
		<div className="page relative flex min-h-dvh flex-col overflow-hidden">
			<div className="flex min-h-0 flex-1 flex-col px-4 pt-10">
				<h1 className="type-display text-center text-ink">What are you practicing?</h1>
				{customOpen ? (
					<div className="flex flex-1 items-center">
						<div className="notepad relative w-full bg-[#fbf6ec] px-5 py-6 shadow-paper">
							<img src="/props/washi-0.png" alt="" className="absolute -top-3 left-8 h-5 w-16 -rotate-2 object-cover" />
							<p className="type-heading text-center text-ink">What do you want to practice?</p>
							<input
								value={custom}
								onChange={(event) => setCustom(event.target.value)}
								placeholder="a short topic"
								maxLength={40}
								className="mt-3 w-full bg-transparent text-center type-prompt-lg text-ink outline-none ring-0 placeholder:text-ink-soft/50 focus:outline-none focus:ring-0"
								autoFocus
							/>
							<div className="mt-3 flex flex-wrap justify-center gap-2">
								{IDEAS.map((idea) => (
									<button
										key={idea}
										type="button"
										onClick={() => setCustom(idea)}
										className="rounded-full bg-[#f6efe4] px-3 py-1 type-helper text-ink"
									>
										{idea}
									</button>
								))}
							</div>
							<div className="mt-5 flex justify-center">
								<DockButton disabled={!custom.trim()} onClick={() => onContinue(custom.trim())}>
									That's the one
								</DockButton>
							</div>
						</div>
					</div>
				) : (
					<div className="flex flex-1 items-end pb-1">
					<div className="relative mx-auto h-[28rem] w-full max-w-[24rem]">
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
										className={
											subject.id === 'spanish'
												? 'min-w-[9.5rem] px-6 py-5'
												: subject.id === 'other'
													? 'min-w-[10.5rem] px-4 py-4'
													: 'min-w-[8rem] px-4 py-4'
										}
										onClick={() => choose(subject.id)}
									/>
								</div>
							);
						})}
					</div>
					</div>
				)}
			</div>
			<Dock>
				<DockButton
					disabled={!ready || customOpen}
					className="w-56"
					onClick={() => onContinue(selected === 'other' ? custom.trim() : STARTER_SUBJECTS.find((item) => item.id === selected)?.label ?? '')}
				>
					Continue
				</DockButton>
			</Dock>
		</div>
	);
}
