import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos de Servicio | huevsite.io',
  description: 'Términos y condiciones de uso de huevsite.io — la plataforma para builders de Argentina y LATAM.',
}

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-2 tracking-tight">Términos de Servicio</h1>
        <p className="text-gray-400 mb-12">Última actualización: abril 2025</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-semibold mb-4">1. Aceptación de los términos</h2>
            <p className="text-gray-300 leading-relaxed">
              Al acceder o usar huevsite.io, aceptás estos Términos de Servicio en su totalidad. Si no estás de acuerdo con alguno de estos términos, no uses la plataforma. huevsite.io es operada por huevsite.studio, con contacto en{' '}
              <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Descripción del servicio</h2>
            <p className="text-gray-300 leading-relaxed">
              huevsite.io es una plataforma de portfolio social para builders y creadores. Permite crear perfiles públicos, mostrar proyectos y habilidades, conectar cuentas de GitHub, interactuar con otros builders y acceder a herramientas premium mediante suscripción Pro.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              El plan gratuito incluye funcionalidades básicas. El plan Pro ($9 USD/mes, procesado mediante Lemon Squeezy) desbloquea funcionalidades adicionales como más bloques de contenido, dominios personalizados y herramientas avanzadas. También ofrecemos el plan Founder ($79 USD, pago único) con acceso de por vida a las funcionalidades Pro. Los precios pueden actualizarse; los cambios no afectan retroactivamente a suscripciones activas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Uso aceptable</h2>
            <p className="text-gray-300 leading-relaxed mb-3">Al usar huevsite.io te comprometés a:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Proporcionar información veraz en tu perfil</li>
              <li>No publicar contenido ofensivo, discriminatorio, ilegal o que vulnere derechos de terceros</li>
              <li>No usar la plataforma para spam, phishing o actividades fraudulentas</li>
              <li>No intentar acceder sin autorización a sistemas o cuentas de otros usuarios</li>
              <li>No usar scripts automatizados para extraer datos masivamente</li>
              <li>Respetar las leyes aplicables en tu jurisdicción</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Nos reservamos el derecho de suspender o eliminar cuentas que violen estas condiciones, sin previo aviso y a nuestra sola discreción.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Propiedad del contenido</h2>
            <p className="text-gray-300 leading-relaxed">
              El contenido que publicás en tu perfil (textos, imágenes, proyectos) sigue siendo tuyo. Al publicarlo en huevsite.io, nos otorgás una licencia no exclusiva, gratuita y mundial para mostrarlo y distribuirlo dentro de la plataforma con el fin de brindar el servicio.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              No vendemos ni cedemos tu contenido a terceros. Podés eliminar tu contenido y tu cuenta en cualquier momento desde la configuración de tu perfil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Suscripción Pro y pagos</h2>
            <p className="text-gray-300 leading-relaxed">
              El plan Pro se factura mensualmente. Los pagos son procesados por LemonSqueezy, un proveedor externo de pagos. Podés cancelar tu suscripción en cualquier momento; el acceso Pro se mantiene hasta el fin del período facturado.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              No ofrecemos reembolsos salvo que la ley aplicable lo requiera. Los precios pueden cambiar con 30 días de aviso previo a los suscriptores activos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Terminación de cuenta</h2>
            <p className="text-gray-300 leading-relaxed">
              Podés eliminar tu cuenta en cualquier momento enviando un email a{' '}
              <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>.
              Nos reservamos el derecho de suspender o terminar cuentas que violen estos términos, realicen actividades fraudulentas o representen un riesgo para la plataforma o sus usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Limitación de responsabilidad</h2>
            <p className="text-gray-300 leading-relaxed">
              huevsite.io se provee "tal como está". No garantizamos disponibilidad ininterrumpida, ausencia de errores ni que el servicio cumpla con todos tus requisitos específicos.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              En ningún caso seremos responsables por daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso de la plataforma. Nuestra responsabilidad máxima se limita al monto pagado por el servicio en los últimos 3 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Cambios a los términos</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos actualizar estos términos periódicamente. Te notificaremos sobre cambios significativos mediante email o un aviso en la plataforma. El uso continuado del servicio luego de la notificación implica la aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Contacto</h2>
            <p className="text-gray-300 leading-relaxed">
              Para cualquier consulta sobre estos términos, escribinos a{' '}
              <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">hi@huevsite.studio</a>.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-white transition-colors">Política de Privacidad</Link>
          <Link href="/" className="hover:text-white transition-colors">huevsite.io</Link>
        </div>
      </div>
    </div>
  )
}
