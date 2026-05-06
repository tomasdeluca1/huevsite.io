import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad | huevsite.io',
  description: 'Cómo recopilamos, usamos y protegemos tus datos en huevsite.io.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-4xl font-bold mb-2 tracking-tight">Política de Privacidad</h1>
        <p className="text-gray-400 mb-12">Última actualización: mayo 2026</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introducción</h2>
            <p className="text-gray-300 leading-relaxed">
              En huevsite.io nos tomamos tu privacidad en serio. Esta política explica qué datos recopilamos, cómo los usamos y cómo los protegemos. Si tenés preguntas, escribinos a{' '}
              <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Datos que recopilamos</h2>
            <p className="text-gray-300 leading-relaxed mb-3">Recopilamos los siguientes tipos de datos:</p>

            <h3 className="text-base font-semibold mb-2 text-gray-200">Datos de cuenta</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
              <li>Email y nombre (al registrarte o autenticarte con GitHub)</li>
              <li>Foto de perfil (opcional, desde GitHub o subida por vos)</li>
              <li>Username y tagline de tu perfil</li>
            </ul>

            <h3 className="text-base font-semibold mb-2 text-gray-200">Datos de uso</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
              <li>Bloques de contenido que creás en tu perfil</li>
              <li>Interacciones sociales (follows, endorsements)</li>
              <li>Actividad en la plataforma (vistas de perfil, clicks)</li>
            </ul>

            <h3 className="text-base font-semibold mb-2 text-gray-200">Datos técnicos</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Dirección IP (anonimizada para analytics)</li>
              <li>Tipo de navegador y sistema operativo</li>
              <li>Páginas visitadas y tiempo de sesión</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Cómo usamos tus datos</h2>
            <p className="text-gray-300 leading-relaxed mb-3">Usamos tus datos exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Proveer y mejorar el servicio de huevsite.io</li>
              <li>Autenticar tu cuenta y mantener tu sesión activa</li>
              <li>Mostrarte notificaciones relevantes sobre tu perfil</li>
              <li>Enviarte emails transaccionales (confirmaciones de pago, cambios de cuenta)</li>
              <li>Analizar el uso agregado de la plataforma para mejorar la experiencia</li>
              <li>Procesar tu suscripción Pro a través de LemonSqueezy</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              No vendemos, alquilamos ni cedemos tus datos personales a terceros con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Newsletter del founder</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Cuando creás una cuenta en huevsite.io, sumamos tu email al newsletter personal que escribe Tomás (founder de huevsite.io). Es un newsletter de baja frecuencia (típicamente 1-2 envíos por mes) enfocado en SEO aplicado y crecimiento orgánico, con experimentos reales sacados de los productos que está armando en paralelo — huevsite.io y <a href="https://creatibro.com" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">creatibro</a>.
            </p>
            <p className="text-gray-300 leading-relaxed mb-3">
              Podés darte de baja en cualquier momento desde:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>El link de "unsubscribe" al pie de cualquier email del newsletter</li>
              <li>El toggle "Newsletter" en la configuración de tu dashboard</li>
              <li>Escribiéndonos a <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a></li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Los usuarios que se registraron antes de la entrada en vigencia de esta cláusula (mayo 2026) no fueron sumados automáticamente y pueden activar la suscripción manualmente desde el dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Servicios de terceros</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Para operar huevsite.io usamos los siguientes servicios externos, cada uno con su propia política de privacidad:
            </p>

            <div className="space-y-4">
              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">Supabase</h3>
                <p className="text-gray-300 text-sm">Base de datos y autenticación. Tus datos se almacenan en servidores seguros de Supabase. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">Ver política</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">LemonSqueezy</h3>
                <p className="text-gray-300 text-sm">Procesamiento de pagos para el plan Pro. LemonSqueezy maneja tu información de pago; nosotros no almacenamos datos de tarjetas. <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">Ver política</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">GitHub</h3>
                <p className="text-gray-300 text-sm">Autenticación OAuth y datos públicos de tu perfil de GitHub (repositorios, estrellas, seguidores) cuando conectás tu cuenta. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">Ver política</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">Umami Analytics</h3>
                <p className="text-gray-300 text-sm">Analytics de uso anónimos y sin cookies. No recopila información personal identificable. <a href="https://umami.is/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">Ver política</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">Resend</h3>
                <p className="text-gray-300 text-sm">Envío de emails transaccionales (notificaciones, confirmaciones). <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">Ver política</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">Beehiiv</h3>
                <p className="text-gray-300 text-sm">Plataforma del newsletter del founder. Almacena tu email y lo usa exclusivamente para enviarte el newsletter al que estás suscripto. <a href="https://www.beehiiv.com/tou/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">Ver política</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Cookies y tracking</h2>
            <p className="text-gray-300 leading-relaxed">
              Usamos cookies esenciales para mantener tu sesión autenticada. Para analytics usamos Umami, que no utiliza cookies y procesa datos de forma anónima.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              No usamos cookies de seguimiento de terceros ni publicidad comportamental.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Tus derechos</h2>
            <p className="text-gray-300 leading-relaxed mb-3">Tenés derecho a:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong className="text-white">Acceso:</strong> solicitar una copia de los datos que tenemos sobre vos</li>
              <li><strong className="text-white">Corrección:</strong> actualizar datos incorrectos o desactualizados</li>
              <li><strong className="text-white">Eliminación:</strong> solicitar que eliminemos tu cuenta y datos personales</li>
              <li><strong className="text-white">Portabilidad:</strong> recibir tus datos en un formato estándar</li>
              <li><strong className="text-white">Oposición:</strong> oponerte al procesamiento de tus datos en ciertos casos</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Para ejercer cualquiera de estos derechos, escribinos a{' '}
              <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>.
              Respondemos en un plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Seguridad</h2>
            <p className="text-gray-300 leading-relaxed">
              Implementamos medidas técnicas y organizativas para proteger tus datos: conexiones HTTPS, autenticación segura, acceso restringido a bases de datos y revisión periódica de permisos. Sin embargo, ningún sistema es 100% seguro. Si detectás una vulnerabilidad, reportala a{' '}
              <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Retención de datos</h2>
            <p className="text-gray-300 leading-relaxed">
              Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, borramos tus datos personales en un plazo de 30 días, salvo que debamos retenerlos por obligaciones legales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Cambios a esta política</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos por email o mediante un aviso en la plataforma. La fecha de "última actualización" al inicio de esta página indica cuándo fue revisada por última vez.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Contacto</h2>
            <p className="text-gray-300 leading-relaxed">
              Para cualquier consulta sobre privacidad o para ejercer tus derechos, contactanos en{' '}
              <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-white transition-colors">Términos de Servicio</Link>
          <Link href="/" className="hover:text-white transition-colors">huevsite.io</Link>
        </div>
      </div>
    </div>
  )
}
