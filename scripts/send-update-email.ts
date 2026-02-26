import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // OR NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY if role key is missing, but Service Role is better.
const resendApiKey = process.env.RESEND_API_KEY;

if (!supabaseUrl || !resendApiKey) {
  console.error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o RESEND_API_KEY");
  process.exit(1);
}

// Ensure you have SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS, or use the anon key if RLS allows reading emails.
// If using the anon key, you might not get emails depending on your RLS.
const supabase = createClient(supabaseUrl, supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!);
const resend = new Resend(resendApiKey);

// We simulate React-Email render since we can't easily compile TSX in a plain Node script without transpilation setup.
// I will provide the raw HTML string equivalent of the React Email component.
const getEmailHtml = () => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="es">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
</head>
<body style="background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Oxygen-Sans,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,sans-serif;color:#ffffff;padding:20px 0;">
  <div style="max-width:600px;margin:0 auto;background-color:#09090b;border:1px solid #27272a;border-radius:24px;overflow:hidden;padding:20px;">
    
    <div style="background:linear-gradient(180deg, rgba(200, 255, 0, 0.1) 0%, transparent 100%);padding:40px;border-radius:24px;text-align:center;border:1px solid rgba(200, 255, 0, 0.2)">
      <div style="font-size:48px;margin-bottom:16px">🚀</div>
      <h2 style="font-size:28px;font-weight:800;margin:0 0 8px 0;line-height:1.2;color:#ffffff">
        Llegó la revolución social a Huevsite 🥚🔥
      </h2>
    </div>

    <div style="padding:32px 0;text-align:left;color:#a1a1aa">
      <p style="font-size:18px;line-height:1.6;margin-bottom:24px">¡Hola builder! 👋</p>
      
      <p style="font-size:16px;line-height:1.6;margin-bottom:32px">
        Esta semana estuvimos trabajando a full en el motor (y en la pintura) de Huevsite para que la comunidad siga brillando. Subimos unas actualizaciones que te van a hacer la vida mucho más fácil a la hora de conectar con otros creadores:
      </p>

      <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:32px;">
        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="width:32px;height:32px;border-radius:9999px;background-color:#18181b;border:1px solid #3f3f46;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ffffff;margin-top:2px;">
            🚀
          </div>
          <div>
            <h4 style="color:#ffffff;font-weight:bold;font-size:14px;margin-bottom:4px;">Más de 10 nuevos releases sumados</h4>
            <p style="color:#a1a1aa;font-size:12px;line-height:1.6;">
              ¡Endorsements entre builders, mejoras en la cuenta PRO, followers, y preparate para el feed social que se viene muy pronto!
            </p>
          </div>
        </div>

        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="width:32px;height:32px;border-radius:9999px;background-color:#18181b;border:1px solid #3f3f46;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ffffff;margin-top:2px;">
            🏆
          </div>
          <div>
            <h4 style="color:#ffffff;font-weight:bold;font-size:14px;margin-bottom:4px;">Nominaciones Flexibles 🔄</h4>
            <p style="color:#a1a1aa;font-size:12px;line-height:1.6;">
              ¿Te arrepentiste? Ahora podés cambiar a quién nominás en la semana en cualquier momento antes de que cierre el domingo.
            </p>
          </div>
        </div>

        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="width:32px;height:32px;border-radius:9999px;background-color:#18181b;border:1px solid #3f3f46;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ffffff;margin-top:2px;">
            🔍
          </div>
          <div>
            <h4 style="color:#ffffff;font-weight:bold;font-size:14px;margin-bottom:4px;">Explorador en Esteroides 👀</h4>
            <p style="color:#a1a1aa;font-size:12px;line-height:1.6;">
              Ordená por Endorsements, fijate quiénes te siguen, chusmeá los proyectos actualizados recientemente y mirá los nuevos estilos Premium.
            </p>
          </div>
        </div>
      </div>

      <p style="font-size:16px;line-height:1.6;color:#ffffff;font-weight:bold">
        Entrá a tu cuenta, probá los nuevos filtros y, ya que estás... ¡dejale tu nominación a tu builder favorito de la semana!
      </p>
    </div>

    <div style="text-align:center;margin-top:16px;margin-bottom:24px">
      <a href="https://huevsite.io/explore" style="background-color:#C8FF00;color:#000000;padding:16px 32px;border-radius:12px;font-weight:bold;text-decoration:none;display:inline-block;font-size:16px">
        Explorar la comunidad →
      </a>
    </div>

    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px">
      <p style="font-size:14px;color:#71717a">
        ¡A seguir construyendo! 🚀<br/>El equipo de Huevsite.
      </p>
    </div>

  </div>
</body>
</html>
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("Obteniendo usuarios...");
  const { data: users, error } = await supabase
    .from("profiles")
    .select("email, username")
    .not("email", "is", null);

  if (error || !users) {
    console.error("Error al obtener usuarios:", error);
    process.exit(1);
  }

  // Remove duplicate emails just in case
  const validUsers = Array.from(new Map(users.map(u => [u.email, u])).values());
  
  console.log(`Se encontraron ${validUsers.length} usuarios válidos para enviar el mail.`);
  
  const htmlContent = getEmailHtml();

  for (let i = 0; i < validUsers.length; i++) {
    const user = validUsers[i];
    try {
      console.log(`[${i + 1}/${validUsers.length}] Enviando mail a ${user.email}...`);
      
      const { data, error } = await resend.emails.send({
        from: 'hi@huevsite.studio',
        to: user.email!, // can use a test email here if needed to dry-run
        subject: 'Llegó la revolución social a Huevsite 🥚🔥',
        html: htmlContent,
      });

      if (error) {
         console.error(`Error enviando a ${user.email}:`, error);
      } else {
         console.log(`✓ Éxito: ${user.email} (ID: ${data?.id})`);
      }
    } catch (e) {
      console.error(`Excepción enviando a ${user.email}`, e);
    }
    
    // Timeout of 4 seconds as requested
    if (i < validUsers.length - 1) {
      await delay(4000);
    }
  }

  console.log("¡Terminado!");
}

main();
