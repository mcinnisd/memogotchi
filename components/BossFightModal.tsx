'use client';

import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { submitBossResult } from "@/actions/bossFight";
import { useRouter } from "next/navigation";

interface BossFightModalProps {
	questions: any[];
	userId: string;
	onClose: () => void;
}

export default function BossFightModal({ questions, userId, onClose }: BossFightModalProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [failed, setFailed] = useState(false);
	const [complete, setComplete] = useState(false);
	const { trigger } = useHaptic();
	const router = useRouter();

	const currentQ = questions[currentIndex];

	const handleAnswer = async (option: string) => {
		// Check correctness
		// Assumption: currentQ has 'answer' field and it matches the option text exactly, 
		// or we compare index. But the prompt said "question, options, answer".
		const isCorrect = option === currentQ.answer;

		if (!isCorrect) {
			trigger('error');
			setFailed(true);
			// Fail immediately? Boss fights are strict.
			await submitBossResult(userId, false);
		} else {
			trigger('success');
			if (currentIndex < questions.length - 1) {
				setCurrentIndex(prev => prev + 1);
			} else {
				// Win!
				setComplete(true);
				await submitBossResult(userId, true);
			}
		}
	};

	if (failed) {
		return (
			<div className="fixed inset-0 z-50 bg-red-950/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in">
				<h1 className="text-4xl font-black text-red-500 mb-4 tracking-tighter">DEFEAT</h1>
				<p className="text-red-200 mb-8">Your pet took damage.</p>
				<button onClick={() => { onClose(); router.refresh(); }} className="bg-red-500 text-black px-8 py-3 rounded-xl font-bold uppercase">
					Retreat
				</button>
			</div>
		);
	}

	if (complete) {
		return (
			<div className="fixed inset-0 z-50 bg-green-950/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in">
				<h1 className="text-4xl font-black text-green-400 mb-4 tracking-tighter">VICTORY!</h1>
				<p className="text-green-200 mb-8">+100 XP • +50 Coins • Full Heal</p>
				<button onClick={() => { onClose(); router.refresh(); }} className="bg-green-500 text-black px-8 py-3 rounded-xl font-bold uppercase">
					Claim Loot
				</button>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-6 animate-in slide-in-from-bottom duration-500">
			{/* Boss Header */}
			<div className="flex justify-between items-center mb-8 border-b border-red-900 pb-4">
				<span className="text-red-500 font-black tracking-widest uppercase">BOSS ENCOUNTER</span>
				<span className="text-red-500 font-mono">{currentIndex + 1}/{questions.length}</span>
			</div>

			{/* Question */}
			<div className="flex-1 flex items-center justify-center mb-8">
				<h2 className="text-2xl font-bold text-white text-center leading-relaxed">
					{currentQ.question}
				</h2>
			</div>

			{/* Options */}
			<div className="grid gap-3">
				{currentQ.options?.map((opt: string, i: number) => (
					<button
						key={i}
						onClick={() => handleAnswer(opt)}
						className="w-full p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-red-500 text-left text-zinc-300 rounded-xl transition-all active:scale-95"
					>
						<span className="text-red-500 font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
						{opt}
					</button>
				))}
			</div>
		</div>
	);
}
