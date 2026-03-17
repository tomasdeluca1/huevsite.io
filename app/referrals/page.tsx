import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Gift,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Programa de Referidos | huevsite.io",
  description:
    "Invitá builders a huevsite.io. Cuando 3 referidos activen PRO, desbloqueás 3 meses de huevsite PRO gratis.",
};

const dashboardReferralsHref = "/dashboard?scrollTo=referrals";

const steps = [
  {
    number: "01",
    title: "Copiás tu link",
    description:
      "Desde tu dashboard obtenés un link único para compartir por WhatsApp, X, Discord o donde muevas tu comunidad.",
    icon: Copy,
  },
  {
    number: "02",
    title: "Invitás builders reales",
    description:
      "Tus referidos entran a huevsite desde ese link y crean su perfil con tu código asociado automáticamente.",
    icon: Users,
  },
  {
    number: "03",
    title: "Cuando 3 pasan a PRO, ganás",
    description:
      "Al llegar a 3 referidos PRO, se activa tu recompensa: 3 meses de huevsite PRO gratis.",
    icon: Gift,
  },
];

const faqs = [
  {
    question: "¿Qué cuenta como referido válido?",
    answer:
      "Un builder que llega con tu link, crea su perfil y luego activa PRO. El progreso se refleja en tu dashboard.",
  },
  {
    question: "¿Dónde encuentro mi link?",
    answer:
      "En tu dashboard, dentro del módulo de Programa de Referidos. Ahí también ves cuántos referidos PRO acumulaste.",
  },
  {
    question: "¿La recompensa se acredita sola?",
    answer:
      "Sí. Cuando alcanzás el objetivo, la activación del beneficio corre de forma automática en la plataforma.",
  },
];

export default function ReferralsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,255,0,0.16),transparent_62%)] blur-3xl" />
        <div className="absolute right-[-12rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_60%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(8,8,8,0.72)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="logo">
            huev<span style={{ color: "var(--accent)" }}>site</span>.io
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/blog" className="btn btn-ghost">
              Blog
            </Link>
            <Link href={dashboardReferralsHref} className="btn btn-accent">
              Ver mi link
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pb-12 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            Builder growth, sin humo
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white md:text-7xl">
            Invitá builders.
            <br />
            <span className="text-[var(--accent)]">Desbloqueá PRO.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-dim)] md:text-xl">
            El programa de referidos de huevsite.io te premia por traer gente que
            realmente suma a la comunidad. Si 3 de tus referidos activan PRO, te
            llevás 3 meses de PRO gratis.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={dashboardReferralsHref} className="btn btn-accent !px-7 !py-4 text-base">
              Conseguir mi link
            </Link>
            <Link href="/onboarding" className="btn btn-ghost !px-7 !py-4 text-base">
              Crear cuenta
            </Link>
          </div>

          <div className="mt-10 grid max-w-3xl gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Meta
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                3 referidos PRO
              </div>
            </div>
            <div className="rounded-[24px] border border-[rgba(200,255,0,0.22)] bg-[linear-gradient(180deg,rgba(200,255,0,0.14),rgba(200,255,0,0.07))] p-5 shadow-[0_18px_60px_rgba(200,255,0,0.08)]">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.72)]">
                Recompensa
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                3 meses PRO
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Tracking
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                En tu dashboard
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article
              key={number}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6"
            >
              <div className="absolute right-0 top-0 h-28 w-28 translate-x-1/3 -translate-y-1/3 rounded-full bg-[rgba(200,255,0,0.08)] blur-2xl transition duration-500 group-hover:bg-[rgba(200,255,0,0.14)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {number}
                  </span>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <Icon className="h-5 w-5 text-[var(--accent)]" />
                  </div>
                </div>
                <h2 className="mt-8 text-2xl font-black tracking-[-0.04em] text-white">
                  {title}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--text-dim)]">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7 lg:p-10">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Qué comunicar
            </div>
            <h2 className="mt-4 max-w-xl text-3xl font-black tracking-[-0.05em] text-white md:text-4xl">
              No se trata de spamear links.
              <br />
              Se trata de traer builders que encajen.
            </h2>
            <div className="mt-8 space-y-4 text-[15px] leading-8 text-[var(--text-dim)]">
              <p>
                Este programa funciona mejor cuando compartís tu huevsite con gente
                que ya está construyendo cosas, lanzando side projects o buscando una
                mejor forma de mostrarse online.
              </p>
              <p>
                Mandales tu link con contexto: por qué usás huevsite, qué te resolvió
                y qué pueden publicar ahí. Esa invitación convierte mucho mejor que un
                simple “sumate”.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="mb-3 flex items-center gap-3 text-white">
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
                  <span className="font-bold">Canales que sirven</span>
                </div>
                <p className="text-sm leading-7 text-[var(--text-dim)]">
                  WhatsApp, grupos de founders, communities de Discord, X, Slack de
                  producto y DMs a gente que ya está buildiendo.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="mb-3 flex items-center gap-3 text-white">
                  <ArrowRight className="h-5 w-5 text-[var(--accent)]" />
                  <span className="font-bold">Qué pasa después</span>
                </div>
                <p className="text-sm leading-7 text-[var(--text-dim)]">
                  Podés seguir el progreso desde tu panel sin perseguir a nadie
                  manualmente. El contador vive dentro del dashboard.
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-[rgba(200,255,0,0.2)] bg-[linear-gradient(180deg,rgba(200,255,0,0.16),rgba(200,255,0,0.06))] p-7 text-white lg:p-10">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[rgba(255,255,255,0.72)]">
              Resumen rápido
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-[rgba(255,255,255,0.72)]">Tu acción</div>
                <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  Compartir tu link personal
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-[rgba(255,255,255,0.72)]">Objetivo</div>
                <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  3 referidos que activen PRO
                </div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-[rgba(255,255,255,0.72)]">Premio</div>
                <div className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
                  3 meses de huevsite PRO
                </div>
              </div>
            </div>

            <Link
              href={dashboardReferralsHref}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-bold text-white transition hover:translate-y-[-1px]"
            >
              Ir al dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-16">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-7 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                FAQ
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white">
                Lo importante, sin vueltas.
              </h2>
            </div>

            <div className="w-full max-w-2xl space-y-4">
              {faqs.map((item) => (
                <div
                  key={item.question}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <h3 className="text-lg font-bold tracking-[-0.03em] text-white">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-dim)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-8 lg:px-8">
        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-6 py-8 text-center lg:px-10 lg:py-12">
          <div className="mx-auto max-w-2xl">
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Activá el boca a boca builder
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white md:text-5xl">
              Si ya usás huevsite, ya tenés algo para compartir.
            </h2>
            <p className="mt-4 text-base leading-8 text-[var(--text-dim)] md:text-lg">
              Entrá a tu dashboard, copiá tu link de referido y empezá a traer gente
              que valga la pena tener cerca.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={dashboardReferralsHref} className="btn btn-accent !px-7 !py-4 text-base">
                Abrir dashboard
              </Link>
              <Link href="/login" className="btn btn-ghost !px-7 !py-4 text-base">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
