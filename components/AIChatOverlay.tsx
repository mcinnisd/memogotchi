'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot } from "lucide-react";
import { chatWithPet } from "@/actions/chatWithPet";

interface AIChatOverlayProps {
	isOpen: boolean;
	onClose: () => void;
	context?: string; // e.g. "Card: How to say Hello"
}

export default function AIChatOverlay({ isOpen, onClose, context }: AIChatOverlayProps) {
	const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
		{ role: 'assistant', content: "Beep boop! I'm here to help. Ask me anything!" }
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen && bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [isOpen, messages]);

	const handleSend = async () => {
		if (!input.trim() || loading) return;

		const userMsg = input;
		setInput("");
		setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
		setLoading(true);

		const response = await chatWithPet(userMsg, context);

		setMessages(prev => [...prev, { role: 'assistant', content: response }]);
		setLoading(false);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ y: '100%' }}
					animate={{ y: 0 }}
					exit={{ y: '100%' }}
					transition={{ type: "spring", damping: 25, stiffness: 200 }}
					className="fixed bottom-0 left-0 right-0 h-[80vh] bg-zinc-950 border-t border-green-500 z-[80] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] flex flex-col max-w-md mx-auto"
				>
					{/* Header */}
					<div className="flex justify-between items-center p-6 border-b border-zinc-900 bg-zinc-950/95 backdrop-blur rounded-t-3xl sticky top-0 z-10">
						<div className="flex items-center space-x-3">
							<div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 animate-pulse-slow">
								<Bot size={24} />
							</div>
							<div>
								<h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">Pet Link</h2>
								<span className="text-[10px] text-zinc-500">Connected to Mainframe</span>
							</div>
						</div>
						<button onClick={onClose} className="bg-zinc-900 p-2 rounded-full text-zinc-500 hover:text-white">
							<X size={20} />
						</button>
					</div>

					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{messages.map((msg, i) => (
							<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
								<div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
										? 'bg-zinc-800 text-zinc-100 rounded-tr-none'
										: 'bg-green-500/10 text-green-400 border border-green-500/20 rounded-tl-none'
									}`}>
									{msg.content}
								</div>
							</div>
						))}
						{loading && (
							<div className="flex justify-start">
								<div className="bg-zinc-900 border border-zinc-800 text-zinc-500 px-4 py-2 rounded-full text-xs animate-pulse">
									Thinking...
								</div>
							</div>
						)}
						<div ref={bottomRef} />
					</div>

					{/* Input */}
					<div className="p-4 bg-zinc-950 border-t border-zinc-900 pb-safe">
						<form
							className="flex space-x-2"
							onSubmit={(e) => { e.preventDefault(); handleSend(); }}
						>
							<input
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Ask for clarification..."
								className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-green-500 transition-colors"
							/>
							<button
								type="submit"
								disabled={loading}
								className="bg-green-500 text-black p-3 rounded-xl hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								<Send size={20} />
							</button>
						</form>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
