const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

export const vercelService = {
  async addDomain(domain: string) {
    if (!VERCEL_TOKEN || !PROJECT_ID) {
      console.error('Vercel configuration missing');
      return { success: false, error: 'Configuración de Vercel incompleta' };
    }

    try {
      const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el dominio ya existe en el proyecto, lo tratamos como éxito
        if (data.error?.code === 'domain_already_in_use' || data.error?.code === 'domain_taken') {
            return { success: true, alreadyExists: true };
        }
        console.error('Vercel API error adding domain:', data);
        return { success: false, error: data.error?.message || 'Error al agregar dominio en Vercel' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Vercel addDomain error:', error);
      return { success: false, error: 'Error de conexión con Vercel' };
    }
  },

  async removeDomain(domain: string) {
    if (!VERCEL_TOKEN || !PROJECT_ID) return { success: false };

    try {
      const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/domains/${domain}${TEAM_ID ? `?teamId=${TEAM_ID}` : ''}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Si no existe, no pasa nada
        if (response.status === 404) return { success: true };
        console.error('Vercel API error removing domain:', data);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('Vercel removeDomain error:', error);
      return { success: false };
    }
  }
};
