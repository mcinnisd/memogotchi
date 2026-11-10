'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'framer-motion';
import { gradeFromGesture } from '@/lib/grading';
import { useHaptic } from '@/hooks/useHaptic';
import { cn } from '@/lib/cn';

const EASE = [0.22, 0.61, 0.36, 1] as const;

export interface StackCard {
	id: string;
	prompt: string;
	answer: string;
	explanation?: string;
	type: 'basic' | 'choice' | 'note';
	options?: string[];
}

export interface AnswerEvent {
	grade: number;
	wasFlipped: boolean;
	responseTimeMs: number;
}

export function CardStack({
	card,
	mode,
	revealed = false,
	showCoach = false,
	progress,
	highlightOption,
	onLook,
	onReaction,
	onAnswer,
}: {
	card: StackCard | null;
	mode: 'idle' | 'play' | 'rest' | 'taste';
	revealed?: boolean;
	showCoach?: boolean;
	progress?: { index: number; total: number };
	highlightOption?: string;
	onLook?: (value: number) => void;
	onReaction?: (mood: 'watching' | 'pleased' | 'gentle' | 'idle') => void;
	onAnswer?: (event: AnswerEvent) => void;
}) {
	const reduce = useReducedMotion();
	const { trigger } = useHaptic();
	const [flipped, setFlipped] = useState(false);
	const [wasFlipped, setWasFlipped] = useState(false);
	const [picked, setPicked] = useState<string | null>(highlightOption ?? null);
	const started = useRef(Date.now());
	const moved = useRef(false);
	const x = useMotionValue(0);
	const rotate = useTransform(x, [-180, 180], reduce ? [0, 0] : [-7, 7]);
	const rightOpacity = useTransform(x, [40, 120], [0, 1]);
	const leftOpacity = useTransform(x, [-40, -120], [0, 1]);
	const controls = useAnimation();

	const interactive = (mode === 'play' || mode === 'taste') && card?.type !== 'note';

	useEffect(() => {
		x.set(0);
		controls.set({ x: 0, opacity: 1, rotate: 0 });
		setFlipped(false);
		setWasFlipped(false);
		setPicked(highlightOption ?? null);
		started.current = Date.now();
		moved.current = false;
		onLook?.(0);
	}, [card?.id, controls, highlightOption, onLook, x]);

	if (!card) {
		return (
			<div className="grid-paper torn flex h-44 w-[86%] items-center justify-center px-6 text-center font-hand text-2xl text-ink-soft">
				Ready when you are.
			</div>
		);
	}

	const finish = async (direction: 'left' | 'right') => {
		if (!onAnswer || card.type === 'choice' || card.type === 'note') return;
		const grade = gradeFromGesture({ kind: 'swipe', direction });
		trigger(direction === 'right' ? 'success' : 'light');
		onReaction?.(direction === 'right' ? 'pleased' : 'gentle');
		await controls.start({
			x: direction === 'right' ? 420 : -420,
			opacity: 0,
			transition: { duration: reduce ? 0 : 0.28, ease: EASE },
		});
		onAnswer({
			grade,
			wasFlipped,
			responseTimeMs: Date.now() - started.current,
		});
	};

	const onDragEnd = async (_: unknown, info: PanInfo) => {
		onLook?.(0);
		if (!interactive || card.type !== 'basic') {
			await controls.start({ x: 0, transition: { duration: reduce ? 0 : 0.28, ease: EASE } });
			return;
		}
		if (info.offset.x > 88) await finish('right');
		else if (info.offset.x < -88) await finish('left');
		else {
			onReaction?.('idle');
			await controls.start({ x: 0, transition: { duration: reduce ? 0 : 0.32, ease: EASE } });
		}
	};

	const choose = (option: string) => {
		if (!onAnswer || picked) return;
		setPicked(option);
		const correct = option === card.answer;
		trigger(correct ? 'success' : 'light');
		onReaction?.(correct ? 'pleased' : 'gentle');
		window.setTimeout(() => {
			onAnswer({
				grade: gradeFromGesture({ kind: 'choice', correct }),
				wasFlipped,
				responseTimeMs: Date.now() - started.current,
			});
		}, reduce ? 0 : 320);
	};

	const showBack = flipped && card.type === 'basic' && !revealed;

	return (
		<div className="relative flex w-full flex-col items-center">
			<div className={cn('relative w-[86%] max-w-[340px]', card.type === 'choice' ? 'h-[17.5rem]' : 'h-52')}>
				<div className="grid-paper absolute inset-0 translate-y-3 -rotate-2 rounded-2xl border border-[#e4d7c2]" />
				<div className="grid-paper absolute inset-0 translate-y-1.5 rotate-1 rounded-2xl border border-[#e4d7c2]" />
				<motion.div
					key={card.id}
					drag={interactive && card.type === 'basic'}
					dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
					dragElastic={0.35}
					dragDirectionLock
					onDrag={(_, info) => {
						moved.current = Math.abs(info.offset.x) > 8;
						onLook?.(Math.max(-1, Math.min(1, info.offset.x / 140)));
						if (Math.abs(info.offset.x) > 24) onReaction?.('watching');
					}}
					onDragEnd={onDragEnd}
					animate={controls}
					style={{ x, rotate }}
					initial={reduce ? false : { y: -10, rotate: -1.5, opacity: 0.85 }}
					transition={{ duration: 0.35, ease: EASE }}
					className="absolute inset-0 cursor-grab active:cursor-grabbing"
				>
					<div
						role={card.type === 'basic' && interactive ? 'button' : undefined}
						tabIndex={card.type === 'basic' && interactive ? 0 : undefined}
						className="grid-paper relative h-full w-full overflow-hidden rounded-2xl border border-[#eadcc6] text-left shadow-paper"
						onClick={() => {
							if (!interactive || card.type !== 'basic' || moved.current) return;
							setFlipped((value) => !value);
							setWasFlipped(true);
							trigger('light');
						}}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								if (!interactive || card.type !== 'basic') return;
								setFlipped((value) => !value);
								setWasFlipped(true);
							}
						}}
					>
						<span className="pointer-events-none absolute right-3 top-3 text-[#7ea15a]" aria-hidden>
							<svg width="22" height="22" viewBox="0 0 22 22">
								<path d="M11 18 C12 12 14 10 18 8 C14 8 12 6 11 2 C10 6 8 8 4 8 C8 10 10 12 11 18 Z" fill="#8fb86a" />
								<path d="M11 18 V8" stroke="#5f8a3c" strokeWidth="1.2" />
							</svg>
						</span>
						<div className="flex h-full flex-col items-center justify-center overflow-y-auto overscroll-contain px-5 py-4 text-center">
							<div className="w-full">
								{card.type === 'note' ? (
									<p className="font-hand text-3xl leading-snug text-ink">{card.prompt}</p>
								) : card.type === 'choice' ? (
									<div className="space-y-2">
										<p className="mb-3 font-hand text-2xl leading-tight text-ink">{card.prompt}</p>
										{(card.options ?? []).map((option) => {
											const chosen = (picked ?? highlightOption) === option;
											return (
												<button
													type="button"
													key={option}
													onClick={(event) => {
														event.stopPropagation();
														if (interactive) choose(option);
													}}
													className={cn(
														'stitch relative block w-full rounded-xl bg-paper px-3 py-2 font-body text-base font-bold text-ink',
														chosen && 'bg-sage'
													)}
												>
													{option}
												</button>
											);
										})}
									</div>
								) : (
									<p className="font-hand text-[2rem] leading-tight text-ink">
										{card.prompt}
										{(revealed || showBack) && (
											<span className="mt-1 block font-body text-xl font-semibold text-ink-soft">({card.answer})</span>
										)}
										{showBack && card.explanation && (
											<span className="mt-2 block font-body text-sm font-medium text-ink-soft">{card.explanation}</span>
										)}
									</p>
								)}
							</div>
						</div>
					</div>
				</motion.div>
				{interactive && card.type === 'basic' && (
					<>
						<motion.div style={{ opacity: leftOpacity }} className="pointer-events-none absolute -left-1 top-6 font-hand text-lg text-ink-soft">
							Not yet
						</motion.div>
						<motion.div style={{ opacity: rightOpacity }} className="pointer-events-none absolute -right-2 top-6 text-right font-hand text-lg text-ink-soft">
							I know this
						</motion.div>
					</>
				)}
			</div>

			{showCoach && card.type === 'basic' && (
				<div className="pointer-events-none mt-2 flex w-[92%] items-center justify-between px-2 font-hand text-sm text-ink-soft">
					<span>← Not yet</span>
					<span>tap to flip</span>
					<span>I know this →</span>
				</div>
			)}

			{mode === 'taste' && (
				<div className="mt-2 flex flex-col items-center gap-1">
					<div className="flex gap-1">
						{Array.from({ length: Math.max(progress?.total ?? 3, 3) }).slice(0, 9).map((_, index) => (
							<span
								key={index}
								className={cn('h-1.5 w-1.5 rounded-full', index === (progress?.index ?? 0) ? 'bg-ink' : 'bg-ink/25')}
							/>
						))}
					</div>
					<div className="rotate-2 rounded-sm bg-paper px-2 py-0.5 font-hand text-sm text-ink-soft shadow-sm">
						A little taste
					</div>
				</div>
			)}

			{card.type === 'choice' && mode === 'taste' && (
				<p className="mt-2 max-w-[12rem] rotate-1 rounded-sm bg-paper px-2 py-1 text-center font-hand text-sm leading-tight text-ink-soft shadow-sm">
					Most cards you swipe. A few you pick.
				</p>
			)}
		</div>
	);
}
