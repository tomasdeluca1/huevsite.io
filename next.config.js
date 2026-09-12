const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

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
            // Launch de Product Hunt (2026-09-22). Va en el campo "website" de
            // la página de PH y en todo el copy, para que también el tráfico
            // directo desde PH llegue atribuido. El ?lang=en lo consume el
            // middleware, que fija la cookie y limpia la URL conservando el UTM.
            {
                source: '/r/ph',
                destination: '/?lang=en&utm_source=product_hunt&utm_medium=launch',
                permanent: false,
            },
        ];
    },
}

module.exports = withNextIntl(nextConfig)
