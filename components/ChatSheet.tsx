'use client';

import { useState } from 'react';
import { chatWithPet } from '@/actions/chatWithPet';
import { DockButton } from '@/components/paper/Dock';

export function ChatSheet({
	name,
	species,
	topic,
	onClose,
}: {
	name: string;
	species: string;
	topic: string;
	onClose: () => void;
}) {
	const [lines, setLines] = useState<{ from: 'you' | 'pet'; text: string }[]>([
		{ from: 'pet', text: `Hi. I'm ${name}. We can talk about ${topic}, or just sit.` },
	]);
	const [text, setText] = useState('');
	const [busy, setBusy] = useState(false);

	const send = async () => {
		const message = text.trim();
		if (!message || busy) return;
		setText('');
		setLines((prev) => [...prev, { from: 'you', text: message }]);
		setBusy(true);
		try {
			const reply = await chatWithPet(message, { name, species, topic });
			setLines((prev) => [...prev, { from: 'pet', text: reply }]);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="fixed inset-0 z-40 flex items-end justify-center bg-[#3e2c22]/25 p-3">
			<div className="torn flex max-h-[70dvh] w-full max-w-md flex-col bg-[#f7f1e6] p-4">
				<div className="flex items-center justify-between">
					<h2 className="font-display text-2xl text-ink">{name}</h2>
					<button type="button" onClick={onClose} className="font-hand text-lg text-ink-soft">Close</button>
				</div>
				<div className="mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
					{lines.map((line, index) => (
						<p
							key={index}
							className={line.from === 'pet'
								? 'max-w-[90%] rounded-xl bg-paper px-3 py-2 font-hand text-lg text-ink'
								: 'max-w-[90%] self-end rounded-xl bg-sage px-3 py-2 font-body text-sm font-semibold text-ink'}
						>
							{line.text}
						</p>
					))}
					{busy && <p className="font-hand text-ink-soft">thinking…</p>}
				</div>
				<form
					className="mt-3 flex gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						void send();
					}}
				>
					<input
						value={text}
						onChange={(event) => setText(event.target.value)}
						placeholder="Say hello"
						className="flex-1 rounded-full border border-dashed border-[#6a4b38]/30 bg-paper px-4 py-2 font-body text-ink outline-none"
					/>
					<DockButton type="submit" className="h-11 px-4 text-base">Send</DockButton>
				</form>
			</div>
		</div>
	);
}
