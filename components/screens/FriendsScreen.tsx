'use client';

import { useState } from 'react';
import { spriteFor } from '@/lib/care';
import { homeyStatus } from '@/lib/care/homey';
import type { PetRecord } from '@/lib/care/types';
import { FriendRow } from '@/components/paper/FriendRow';
import { DockButton } from '@/components/paper/Dock';
import { EggArt } from '@/components/pets/PetArt';
import { sendMagicLink } from '@/actions/session';

export function FriendsScreen({
	pets,
	showNest,
	onOpen,
	onRename,
	onDelete,
	onHatch,
}: {
	pets: PetRecord[];
	showNest?: boolean;
	onOpen: (id: string) => void;
	onRename: (id: string, name: string) => void;
	onDelete: (id: string) => void;
	onHatch: () => void;
}) {
	const [pending, setPending] = useState<PetRecord | null>(null);
	const [renaming, setRenaming] = useState<PetRecord | null>(null);
	const [nextName, setNextName] = useState('');
	const [email, setEmail] = useState('');
	const [note, setNote] = useState<string | null>(null);
	const now = new Date();

	return (
		<div className="notebook page flex min-h-dvh flex-col px-4 pb-6 pt-8">
			<h1 className="notepad mx-auto bg-[#f6ead4] px-8 py-2 text-center type-display text-ink">Your friends</h1>
			<div className="mt-5 flex flex-col gap-4">
				{pets.map((pet) => {
					const status = homeyStatus(pet.lastFedAt, now);
					const sprite = spriteFor(pet.stage, status, status === 'needs_love' ? 0.4 : 1);
					return (
						<FriendRow
							key={pet.id}
							name={pet.name}
							topic={pet.topic}
							species={pet.species}
							sprite={sprite === 'egg' ? 'hatchling' : sprite}
							status={status}
							onOpen={() => onOpen(pet.id)}
							onRename={() => { setRenaming(pet); setNextName(pet.name); }}
							onDelete={() => setPending(pet)}
						/>
					);
				})}
				{pets.length === 0 && (
					<p className="text-center type-heading text-ink-soft">The sill is empty. Hatch someone.</p>
				)}
			</div>
			<button
				type="button"
				onClick={onHatch}
				className="relative mx-auto mt-6 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#f6efe4] px-4 py-3 type-button text-ink shadow-sm"
			>
				<span className="inline-block h-8 w-8"><EggArt crack={0.35} /></span>
				+ Hatch a new one
			</button>
			{showNest && (
				<form
					className="mx-auto mt-4 flex w-full max-w-xs flex-col gap-2"
					onSubmit={async (event) => {
						event.preventDefault();
						const result = await sendMagicLink(email);
						setNote(result.message);
					}}
				>
					<label className="type-helper text-ink-soft" htmlFor="nest-email">Keep this nest</label>
					<input
						id="nest-email"
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder="you@email.com"
						className="rounded-full bg-paper px-4 py-2 type-helper text-ink outline-none"
					/>
					<DockButton type="submit" variant="quiet" className="h-10">Send a link</DockButton>
					{note && <p className="text-center type-helper text-ink-soft">{note}</p>}
				</form>
			)}
			{renaming && (
				<form
					className="fixed inset-0 z-30 flex items-end justify-center bg-[#3e2c22]/30 p-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (nextName.trim()) onRename(renaming.id, nextName.trim());
						setRenaming(null);
					}}
				>
					<div className="notepad w-full max-w-sm bg-paper p-5 text-center shadow-paper">
						<p className="type-heading text-ink">I think I'll call you,</p>
						<input
							value={nextName}
							onChange={(event) => setNextName(event.target.value)}
							className="mt-3 w-full bg-transparent text-center type-prompt-lg text-ink outline-none"
							maxLength={24}
						/>
						<div className="mt-4 flex justify-center">
							<DockButton type="submit" className="h-12">Save</DockButton>
						</div>
					</div>
				</form>
			)}
			{pending && (
				<div className="fixed inset-0 z-30 flex items-end justify-center bg-[#3e2c22]/30 p-4">
					<div className="notepad w-full max-w-sm bg-paper p-5 text-center shadow-paper">
						<p className="type-heading text-ink">Let {pending.name} go?</p>
						<p className="type-helper mt-2 text-ink-soft">Their cards will go with them. You can hatch again later.</p>
						<div className="mt-4 flex justify-center gap-3">
							<DockButton variant="quiet" className="h-12" onClick={() => setPending(null)}>Stay</DockButton>
							<DockButton className="h-12" onClick={() => { onDelete(pending.id); setPending(null); }}>Let go</DockButton>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
