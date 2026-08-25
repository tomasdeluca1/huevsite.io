import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { canonical } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('legal')
  return {
    title: t('privacy.metaTitle'),
    description: t('privacy.metaDescription'),
    alternates: { canonical: canonical('/privacy') },
  }
}

export default async function PrivacyPage() {
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

        <h1 className="text-4xl font-bold mb-2 tracking-tight">{t('privacy.title')}</h1>
        <p className="text-gray-400 mb-12">{t('privacy.lastUpdated')}</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-10">

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section1Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t.rich('privacy.section1Body', {
                mail: (chunks) => (
                  <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section2Title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-3">{t('privacy.section2Intro')}</p>

            <h3 className="text-base font-semibold mb-2 text-gray-200">{t('privacy.section2AccountTitle')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
              <li>{t('privacy.section2Account1')}</li>
              <li>{t('privacy.section2Account2')}</li>
              <li>{t('privacy.section2Account3')}</li>
            </ul>

            <h3 className="text-base font-semibold mb-2 text-gray-200">{t('privacy.section2UsageTitle')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 mb-4">
              <li>{t('privacy.section2Usage1')}</li>
              <li>{t('privacy.section2Usage2')}</li>
              <li>{t('privacy.section2Usage3')}</li>
            </ul>

            <h3 className="text-base font-semibold mb-2 text-gray-200">{t('privacy.section2TechTitle')}</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>{t('privacy.section2Tech1')}</li>
              <li>{t('privacy.section2Tech2')}</li>
              <li>{t('privacy.section2Tech3')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section3Title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-3">{t('privacy.section3Intro')}</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>{t('privacy.section3Item1')}</li>
              <li>{t('privacy.section3Item2')}</li>
              <li>{t('privacy.section3Item3')}</li>
              <li>{t('privacy.section3Item4')}</li>
              <li>{t('privacy.section3Item5')}</li>
              <li>{t('privacy.section3Item6')}</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('privacy.section3Outro')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section4Title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              {t.rich('privacy.section4Body1', {
                creatibro: (chunks) => (
                  <a href="https://creatibro.com" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
            <p className="text-gray-300 leading-relaxed mb-3">
              {t('privacy.section4Body2')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>{t('privacy.section4Item1')}</li>
              <li>{t('privacy.section4Item2')}</li>
              <li>
                {t.rich('privacy.section4Item3', {
                  mail: (chunks) => (
                    <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                  ),
                })}
              </li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('privacy.section4Body3')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section5Title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              {t('privacy.section5Intro')}
            </p>

            <div className="space-y-4">
              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">{t('privacy.section5SupabaseTitle')}</h3>
                <p className="text-gray-300 text-sm">{t('privacy.section5SupabaseBody')} <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">{t('privacy.seePolicy')}</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">{t('privacy.section5LemonTitle')}</h3>
                <p className="text-gray-300 text-sm">{t('privacy.section5LemonBody')} <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">{t('privacy.seePolicy')}</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">{t('privacy.section5GithubTitle')}</h3>
                <p className="text-gray-300 text-sm">{t('privacy.section5GithubBody')} <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">{t('privacy.seePolicy')}</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">{t('privacy.section5UmamiTitle')}</h3>
                <p className="text-gray-300 text-sm">{t('privacy.section5UmamiBody')} <a href="https://umami.is/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">{t('privacy.seePolicy')}</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">{t('privacy.section5ResendTitle')}</h3>
                <p className="text-gray-300 text-sm">{t('privacy.section5ResendBody')} <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">{t('privacy.seePolicy')}</a></p>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-1">{t('privacy.section5BeehiivTitle')}</h3>
                <p className="text-gray-300 text-sm">{t('privacy.section5BeehiivBody')} <a href="https://www.beehiiv.com/tou/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-4">{t('privacy.seePolicy')}</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section6Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('privacy.section6Body1')}
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t('privacy.section6Body2')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section7Title')}</h2>
            <p className="text-gray-300 leading-relaxed mb-3">{t('privacy.section7Intro')}</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>{t.rich('privacy.section7Item1', { b: (chunks) => <strong className="text-white">{chunks}</strong> })}</li>
              <li>{t.rich('privacy.section7Item2', { b: (chunks) => <strong className="text-white">{chunks}</strong> })}</li>
              <li>{t.rich('privacy.section7Item3', { b: (chunks) => <strong className="text-white">{chunks}</strong> })}</li>
              <li>{t.rich('privacy.section7Item4', { b: (chunks) => <strong className="text-white">{chunks}</strong> })}</li>
              <li>{t.rich('privacy.section7Item5', { b: (chunks) => <strong className="text-white">{chunks}</strong> })}</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              {t.rich('privacy.section7Outro', {
                mail: (chunks) => (
                  <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section8Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t.rich('privacy.section8Body', {
                mail: (chunks) => (
                  <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section9Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('privacy.section9Body')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section10Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t('privacy.section10Body')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">{t('privacy.section11Title')}</h2>
            <p className="text-gray-300 leading-relaxed">
              {t.rich('privacy.section11Body', {
                mail: (chunks) => (
                  <a href="mailto:hi@huevsite.studio" className="text-white underline underline-offset-4">{chunks}</a>
                ),
              })}
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-white transition-colors">{t('termsLink')}</Link>
          <Link href="/" className="hover:text-white transition-colors">huevsite.io</Link>
        </div>
      </div>
    </div>
  )
}
