import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Memogotchi',
		short_name: 'Memogotchi',
		description: 'Keep a little life by practicing a little every day.',
		start_url: '/',
		display: 'standalone',
		background_color: '#f4ecdf',
		theme_color: '#f4ecdf',
		icons: [
			{
				src: '/icon.svg',
				sizes: 'any',
				type: 'image/svg+xml',
			},
		],
	};
}
