'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePlacementQuiz, evaluatePlacement } from '@/actions/placementTest';
import { generateDeck } from '@/actions/generateDeck';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface PlacementQuizProps {
	topic: string;
	userId: string;
	onComplete: (difficulty: string) => void;
	onSkip: () => void;
}

interface Question {
	question: string;
	options: string[];
	answer: string;
	difficulty: 'easy' | 'medium' | 'hard';
}

const MIN_CONFIDENCE = 65;
const MAX_QUESTIONS = 9;

export default function PlacementQuiz({ topic, userId, onComplete, onSkip }: PlacementQuizProps) {
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [seenQuestions, setSeenQuestions] = useState<string[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [responses, setResponses] = useState<{ questionIndex: number; userAnswer: string; correct: boolean; timeMs: number }[]>([]);
	const [questionStartTime, setQuestionStartTime] = useState(Date.now());
	const [showResult, setShowResult] = useState(false);
	const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
	const [finalResult, setFinalResult] = useState<{ difficulty: string; confidence: number } | null>(null);
	const [generating, setGenerating] = useState(false);
	const router = useRouter();

	// Load initial questions on mount
	useEffect(() => {
		async function loadQuestions() {
			const result = await generatePlacementQuiz(topic, []);
			if (result.questions.length > 0) {
				setQuestions(result.questions);
				setSeenQuestions(result.questions.map(q => q.question));
				setQuestionStartTime(Date.now());
			} else {
				onSkip();
			}
			setLoading(false);
		}
		loadQuestions();
	}, [topic, onSkip]);

	// Fetch more questions for adaptive assessment
	const fetchMoreQuestions = useCallback(async () => {
		setLoadingMore(true);
		const result = await generatePlacementQuiz(topic, seenQuestions);
		if (result.questions.length > 0) {
			// Filter out any duplicates
			const newQuestions = result.questions.filter(
				q => !seenQuestions.includes(q.question)
			);
			setQuestions(prev => [...prev, ...newQuestions]);
			setSeenQuestions(prev => [...prev, ...newQuestions.map(q => q.question)]);
		}
		setLoadingMore(false);
	}, [topic, seenQuestions]);

	const handleAnswer = async (answer: string) => {
		const timeMs = Date.now() - questionStartTime;
		const currentQ = questions[currentIndex];
		const correct = answer === currentQ.answer;

		setLastAnswerCorrect(correct);
		setShowResult(true);

		const newResponse = {
			questionIndex: currentIndex,
			userAnswer: answer,
			correct,
			timeMs
		};

		const updatedResponses = [...responses, newResponse];
		setResponses(updatedResponses);

		await new Promise(resolve => setTimeout(resolve, 800));
		setShowResult(false);

		const nextIndex = currentIndex + 1;

		if (nextIndex < questions.length) {
			// More questions available
			setCurrentIndex(nextIndex);
			setQuestionStartTime(Date.now());
			setLastAnswerCorrect(null);
		} else {
			// Evaluate current responses
			const evaluation = await evaluatePlacement(updatedResponses);

			// Check if we need more questions
			if (evaluation.confidenceScore < MIN_CONFIDENCE && updatedResponses.length < MAX_QUESTIONS) {
				// Low confidence - fetch more questions
				await fetchMoreQuestions();
				setCurrentIndex(nextIndex);
				setQuestionStartTime(Date.now());
				setLastAnswerCorrect(null);
			} else {
				// Confidence is high enough OR max questions reached - finalize
				setGenerating(true);
				setFinalResult({ difficulty: evaluation.recommendedDifficulty, confidence: evaluation.confidenceScore });
				await generateDeck({ topic, userId, difficulty: evaluation.recommendedDifficulty });
				setGenerating(false);
				onComplete(evaluation.recommendedDifficulty);
			}
		}
	};

	if (loading) {
		return (
			<div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
				<Loader2 size={40} className="animate-spin text-green-500 mb-4" />
				<p className="text-zinc-400">Preparing placement quiz...</p>
			</div>
		);
	}

	if (loadingMore) {
		return (
			<div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
				<Loader2 size={40} className="animate-spin text-yellow-500 mb-4" />
				<p className="text-zinc-400">Need more data... loading additional questions</p>
				<p className="text-zinc-600 text-xs mt-2">({responses.length} answered so far)</p>
			</div>
		);
	}

	if (generating) {
		return (
			<div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
				<Loader2 size={40} className="animate-spin text-green-500 mb-4" />
				<p className="text-zinc-400">Creating your personalized deck...</p>
				{finalResult && (
					<p className="text-zinc-500 text-sm mt-2">
						Level: {finalResult.difficulty} ({finalResult.confidence.toFixed(0)}% confidence)
					</p>
				)}
			</div>
		);
	}

	const currentQ = questions[currentIndex];

	return (
		<div className="fixed inset-0 bg-black flex flex-col z-50">
			{/* Header */}
			<div className="p-4 border-b border-zinc-800 flex justify-between items-center">
				<span className="text-green-500 font-bold uppercase text-sm tracking-widest">Placement Quiz</span>
				<span className="text-zinc-500 font-mono text-sm">{currentIndex + 1}/{questions.length}</span>
			</div>

			{/* Progress Bar */}
			<div className="h-1 bg-zinc-900">
				<motion.div
					className="h-full bg-green-500"
					initial={{ width: 0 }}
					animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
				/>
			</div>

			{/* Question */}
			<div className="flex-1 p-6 flex flex-col justify-center">
				<AnimatePresence mode="wait">
					<motion.div
						key={currentIndex}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="space-y-6"
					>
						{/* Difficulty Badge */}
						<div className="flex justify-center">
							<span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${currentQ.difficulty === 'easy' ? 'bg-green-900/30 text-green-400' :
								currentQ.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
									'bg-red-900/30 text-red-400'
								}`}>
								{currentQ.difficulty}
							</span>
						</div>

						{/* Question Text */}
						<h2 className="text-xl font-bold text-white text-center leading-relaxed">
							{currentQ.question}
						</h2>

						{/* Options */}
						<div className="grid gap-3 mt-8">
							{currentQ.options.map((opt, i) => (
								<button
									key={i}
									onClick={() => handleAnswer(opt)}
									disabled={showResult}
									className="w-full p-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-green-500 text-left text-zinc-300 rounded-xl transition-all active:scale-95 disabled:opacity-50"
								>
									<span className="text-green-500 font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
									{opt}
								</button>
							))}
						</div>

						{/* Feedback */}
						<AnimatePresence>
							{showResult && (
								<motion.div
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0 }}
									className="flex justify-center mt-4"
								>
									{lastAnswerCorrect ? (
										<div className="flex items-center space-x-2 text-green-500">
											<CheckCircle size={24} />
											<span className="font-bold">Correct!</span>
										</div>
									) : (
										<div className="flex items-center space-x-2 text-red-500">
											<XCircle size={24} />
											<span className="font-bold">Incorrect</span>
										</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Skip Button */}
			<div className="p-4 border-t border-zinc-800">
				<button
					onClick={onSkip}
					className="w-full p-3 text-zinc-500 text-sm hover:text-zinc-400 transition-colors"
				>
					Skip Assessment (Start at Beginner)
				</button>
			</div>
		</div>
	);
}
