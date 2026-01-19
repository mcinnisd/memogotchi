'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Brain, Gamepad2, Rocket } from 'lucide-react';
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
		const finalSubject = customSubject || subject;
		if (!finalSubject) return;

		setLoading(true);
		try {
			// 1. Initialize User & Pet (Server Action defaults used if not passed, but we pass generic for now to let logic decide)
			// Actually initializeUser expects (userId, petName, petType, goals)
			// We'll let the backend generate the Persona based on the subject later or here.
			// For simplicity: "Eco-Droid" for Science, "Glitch-Cat" for Tech.
			// Let's rely on backend 'generatePetPersona' logic if accessible, OR just generic.
			// We will call initializeUser with the Subject as the goal.

			await initializeUser(userId, 'Egg', 'Unknown', [finalSubject]);

			// 2. Generate First Deck
			const deckRes = await generateDeck({ topic: finalSubject, userId }); // Pass as object!

			if (!deckRes.success) {
				throw new Error(deckRes.error || 'Failed to generate deck');
			}

			// 3. Success
			confetti();
			router.refresh();

		} catch (e: any) {
			console.error("Onboarding Error:", e);
			alert(`Optimization failed: ${e.message}`);
			setLoading(false);
		}
	};

	const nextStep = () => setStep(prev => prev + 1);

	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black">
			<AnimatePresence mode='wait'>
				{step === 0 && (
					<motion.div
						key="step0"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-6 max-w-sm"
					>
						<div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
							<Gamepad2 size={48} className="text-green-400" />
						</div>
						<h1 className="text-4xl font-black text-white tracking-tighter">MEMO<span className="text-green-500">GOTCHI</span></h1>
						<p className="text-zinc-400 leading-relaxed">
							Feed your digital pet by feeding your brain. <br />
							<span className="text-green-400 font-bold">Learn or it dies.</span>
						</p>
						<button onClick={nextStep} className="mt-8 bg-white text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform w-full flex items-center justify-center space-x-2">
							<span>Jack In</span>
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
						<h2 className="text-2xl font-bold text-white uppercase tracking-wide">Select Protocol</h2>
						<p className="text-zinc-500 text-sm">What do you want to master?</p>

						<div className="grid grid-cols-2 gap-3">
							{subjects.map(s => (
								<button
									key={s}
									onClick={() => { setSubject(s); setCustomSubject(''); }}
									className={`p-4 rounded-xl border border-zinc-800 transition-all ${subject === s ? 'bg-green-500 text-black border-green-500 font-bold scale-105' : 'bg-zinc-900 text-zinc-400 hover:border-zinc-600'}`}
								>
									{s}
								</button>
							))}
						</div>

						<input
							type="text"
							placeholder="Or type custom subject..."
							value={customSubject}
							onChange={(e) => { setCustomSubject(e.target.value); setSubject(''); }}
							className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center text-white focus:outline-none focus:border-green-500 transition-colors"
						/>

						<button
							onClick={handleComplete}
							disabled={(!subject && !customSubject) || loading}
							className="w-full bg-green-500 text-black p-4 rounded-xl font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
						>
							{loading ? (
								<span className="animate-pulse">Initializing System...</span>
							) : (
								"Initialize"
							)}
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Footer Step Indicator */}
			<div className="absolute bottom-8 flex space-x-2">
				<div className={`w-2 h-2 rounded-full ${step >= 0 ? 'bg-green-500' : 'bg-zinc-800'}`} />
				<div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-zinc-800'}`} />
			</div>
		</div>
	);
}
