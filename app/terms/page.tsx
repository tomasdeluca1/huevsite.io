import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { canonical } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return {
    title: t('terms.metaTitle'),
    description: t('terms.metaDescription'),
    alternates: { canonical: canonical('/terms') },
  }
}

export default async function TermsPage() {
  const t = await getTranslations('legal')
  return (
    <div className="min-h-screen bg-[#080808] text-white px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToHome')}
        </Link>

        <h1 className="text-4xl font-bold mb-2 tracking-tight">{t('terms.title')}</h1>
        <p className="text-gray-400 mb-12">{t('terms.lastUpdated')}</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section1Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t.rich('terms.section1Body', {
                mail: (chunks) => (
                  <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section2Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section2Body1')}
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('terms.section2Body2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section3Title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-3">{t('terms.section3Intro')}</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>{t('terms.section3Item1')}</li>
              <li>{t('terms.section3Item2')}</li>
              <li>{t('terms.section3Item3')}</li>
              <li>{t('terms.section3Item4')}</li>
              <li>{t('terms.section3Item5')}</li>
              <li>{t('terms.section3Item6')}</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('terms.section3Outro')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section4Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section4Body1')}
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('terms.section4Body2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section5Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section5Body1')}
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('terms.section5Body2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section6Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t.rich('terms.section6Body', {
                mail: (chunks) => (
                  <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section7Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section7Body1')}
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('terms.section7Body2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section8Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('terms.section8Body')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('terms.section9Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t.rich('terms.section9Body', {
                mail: (chunks) => (
                  <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-white transition-colors">{t('privacyLink')}</Link>
          <Link href="/" className="hover:text-white transition-colors">huevsite.io</Link>
        </div>
      </div>
    </div>
  )
}
