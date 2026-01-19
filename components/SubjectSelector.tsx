'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Book, Loader2 } from "lucide-react";
import { generateDeck } from "@/actions/generateDeck";
import { useRouter } from "next/navigation";
import PlacementQuiz from "./PlacementQuiz";

interface SubjectSelectorProps {
	isOpen: boolean;
	onClose: () => void;
	decks: any[];
	onSelect: (deckId: string) => void;
	userId: string;
}

export default function SubjectSelector({ isOpen, onClose, decks, onSelect, userId }: SubjectSelectorProps) {
	const [showNewSubject, setShowNewSubject] = useState(false);
	const [newTopic, setNewTopic] = useState('');
	const [showPlacement, setShowPlacement] = useState(false);
	const [pendingTopic, setPendingTopic] = useState('');
	const router = useRouter();

	// Start placement quiz for new topic
	const handleStartPlacement = () => {
		if (!newTopic.trim()) return;
		setPendingTopic(newTopic.trim());
		setShowPlacement(true);
		setShowNewSubject(false);
	};

	// Skip placement - create beginner deck directly
	const handleSkipPlacement = async () => {
		setShowPlacement(false);
		await generateDeck({ topic: pendingTopic, userId, difficulty: 'Beginner' });
		setNewTopic('');
		setPendingTopic('');
		onClose();
		router.push(`/?topic=${encodeURIComponent(pendingTopic)}`);
	};

	// Placement complete - deck was already created
	const handlePlacementComplete = (difficulty: string) => {
		setShowPlacement(false);
		setNewTopic('');
		onClose();
		router.push(`/?topic=${encodeURIComponent(pendingTopic)}`);
	};

	// Show placement quiz overlay
	if (showPlacement) {
		return (
			<PlacementQuiz
				topic={pendingTopic}
				userId={userId}
				onComplete={handlePlacementComplete}
				onSkip={handleSkipPlacement}
			/>
		);
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
					/>

					{/* Drawer */}
					<motion.div
						initial={{ x: '-100%' }}
						animate={{ x: 0 }}
						exit={{ x: '-100%' }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-zinc-950 border-r border-zinc-800 z-[70] p-6 shadow-2xl flex flex-col"
					>
						<div className="flex justify-between items-center mb-8">
							<h2 className="text-xl font-bold text-green-400 tracking-widest uppercase">My Decks</h2>
							<button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
								<X size={24} />
							</button>
						</div>

						<div className="space-y-4 flex-1 overflow-y-auto">
							{decks.map(deck => (
								<button
									key={deck.id}
									onClick={() => onSelect(deck.id)}
									className="w-full text-left p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-green-500 hover:bg-zinc-900 transition-all active:scale-95 flex items-center space-x-4 group"
								>
									<div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors">
										<Book size={20} />
									</div>
									<div className="flex-1">
										<h3 className="font-bold text-zinc-200 group-hover:text-green-400 transition-colors uppercase text-sm tracking-wider">{deck.topic}</h3>
										<p className="text-[10px] text-zinc-500">Tap to study</p>
									</div>
								</button>
							))}

							{/* New Subject Form */}
							{showNewSubject ? (
								<div className="p-4 rounded-xl border border-green-500/50 bg-zinc-900 space-y-3">
									<input
										type="text"
										placeholder="Topic (e.g., 'French', 'Calculus')"
										value={newTopic}
										onChange={(e) => setNewTopic(e.target.value)}
										className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-green-500"
										autoFocus
									/>
									<p className="text-[10px] text-zinc-500">
										You'll take a quick 3-question quiz to find your level.
									</p>
									<div className="flex space-x-2">
										<button
											onClick={() => setShowNewSubject(false)}
											className="flex-1 p-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs uppercase"
										>
											Cancel
										</button>
										<button
											onClick={handleStartPlacement}
											disabled={!newTopic.trim()}
											className="flex-1 p-2 rounded-lg bg-green-500 text-black font-bold text-xs uppercase disabled:opacity-50"
										>
											Start Quiz
										</button>
									</div>
								</div>
							) : (
								<button
									onClick={() => setShowNewSubject(true)}
									className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-800 text-zinc-600 flex items-center justify-center space-x-2 hover:border-zinc-700 hover:text-zinc-500 transition-colors uppercase text-xs font-bold tracking-widest"
								>
									<Plus size={16} />
									<span>New Subject</span>
								</button>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
