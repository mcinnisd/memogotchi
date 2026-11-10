/** @type {import('next').NextConfig} */
const nextConfig = {
	async redirects() {
		return [
			{ source: '/study', destination: '/', permanent: false },
			{ source: '/collection', destination: '/friends', permanent: false },
		];
	},
};

export default nextConfig;
