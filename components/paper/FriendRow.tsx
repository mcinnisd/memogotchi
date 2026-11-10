'use client';

import type { CareStatus } from '@/lib/care/types';
import type { SpeciesId } from '@/lib/species';
import { LivingPet } from '@/components/pets/LivingPet';
import { StatusChip } from '@/components/paper/StatusChip';

export function FriendRow({
	name,
	topic,
	species,
	sprite,
	status,
	onOpen,
	onRename,
	onDelete,
}: {
	name: string;
	topic: string;
	species: SpeciesId;
	sprite: 'hatchling' | 'cared_for' | 'well_loved' | 'needs_love';
	status: CareStatus;
	onOpen: () => void;
	onRename: () => void;
	onDelete: () => void;
}) {
	return (
		<article className="torn grid-paper relative flex items-center gap-3 px-3 py-3">
			<span
				className="absolute -top-2 left-6 h-4 w-12 rounded-[1px] bg-[#e4d2b4]"
				style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,.4) 4px)' }}
			/>
			<button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
				<div className="h-16 w-16 shrink-0">
					<LivingPet species={species} state={sprite} brighten={status === 'needs_love' ? 0.55 : 1} />
				</div>
				<div className="min-w-0">
					<div className="truncate font-display text-2xl font-semibold leading-none text-ink">{name}</div>
					<div className="mt-1 font-body text-sm text-ink-soft">{topic}</div>
					<StatusChip status={status} className="mt-2" />
				</div>
			</button>
			<div className="flex shrink-0 flex-col items-end gap-2 self-end">
				<button type="button" onClick={onRename} className="font-hand text-sm text-ink-soft underline decoration-dotted">
					rename
				</button>
				<button type="button" onClick={onDelete} className="font-hand text-sm text-ink-soft underline decoration-dotted">
					let go
				</button>
			</div>
		</article>
	);
}
