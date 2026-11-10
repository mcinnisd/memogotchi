import type { Metadata, Viewport } from 'next';
import { Gaegu, Nunito } from 'next/font/google';
import './globals.css';

const display = Gaegu({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-display' });
const body = Nunito({ subsets: ['latin'], variable: '--font-body' });
const hand = Gaegu({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-hand' });

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: '#f4ecdf',
};

export const metadata: Metadata = {
	title: 'Memogotchi',
	description: 'Keep a little life by practicing a little every day.',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'Memogotchi',
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className={`${display.variable} ${body.variable} ${hand.variable} bg-[#efe4d2] text-ink antialiased`}>
				{children}
			</body>
		</html>
	);
}
