'use client';

import type { SpeciesId } from '@/lib/species';
import type { SpriteState } from '@/lib/care/types';

function Eye({ x, y, sad, closed }: { x: number; y: number; sad?: boolean; closed?: boolean }) {
	if (closed) {
		return <path d={`M ${x - 7} ${y} q 7 6 14 0`} fill="none" stroke="#3e2c22" strokeWidth="2.4" strokeLinecap="round" />;
	}
	return (
		<g>
			<ellipse cx={x} cy={y} rx={sad ? 3.1 : 3.4} ry={sad ? 3.6 : 3.8} fill="#2c2118" />
			<circle cx={x + 1.1} cy={y - 1.2} r="1.1" fill="#fff8ee" />
			{sad && <path d={`M ${x - 0.4} ${y + 4} q 2 7 4 9`} stroke="#8eb7d6" strokeWidth="1.7" fill="none" strokeLinecap="round" />}
		</g>
	);
}

function Blush({ x, y }: { x: number; y: number }) {
	return <ellipse cx={x} cy={y} rx="8" ry="4.5" fill="#f0b39a" opacity="0.9" />;
}

function Feet({ y = 150 }: { y?: number }) {
	return (
		<g fill="#e1893f">
			<ellipse cx="78" cy={y} rx="10" ry="5" />
			<ellipse cx="122" cy={y} rx="10" ry="5" />
		</g>
	);
}

export function EggArt({ crack = 0.4 }: { crack?: number }) {
	return (
		<svg viewBox="0 0 200 210" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="188" rx="46" ry="10" fill="rgba(120,90,60,0.18)" />
			<ellipse cx="100" cy="108" rx="62" ry="78" fill="#f6ead4" stroke="#c9a27a" strokeWidth="3" />
			<ellipse cx="78" cy="78" rx="16" ry="10" fill="#fff" opacity="0.35" />
			<circle cx="70" cy="120" r="7" fill="#e7a882" opacity="0.85" />
			<circle cx="128" cy="96" r="5" fill="#e7a882" opacity="0.7" />
			<circle cx="112" cy="142" r="3.5" fill="#e0b089" />
			<circle cx="86" cy="150" r="2.5" fill="#e0b089" />
			<path
				d="M92 42 l8 16 l-6 8 l10 14"
				fill="none"
				stroke="#8a6248"
				strokeWidth="2.4"
				strokeLinecap="round"
				strokeLinejoin="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - crack}
			/>
		</svg>
	);
}

interface ArtProps {
	state: SpriteState;
	expression?: 'happy' | 'soft' | 'sad';
	resting?: boolean;
}

function face(expression: ArtProps['expression'], resting?: boolean) {
	return {
		closed: Boolean(resting),
		sad: expression === 'sad',
		soft: expression === 'soft' || expression === 'sad',
	};
}

function Chick({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	const shell = state === 'hatchling';
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="164" rx="40" ry="8" fill="rgba(120,90,60,0.15)" />
			{shell && <path d="M48 118 h104 l-10 36 h-84 z" fill="#f4e7cf" stroke="#d9c3a2" strokeWidth="2" />}
			<ellipse cx="100" cy={shell ? 96 : 92} rx={shell ? 48 : 58} ry={shell ? 46 : 54} fill="#f6e3b8" />
			<ellipse cx="78" cy="108" rx="16" ry="12" fill="#f0d39a" />
			<ellipse cx="124" cy="110" rx="14" ry="10" fill="#f0d39a" />
			{state === 'well_loved' && <ellipse cx="100" cy="78" rx="22" ry="10" fill="#fff6df" opacity="0.7" />}
			<Blush x={64} y={100} />
			<Blush x={136} y={100} />
			<Eye x={82} y={88} sad={sad} closed={closed} />
			<Eye x={118} y={88} sad={sad} closed={closed} />
			<path d={sad ? 'M90 112 q10 6 20 0' : 'M88 108 q12 12 24 0'} fill="#e1893f" />
			<path d="M100 104 l8 8 l-8 8 z" fill="#ef9a3c" />
			{!shell && <Feet />}
		</svg>
	);
}

