import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'huevsite.io',
        short_name: 'huevsite',
        description: 'Red social y portfolio para builders de Argentina y LATAM.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
            {
                src: '/icon.jpeg',
                sizes: '300x320',
                type: 'image/jpeg',
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
            {
                src: '/icon.jpeg',
                sizes: 'any',
                type: 'image/jpeg',
            },
        ],
    }
}
