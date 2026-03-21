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
        ],
    },
}

module.exports = nextConfig