function Fox({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	const small = state === 'hatchling';
	const s = small ? 0.86 : 1;
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="166" rx="46" ry="8" fill="rgba(120,90,60,0.15)" />
			<g transform={`translate(${(1 - s) * 100} ${(1 - s) * 80}) scale(${s})`}>
				<path d="M46 78 L62 28 L86 70 Z" fill="#e07a3a" />
				<path d="M154 78 L138 28 L114 70 Z" fill="#e07a3a" />
				<path d="M58 46 L70 34 L74 58 Z" fill="#f6d7c0" />
				<path d="M142 46 L130 34 L126 58 Z" fill="#f6d7c0" />
				<ellipse cx="100" cy="104" rx="52" ry="46" fill="#e88745" />
				<ellipse cx="100" cy="118" rx="28" ry="24" fill="#f7efe4" />
				<path d="M150 120 q28 18 8 36 q-20 4 -28 -8" fill="#e07a3a" />
				<path d="M156 146 q8 6 -2 10" fill="#f4efe6" />
				<ellipse cx="78" cy="150" rx="12" ry="7" fill="#5c3b32" />
				<ellipse cx="122" cy="150" rx="12" ry="7" fill="#5c3b32" />
				<Blush x={70} y={112} />
				<Blush x={130} y={112} />
				<Eye x={84} y={96} sad={sad} closed={closed} />
				<Eye x={116} y={96} sad={sad} closed={closed} />
				<path d="M100 108 l-5 6 h10 z" fill="#3e2c22" />
				{state === 'well_loved' && <path d="M92 124 q8 6 16 0" stroke="#c46a55" strokeWidth="2" fill="none" strokeLinecap="round" />}
				{sad && <path d="M90 124 q10 -6 20 0" stroke="#a85a48" strokeWidth="2" fill="none" />}
			</g>
		</svg>
	);
}

function Sprout({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	const wilt = state === 'needs_love' || sad;
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="166" rx="36" ry="7" fill="rgba(120,90,60,0.15)" />
			<ellipse cx="100" cy="112" rx="46" ry="42" fill="#c49a6a" />
			<ellipse cx="84" cy="100" rx="10" ry="7" fill="#b18455" opacity="0.6" />
			<path d={wilt ? 'M100 78 C108 60 96 48 110 40' : 'M100 74 C104 48 96 36 112 28'} stroke="#5f8a3c" strokeWidth="4" fill="none" strokeLinecap="round" />
			<ellipse cx={wilt ? 112 : 116} cy={wilt ? 42 : 30} rx="12" ry="7" fill="#7eaa4c" transform={wilt ? 'rotate(28 112 42)' : 'rotate(-18 116 30)'} />
			{state === 'well_loved' && (
				<g transform="translate(124 34)">
					<circle cx="0" cy="0" r="4" fill="#f2d36b" />
					<circle cx="0" cy="-6" r="3" fill="#f4e7a0" />
					<circle cx="5" cy="-2" r="3" fill="#f4e7a0" />
					<circle cx="-5" cy="-2" r="3" fill="#f4e7a0" />
				</g>
			)}
			<Eye x={84} y={108} sad={sad} closed={closed} />
			<Eye x={116} y={108} sad={sad} closed={closed} />
			<Blush x={72} y={120} />
			<Blush x={128} y={120} />
			<path d={sad ? 'M92 128 q8 4 16 0' : 'M90 126 q10 8 20 0'} stroke="#6b4a32" strokeWidth="2" fill="none" strokeLinecap="round" />
		</svg>
	);
}

