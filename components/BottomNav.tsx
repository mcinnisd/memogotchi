'use client';

import { Home, BookOpen, Sword, Ghost } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHaptic } from "@/hooks/useHaptic";
import clsx from "clsx";

export default function BottomNav() {
	const pathname = usePathname();
	const { trigger } = useHaptic();

	const navItems = [
		{ name: "Home", href: "/", icon: Home },
		{ name: "Study", href: "/study", icon: BookOpen },
		{ name: "Collection", href: "/collection", icon: Sword },
		{ name: "Pet", href: "/pet", icon: Ghost },
	];

	return (
		<nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
			<div className="bg-zinc-950 border-t border-zinc-800 pb-safe pt-2 px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
				<div className="flex justify-between items-center h-16">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						return (
							<Link
								key={item.name}
								href={item.href}
								onClick={() => trigger('light')}
								className={clsx(
									"flex flex-col items-center justify-center space-y-1 w-16 h-16 rounded-xl transition-all duration-200 active:scale-90",
									isActive ? "text-green-400 bg-green-400/10" : "text-zinc-500 hover:text-green-300"
								)}
							>
								<Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
								<span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
							</Link>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
