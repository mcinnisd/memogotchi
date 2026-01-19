import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Memogotchi',
		short_name: 'Memo',
		description: 'Gamified Spaced Repetition with a digital pet',
		start_url: '/',
		display: 'standalone',
		background_color: '#000000',
		theme_color: '#000000',
		icons: [
			{
				src: '/icon-192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/icon-512.png',
				sizes: '512x512',
				type: 'image/png',
			},
		],
	}
}