function Mouse({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	const r = state === 'hatchling' ? 40 : state === 'well_loved' ? 52 : 46;
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="166" rx="36" ry="7" fill="rgba(120,90,60,0.15)" />
			<ellipse cx="62" cy="62" rx="22" ry="26" fill="#c8c2bc" />
			<ellipse cx="138" cy="62" rx="22" ry="26" fill="#c8c2bc" />
			<ellipse cx="62" cy="62" rx="12" ry="16" fill="#f3c9cf" />
			<ellipse cx="138" cy="62" rx="12" ry="16" fill="#f3c9cf" />
			<ellipse cx="100" cy="108" rx={r} ry={r - 2} fill="#d9d3cc" />
			<ellipse cx="100" cy="122" rx="18" ry="14" fill="#f7f1ea" />
			<circle cx="100" cy="112" r="3" fill="#e7a0b0" />
			<Eye x={84} y={100} sad={sad} closed={closed} />
			<Eye x={116} y={100} sad={sad} closed={closed} />
			<Blush x={70} y={114} />
			<Blush x={130} y={114} />
			<path d="M148 120 q24 10 16 28" stroke="#c8c2bc" strokeWidth="8" fill="none" strokeLinecap="round" />
		</svg>
	);
}

function Frog({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	if (state === 'hatchling') {
		return (
			<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
				<ellipse cx="100" cy="150" rx="50" ry="8" fill="rgba(120,90,60,0.12)" />
				<ellipse cx="92" cy="100" rx="36" ry="26" fill="#8fbf5a" />
				<path d="M120 100 q40 8 28 24" stroke="#6ea244" strokeWidth="8" fill="none" strokeLinecap="round" />
				<Eye x={80} y={94} sad={sad} closed={closed} />
				<Eye x={104} y={94} sad={sad} closed={closed} />
				<Blush x={74} y={106} />
			</svg>
		);
	}
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="162" rx="48" ry="8" fill="rgba(120,90,60,0.13)" />
			<ellipse cx="64" cy="70" rx="22" ry="22" fill="#7fb24e" />
			<ellipse cx="136" cy="70" rx="22" ry="22" fill="#7fb24e" />
			<ellipse cx="64" cy="70" rx="12" ry="12" fill="#f4f7ea" />
			<ellipse cx="136" cy="70" rx="12" ry="12" fill="#f4f7ea" />
			<Eye x={64} y={70} sad={sad} closed={closed} />
			<Eye x={136} y={70} sad={sad} closed={closed} />
			<ellipse cx="100" cy="112" rx="58" ry="42" fill="#8fbf5a" />
			<ellipse cx="100" cy="124" rx="28" ry="18" fill="#d5e7a4" />
			<path d={sad ? 'M88 128 q12 6 24 0' : 'M86 124 q14 12 28 0'} stroke="#3e2c22" strokeWidth="2.2" fill="none" strokeLinecap="round" />
			<ellipse cx="58" cy="146" rx="14" ry="8" fill="#6ea244" />
			<ellipse cx="142" cy="146" rx="14" ry="8" fill="#6ea244" />
		</svg>
	);
}

function Butterfly({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	if (state === 'hatchling') {
		return (
			<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
				<ellipse cx="100" cy="160" rx="40" ry="7" fill="rgba(120,90,60,0.12)" />
				<ellipse cx="78" cy="110" rx="18" ry="16" fill="#8fbf5a" />
				<ellipse cx="100" cy="100" rx="20" ry="18" fill="#7eaf4c" />
				<ellipse cx="122" cy="112" rx="18" ry="16" fill="#9ccc68" />
				<Eye x={96} y={96} sad={sad} closed={closed} />
				<Eye x={112} y={98} sad={sad} closed={closed} />
				<path d="M92 78 q4 -16 2 -24" stroke="#5f8a3c" strokeWidth="2" fill="none" />
				<path d="M108 78 q2 -16 6 -22" stroke="#5f8a3c" strokeWidth="2" fill="none" />
			</svg>
		);
	}
	const dull = state === 'needs_love' || sad;
	const wing = dull ? '#e09858' : '#f08a2a';
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="46" cy="78" rx="34" ry="28" fill={wing} stroke="#3e2c22" strokeWidth="2" />
			<ellipse cx="154" cy="78" rx="34" ry="28" fill={wing} stroke="#3e2c22" strokeWidth="2" />
			<ellipse cx="58" cy="122" rx="26" ry="22" fill={wing} stroke="#3e2c22" strokeWidth="2" />
			<ellipse cx="142" cy="122" rx="26" ry="22" fill={wing} stroke="#3e2c22" strokeWidth="2" />
			<circle cx="40" cy="70" r="4" fill="#f7f1e4" />
			<circle cx="160" cy="70" r="4" fill="#f7f1e4" />
			<ellipse cx="100" cy="100" rx="14" ry="36" fill="#5c4636" />
			<Eye x={94} y={86} sad={sad} closed={closed} />
			<Eye x={106} y={86} sad={sad} closed={closed} />
			<path d="M92 62 q-8 -16 -2 -22" stroke="#3e2c22" strokeWidth="1.6" fill="none" />
			<path d="M108 62 q8 -16 2 -22" stroke="#3e2c22" strokeWidth="1.6" fill="none" />
		</svg>
	);
}

