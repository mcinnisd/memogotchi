'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'framer-motion';
import { gradeFromGesture } from '@/lib/grading';
import { useHaptic } from '@/hooks/useHaptic';
import { cn } from '@/lib/cn';

const EASE = [0.22, 0.61, 0.36, 1] as const;

function promptClass(text: string) {
	const length = text.trim().length;
	if (length <= 16) return 'type-prompt-xl';
	if (length <= 42) return 'type-prompt-lg';
	if (length <= 90) return 'type-prompt-md';
	return 'type-prompt-sm';
}

function optionClass(text: string) {
	return text.trim().length <= 14 ? 'type-option' : 'type-option-sm';
}

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
	initialFlipped = false,
	review,
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
	initialFlipped?: boolean;
	review?: { picked: string } | null;
	onLook?: (value: number) => void;
	onReaction?: (mood: 'watching' | 'pleased' | 'gentle' | 'idle') => void;
	onAnswer?: (event: AnswerEvent) => void;
}) {
	const reduce = useReducedMotion();
	const { trigger } = useHaptic();
	const [flipped, setFlipped] = useState(initialFlipped);
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
		setFlipped(initialFlipped);
		setWasFlipped(false);
		setPicked(highlightOption ?? null);
		started.current = Date.now();
		moved.current = false;
		onLook?.(0);
	}, [card?.id, controls, highlightOption, initialFlipped, onLook, x]);

	if (!card) {
		return (
			<div className="notepad ruled flex h-44 w-[86%] items-center justify-center px-6 text-center type-heading text-ink-soft shadow-paper">
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

	const showBack = flipped && card.type === 'basic';
	void revealed;

	return (
		<div className="relative flex w-full flex-col items-center">
			<div className={cn('relative w-[88%] max-w-[340px]', card.type === 'choice' ? 'h-[18.5rem]' : 'h-56')}>
				<div className="notepad absolute inset-x-1 top-3 -bottom-3.5 -rotate-[1deg] bg-[#e7cbb4] shadow-sm" />
				<div className="notepad absolute inset-x-0.5 top-2 -bottom-2 rotate-[0.6deg] bg-[#f0dcc8] shadow-sm" />
				<div className="absolute inset-x-3 -top-1 z-10 h-4 w-16 -rotate-6 bg-[url('/props/washi-1.png')] bg-cover opacity-90" />
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
					initial={reduce ? false : { y: -8, rotate: -1, opacity: 0.85 }}
					transition={{ duration: 0.35, ease: EASE }}
					className="absolute inset-0 cursor-grab active:cursor-grabbing"
				>
					<div
						role={card.type === 'basic' && interactive ? 'button' : undefined}
						tabIndex={card.type === 'basic' && interactive ? 0 : undefined}
						className="notepad ruled relative h-full w-full rotate-[0.8deg] overflow-hidden text-left shadow-[0_10px_18px_rgba(90,60,40,0.12)]"
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
						<div className="flex h-full flex-col items-center justify-center overflow-y-auto overscroll-contain px-6 py-6 text-center">
							<div className="w-full text-balance">
								{card.type === 'note' ? (
									<p className={cn(promptClass(card.prompt), 'card-copy text-ink')}>{card.prompt}</p>
								) : card.type === 'choice' ? (
									<div className="space-y-2">
										<p className={cn(promptClass(card.prompt), 'card-copy mb-3 text-ink')}>{card.prompt}</p>
										{(card.options ?? []).map((option) => {
											const chosen = (review?.picked ?? picked ?? highlightOption) === option;
											const correct = option === card.answer;
											const marked = Boolean(review);
											return (
												<button
													type="button"
													key={option}
													onClick={(event) => {
														event.stopPropagation();
														if (interactive && !review) choose(option);
													}}
													className={cn(
														'stitch relative block w-full rounded-xl bg-[#fbf6ec] px-3 py-2.5 text-ink',
														optionClass(option),
														!marked && chosen && 'bg-sage',
														marked && correct && 'bg-sage',
														marked && chosen && !correct && 'bg-[#f0c2b0]'
													)}
												>
													{option}
													{marked && correct && <span className="ml-2 text-[#4f7a3a]">✓</span>}
													{marked && chosen && !correct && <span className="ml-2 text-[#8a4b38]">×</span>}
												</button>
											);
										})}
									</div>
								) : showBack ? (
									<p className={cn(promptClass(card.answer), 'card-copy text-ink')}>
										{card.answer}
										{card.explanation && (
											<span className="type-helper mt-2 block text-ink-soft">{card.explanation}</span>
										)}
									</p>
								) : (
									<p className={cn(promptClass(card.prompt), 'card-copy text-ink')}>{card.prompt}</p>
								)}
							</div>
						</div>
					</div>
				</motion.div>
				{interactive && card.type === 'basic' && (
					<>
						<motion.div style={{ opacity: leftOpacity }} className="pointer-events-none absolute -left-1 top-6 type-helper text-ink-soft">
							Not yet
						</motion.div>
						<motion.div style={{ opacity: rightOpacity }} className="pointer-events-none absolute -right-2 top-6 text-right type-helper text-ink-soft">
							I know this
						</motion.div>
					</>
				)}
			</div>

			{showCoach && card.type === 'basic' && (
				<div className="pointer-events-none relative mt-1 h-14 w-[92%]">
					<span className="type-helper absolute left-0 top-1 text-ink-soft">← Not yet</span>
					<span className="type-helper absolute left-1/2 top-3 -translate-x-1/2 text-ink-soft">tap to flip</span>
					<span className="type-helper absolute right-0 top-1 text-ink-soft">I know this →</span>
				</div>
			)}

			{mode === 'taste' && (
				<div className="mt-1 flex flex-col items-center gap-1">
					<div className="flex gap-1.5">
						{Array.from({ length: Math.max(progress?.total ?? 3, 3) }).slice(0, 9).map((_, index) => (
							<span
								key={index}
								className={cn('h-1.5 w-1.5 rounded-full', index === (progress?.index ?? 0) ? 'bg-ink' : 'bg-ink/25')}
							/>
						))}
					</div>
					<div className="notepad rotate-1 bg-[#fbf6ec] px-2 py-1 type-helper text-ink-soft shadow-sm">
						A little taste
					</div>
				</div>
			)}

			{card.type === 'choice' && mode === 'taste' && !review && (
				<p className="notepad mt-2 max-w-[12rem] rotate-1 bg-[#fbf6ec] px-2 py-1 text-center type-helper leading-tight text-ink-soft shadow-sm">
					Most cards you swipe. A few you pick.
				</p>
			)}
		</div>
	);
}
