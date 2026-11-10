'use client';

import { useState } from 'react';
import { STARTER_SUBJECTS } from '@/lib/config';
import { Dock, DockButton } from '@/components/paper/Dock';
import { PaperChip } from '@/components/paper/PaperChip';

const PLACES: Record<string, { top: string; left: string; rotate: number; z: number }> = {
	python: { top: '2%', left: '52%', rotate: 7, z: 2 },
	biology: { top: '16%', left: '-2%', rotate: -8, z: 3 },
	spanish: { top: '30%', left: '22%', rotate: -2, z: 5 },
	history: { top: '12%', left: '58%', rotate: 6, z: 4 },
	trivia: { top: '54%', left: '0%', rotate: -6, z: 2 },
	other: { top: '56%', left: '40%', rotate: 4, z: 3 },
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
		<div className="wall relative flex min-h-dvh flex-col overflow-hidden">
			<div className="daylight" />
			<svg className="pointer-events-none absolute right-3 top-16 text-[#7d8f72]" width="54" height="70" viewBox="0 0 54 70" aria-hidden>
				<path d="M27 68 C27 40 10 28 8 12 C22 20 32 18 46 8 C34 26 36 40 27 68Z" fill="#8fa67c" />
				<path d="M27 68 C27 42 40 30 48 16 C36 24 32 36 27 68Z" fill="#6e8a5c" />
			</svg>
			<svg className="pointer-events-none absolute bottom-24 left-2 text-[#e0b15a]" width="36" height="36" viewBox="0 0 36 36" aria-hidden>
				<circle cx="18" cy="18" r="7" fill="#f0c36a" />
				<path d="M18 2 v6 M18 28 v6 M2 18 h6 M28 18 h6 M6 6 l4 4 M26 26 l4 4 M30 6 l-4 4 M10 26 l-4 4" stroke="#e0b15a" strokeWidth="2" />
			</svg>
			<div className="flex flex-1 flex-col px-3 pt-10">
				<h1 className="type-display text-center text-ink">What are you practicing?</h1>
				<div className="relative mx-auto mt-2 h-[32rem] w-full max-w-[24rem]">
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
									className={subject.id === 'spanish' ? 'min-w-[9.5rem] px-6 py-5' : 'min-w-[8rem] px-4 py-4'}
									onClick={() => choose(subject.id)}
								/>
							</div>
						);
					})}
					{customOpen && (
						<div className="absolute inset-x-2 top-[18%] z-20">
							<div className="deckle ruled relative px-5 py-5 shadow-[0_16px_30px_rgba(90,60,40,0.16)]">
								<img src="/props/washi-0.png" alt="" className="absolute -top-3 left-8 h-5 w-16 -rotate-3 object-cover" />
								<p className="type-heading text-center text-ink">What do you want to practice?</p>
								<input
									value={custom}
									onChange={(event) => setCustom(event.target.value)}
									placeholder="a short topic"
									maxLength={40}
									className="mt-3 w-full bg-transparent text-center type-prompt-lg text-ink outline-none ring-0 placeholder:text-ink-soft/50 focus:outline-none"
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
								<button
									type="button"
									disabled={!custom.trim()}
									onClick={() => onContinue(custom.trim())}
									className="stitch mx-auto mt-4 flex h-12 items-center rounded-full bg-terracotta px-6 type-button text-ink disabled:opacity-50"
								>
									That's the one
								</button>
							</div>
						</div>
					)}
				</div>
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
