'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { initializeUser } from '@/actions/onboarding';
import { generateDeck } from '@/actions/generateDeck';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface OnboardingWizardProps {
	userId: string;
}

export default function OnboardingWizard({ userId }: OnboardingWizardProps) {
	const [step, setStep] = useState(0);
	const [subject, setSubject] = useState('');
	const [customSubject, setCustomSubject] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const subjects = ['Spanish', 'Python', 'Biology', 'History', 'Trivia'];

	const handleComplete = async () => {
		const finalSubject = (customSubject || subject).trim();
		if (!finalSubject) return;

		setLoading(true);
		try {
			await initializeUser(userId, 'Egg', 'companion', [finalSubject]);

			const deckRes = await generateDeck({
				topic: finalSubject,
				userId,
				difficulty: 'Beginner',
				numericDifficulty: 2,
			});

			if (!deckRes.success) {
				throw new Error(deckRes.error || 'Failed to generate deck');
			}

			confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
			router.push(`/?topic=${encodeURIComponent(finalSubject)}`);
			router.refresh();
		} catch (e: unknown) {
			console.error('Onboarding Error:', e);
			alert(e instanceof Error ? e.message : 'Setup failed');
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black">
			<AnimatePresence mode="wait">
				{step === 0 && (
					<motion.div
						key="step0"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-6 max-w-sm"
					>
						<div className="text-6xl mx-auto mb-2">🥚</div>
						<h1 className="text-4xl font-black text-white tracking-tighter">
							MEMO<span className="text-green-500">GOTCHI</span>
						</h1>
						<p className="text-zinc-400 leading-relaxed">
							Study due cards to keep your pet healthy. Spaced repetition first; the pet is why you
							come back.
						</p>
						<button
							onClick={() => setStep(1)}
							className="mt-8 bg-white text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform w-full flex items-center justify-center space-x-2"
						>
							<span>Start</span>
							<ArrowRight size={16} />
						</button>
					</motion.div>
				)}

				{step === 1 && (
					<motion.div
						key="step1"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						className="w-full max-w-sm space-y-6"
					>
						<h2 className="text-2xl font-bold text-white uppercase tracking-wide">
							Pick a subject
						</h2>
						<p className="text-zinc-500 text-sm">One topic to start. You can add more later.</p>

						<div className="grid grid-cols-2 gap-3">
							{subjects.map((s) => (
								<button
									key={s}
									onClick={() => {
										setSubject(s);
										setCustomSubject('');
									}}
									className={`p-4 rounded-xl border border-zinc-800 transition-all ${
										subject === s
											? 'bg-green-500 text-black border-green-500 font-bold scale-105'
											: 'bg-zinc-900 text-zinc-400 hover:border-zinc-600'
									}`}
								>
									{s}
								</button>
							))}
						</div>

						<input
							type="text"
							placeholder="Or type a custom subject…"
							value={customSubject}
							onChange={(e) => {
								setCustomSubject(e.target.value);
								setSubject('');
							}}
							className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center text-white focus:outline-none focus:border-green-500 transition-colors"
						/>

						<button
							onClick={handleComplete}
							disabled={(!subject && !customSubject) || loading}
							className="w-full bg-green-500 text-black p-4 rounded-xl font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
						>
							{loading ? (
								<span className="animate-pulse">Creating first cards…</span>
							) : (
								'Begin studying'
							)}
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="absolute bottom-8 flex space-x-2">
				<div className={`w-2 h-2 rounded-full ${step >= 0 ? 'bg-green-500' : 'bg-zinc-800'}`} />
				<div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-zinc-800'}`} />
			</div>
		</div>
	);
}
