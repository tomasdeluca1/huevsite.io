import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { domain } = await req.json();
        
        if (!domain) {
            return NextResponse.json({ error: 'Dominio requerido' }, { status: 400 });
        }

        // 1. Limpiar el dominio (quitar http:// etc)
        const cleanDomain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
        const wwwDomain = domain.startsWith('www.') ? domain : `www.${cleanDomain}`;
        
        // Resultados
        let resolved = false;
        let method = '';
        let records: string[] = [];

        // 2. Intentar verificar CNAME (típico para www o subdominios)
        try {
            const cnameRecords = await dns.resolveCname(cleanDomain);
            records = [...records, ...cnameRecords];
            if (cnameRecords.some(r => r.includes('huevsite.io'))) {
                resolved = true;
                method = 'CNAME';
            }
        } catch (e) {}

        if (!resolved) {
            try {
                const cnameWww = await dns.resolveCname(wwwDomain);
                records = [...records, ...cnameWww];
                if (cnameWww.some(r => r.includes('huevsite.io'))) {
                    resolved = true;
                    method = 'CNAME (www)';
                }
            } catch (e) {}
        }

        // 3. Intentar verificar A Record (típico para Apex @)
        if (!resolved) {
            try {
                const aRecords = await dns.resolve4(cleanDomain);
                records = [...records, ...aRecords];
                // IP de Vercel (común para apps configuradas allí)
                if (aRecords.includes('76.76.21.21')) {
                    resolved = true;
                    method = 'A Record';
                }
            } catch (e) {}
        }

        return NextResponse.json({
            isValid: resolved,
            method,
            records,
            domain: cleanDomain,
            message: resolved 
                ? `¡Conexión exitosa vía ${method}!` 
                : 'No se detectaron los registros DNS correctos todavía.'
        });

    } catch (error) {
        console.error('Error verifying domain:', error);
        return NextResponse.json({ 
            isValid: false, 
            error: 'Error interno al verificar el dominio' 
        }, { status: 500 });
    }
}
