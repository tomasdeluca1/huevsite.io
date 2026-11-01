import { BRAND } from '@/lib/brand';
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'huevsite.io',
        short_name: 'huevsite',
        description: 'Red social y portfolio para builders de Argentina y LATAM.',
        start_url: '/',
        display: 'standalone',
        background_color: BRAND.color.bg,
        theme_color: BRAND.color.bg,
        icons: [
            {
                src: '/icons/icon-32.png',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
