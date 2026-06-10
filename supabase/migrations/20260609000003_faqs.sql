-- Admin-managed landing FAQ. Renders a visible accordion near the pricing AND
-- feeds the FAQPage JSON-LD (one source of truth). Mirrors the testimonials
-- pattern: public reads published rows; all writes go through service-role admin
-- API routes (no insert/update grant to clients).

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_faqs_published on public.faqs (sort_order, created_at) where published = true;

alter table public.faqs enable row level security;

drop policy if exists "faqs_select_public" on public.faqs;
create policy "faqs_select_public" on public.faqs
  for select using (published = true);

grant select on public.faqs to anon, authenticated;

-- Seed the current landing FAQ (objection-handling, updated pricing).
insert into public.faqs (question, answer, sort_order) values
  ('¿huevsite es gratis?',
   'Sí. El plan gratuito te deja armar tu perfil con varios bloques, sin tarjeta. Pasás a Pro ($9/mes) cuando querés dominio propio, más visibilidad y que te descubran — o al plan Founder, pago único de por vida.', 10),
  ('¿Cuánto tardo en armarlo?',
   'Unos 3 minutos. El sistema arma tu perfil solo desde tu GitHub o tu Linktree; vos solo lo afinás. Sin lienzo en blanco.', 20),
  ('¿Para quién es huevsite?',
   'Builders de LATAM: devs indie, founders, diseñadores y creadores tech que quieren mostrar lo que buildean y conectar con otros builders de la región.', 30),
  ('¿Puedo conectar mi propio dominio?',
   'Sí. Con Pro conectás tu dominio.com en segundos y tu portfolio vive en una URL 100% tuya.', 40),
  ('¿Qué pasa si bajo de Pro a free?',
   'No perdés nada: tus bloques quedan guardados. Como free se muestran los primeros (5, más los que hayas desbloqueado compartiendo). Si volvés a Pro, se ven todos de nuevo.', 50),
  ('¿Cómo se conecta GitHub?',
   'Por OAuth oficial. huevsite importa tus stats reales —lenguajes, heatmap de commits y repos destacados— y se actualizan solos.', 60)
on conflict do nothing;