function Bun({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	const fluff = state === 'well_loved';
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="166" rx="42" ry="8" fill="rgba(120,90,60,0.14)" />
			<ellipse cx="70" cy="48" rx="16" ry="34" fill="#f4e6d4" />
			<ellipse cx="130" cy="48" rx="16" ry="34" fill="#f4e6d4" />
			<ellipse cx="70" cy="52" rx="8" ry="22" fill="#f6c9cf" />
			<ellipse cx="130" cy="52" rx="8" ry="22" fill="#f6c9cf" />
			<ellipse cx="100" cy="108" rx={fluff ? 58 : 50} ry={fluff ? 48 : 42} fill="#f7efe4" />
			{fluff && <ellipse cx="100" cy="120" rx="30" ry="16" fill="#fff" opacity="0.7" />}
			<Eye x={84} y={100} sad={sad} closed={closed} />
			<Eye x={116} y={100} sad={sad} closed={closed} />
			<Blush x={68} y={114} />
			<Blush x={132} y={114} />
			<path d="M96 112 l4 4 l4 -4" stroke="#e7a0b0" strokeWidth="2" fill="none" />
			<ellipse cx="74" cy="150" rx="12" ry="7" fill="#f4e6d4" />
			<ellipse cx="126" cy="150" rx="12" ry="7" fill="#f4e6d4" />
		</svg>
	);
}

function Cap({ state, expression, resting }: ArtProps) {
	const { closed, sad } = face(expression, resting);
	const droop = state === 'needs_love' || sad;
	return (
		<svg viewBox="0 0 200 180" className="h-full w-full" aria-hidden>
			<ellipse cx="100" cy="164" rx="36" ry="7" fill="rgba(120,90,60,0.14)" />
			<g transform={droop ? 'rotate(8 100 110)' : undefined}>
				<path d="M40 100 Q100 20 160 100 Q100 78 40 100" fill="#e15b4a" />
				<circle cx="78" cy="78" r="6" fill="#f7f1e4" />
				<circle cx="108" cy="64" r="5" fill="#f7f1e4" />
				<circle cx="132" cy="84" r="4.5" fill="#f7f1e4" />
				<rect x="82" y="96" width="36" height="40" rx="16" fill="#f3e2c4" />
				<Eye x={90} y={112} sad={sad} closed={closed} />
				<Eye x={114} y={112} sad={sad} closed={closed} />
				<Blush x={78} y={124} />
				<Blush x={126} y={124} />
			</g>
			<path d="M70 156 q10 -8 16 0" stroke="#6f9a4a" strokeWidth="3" fill="none" />
			<path d="M118 158 q12 -10 18 2" stroke="#6f9a4a" strokeWidth="3" fill="none" />
		</svg>
	);
}

const DRAW: Record<SpeciesId, (props: ArtProps) => JSX.Element> = {
	chick: Chick,
	fox: Fox,
	sprout: Sprout,
	mouse: Mouse,
	frog: Frog,
	butterfly: Butterfly,
	bun: Bun,
	cap: Cap,
};

export function PetArt({
	species,
	state,
	expression = 'happy',
	resting = false,
}: {
	species: SpeciesId;
	state: SpriteState;
	expression?: 'happy' | 'soft' | 'sad';
	resting?: boolean;
}) {
	if (state === 'egg') return <EggArt crack={0.55} />;
	const Draw = DRAW[species];
	const resolved = state === 'needs_love' && expression === 'happy' ? 'sad' : expression;
	return <Draw state={state} expression={resolved} resting={resting} />;
}
