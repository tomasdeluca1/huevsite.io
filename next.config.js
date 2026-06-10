/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['@sparticuz/chromium', 'playwright-core', 'playwright'],
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'sdijcsgsfvwwdehcllsm.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            // BDLS blog posts inherit the builder's avatar; most builders
            // have a GitHub-hosted avatar (profile.image from the OAuth flow).
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
        ],
    },
    async redirects() {
        return [
            // The testimonial page is /testimonio; accept the plural too.
            { source: '/testimonios', destination: '/testimonio', permanent: false },
        ];
    },
}

module.exports = nextConfig
