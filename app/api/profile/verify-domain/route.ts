import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';

export const dynamic = 'force-dynamic';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

export async function POST(req: NextRequest) {
    try {
        const { domain } = await req.json();
        
        if (!domain) {
            return NextResponse.json({ error: 'Dominio requerido' }, { status: 400 });
        }

        const cleanDomain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
        
        // 1. Verificar primero con Vercel API (más preciso)
        if (VERCEL_TOKEN && PROJECT_ID) {
            try {
                const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${cleanDomain}${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`;
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    
                    if (data.verified && data.configuredBy) {
                        return NextResponse.json({
                            isValid: true,
                            method: 'Vercel API',
                            message: '¡Dominio correctamente configurado y verificado en Vercel!'
                        });
                    }
                }
            } catch (e) {
                console.error('Error fetching Vercel domain status:', e);
            }
        }

        // 2. Fallback a DNS manual (si Vercel aún no lo ve o no hay tokens)
        let resolved = false;
        let method = '';
        
        // Intento CNAME
        try {
            const cnameRecords = await dns.resolveCname(cleanDomain);
            if (cnameRecords.some(r => r.includes('huevsite.io') || r.includes('vercel.pub'))) {
                resolved = true;
                method = 'CNAME';
            }
        } catch (e) {}

        // Intento A Record
        if (!resolved) {
            try {
                const aRecords = await dns.resolve4(cleanDomain);
                if (aRecords.includes('76.76.21.21')) { // IP estándar de Vercel
                    resolved = true;
                    method = 'A Record';
                }
            } catch (e) {}
        }

        return NextResponse.json({
            isValid: resolved,
            method,
            domain: cleanDomain,
            message: resolved 
                ? `Los registros DNS parecen estar bien (${method}), pero Vercel aún está procesando el SSL. Esperá unos minutos.` 
                : 'No se detectaron los registros DNS. Asegurate de haber configurado el CNAME o el registro A correctamente.'
        });

    } catch (error) {
        console.error('Error verifying domain:', error);
        return NextResponse.json({ 
            isValid: false, 
            error: 'Error interno al verificar el dominio' 
        }, { status: 500 });
    }
}
