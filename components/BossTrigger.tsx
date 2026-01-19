'use client';

import { useState } from 'react';
import { generateBossEncounter } from '@/actions/bossFight';
import BossFightModal from './BossFightModal';
import { Sword } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface BossTriggerProps {
	userId: string;
}

export default function BossTrigger({ userId }: BossTriggerProps) {
	const [showModal, setShowModal] = useState(false);
	const [questions, setQuestions] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const { trigger } = useHaptic();

	const handleScan = async () => {
		setLoading(true);
		trigger('light');
		try {
			const result = await generateBossEncounter(userId, 'Spanish'); // defaulting topic for now, or fetch from recent
			if (result.available && result.questions) {
				setQuestions(result.questions);
				setShowModal(true);
				trigger('warning'); // Dramatic feedback
			} else {
				alert("No Boss Detected (You need more 'Leech' cards with ease < 2.3)");
			}
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<button
				onClick={handleScan}
				disabled={loading}
				className="w-full bg-red-950/30 border-2 border-red-900/50 hover:border-red-500 p-6 rounded-2xl flex items-center justify-between transition-all active:scale-95 group mt-4"
			>
				<div className="flex flex-col text-left">
					<span className="text-sm text-red-700 uppercase tracking-widest font-bold group-hover:text-red-500">Challenge Mode</span>
					<span className="text-2xl font-bold text-red-800 group-hover:text-red-500 transition-colors">
						{loading ? 'Scanning...' : 'Scout Boss'}
					</span>
				</div>
				<div className="w-12 h-12 rounded-full bg-red-900/50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.2)]">
					<Sword size={20} className="ml-1" />
				</div>
			</button>

			{showModal && (
				<BossFightModal
					userId={userId}
					questions={questions}
					onClose={() => setShowModal(false)}
				/>
			)}
		</>
	);
}
