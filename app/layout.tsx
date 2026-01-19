import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google"; // Retro-tech feel
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
	display: 'swap',
});

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false, // Disables pinch-zoom for app-like feel
	themeColor: "#000000",
};

export const metadata: Metadata = {
	title: "Memogotchi",
	description: "Learn with your pet",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Memogotchi",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-black text-green-400 font-mono`}
			>
				<main className="max-w-md mx-auto min-h-[100dvh] relative overflow-hidden bg-zinc-950 border-x border-zinc-800 shadow-2xl">
					{children}
				</main>
			</body>
		</html>
	);
}
