-- Migration: recortar el Disk IO que consumen analytics_events / profile_visitors
--
-- CONTEXTO (medido el 2026-09-11 contra producción):
--   profiles              312 filas
--   blocks              1.104 filas
--   analytics_events  322.622 filas  <-- 319.834 son page_view
--   profile_visitors  319.838 filas
--
--   De los 319.834 page_view, 303.425 (94,9%) tienen
--   metadata->>'referrer' con '?embed=1'. En los últimos 30 días la
--   proporción es 114.087 de 115.853: 98,5%.
--
--   Son iframes de perfiles embebidos que sitios externos (nordelta.tech)
--   rotan cada pocos segundos. Cada rotación hacía un render dinámico
--   completo del perfil (~6 SELECT) y dos INSERT con mantenimiento de
--   índices + WAL. Eso agotó el Disk IO Budget del proyecto y además
--   infló los insights de todos los builders con visitas que nadie hizo.
--
--   El código ya no escribe estas filas (el tracker no se monta en modo
--   embed, la API descarta referrers con embed=1 y user-agents de bots, y
--   el cliente deduplica por sesión). Esta migración limpia lo que quedó
--   y deja los índices alineados con las queries que realmente corren.
--
-- ORDEN DE EJECUCIÓN: los pasos 1 → 5 van en el SQL Editor de Supabase de
-- una sola pasada. El paso 6 (VACUUM FULL) hay que correrlo aparte porque
-- no puede ejecutarse dentro de una transacción.

-- ---------------------------------------------------------------------------
-- 1. Índice auxiliar para correlacionar visitantes con eventos.
--    profile_visitors no guarda el referrer crudo (parseReferrer() lo
--    colapsa a 'huevsite.io'), así que la única forma de distinguir una
--    visita real de una de embed es cruzarla con el evento que la originó:
--    ambas filas se escriben en el mismo request, con milisegundos de
--    diferencia.
--
--    El índice es PARCIAL sobre las filas de embed: así el chequeo del
--    referrer queda garantizado por el predicado del índice y el DELETE no
--    tiene que ir al heap a mirar el JSONB fila por fila (serían ~300k
--    lecturas random sobre una base que justamente está sin IO). Construirlo
--    cuesta una sola pasada secuencial, y el paso 3 lo reusa.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS tmp_analytics_embed
  ON public.analytics_events (user_id, visitor_id, created_at)
  WHERE event_type = 'page_view'
    AND coalesce(metadata->>'referrer', '') LIKE '%embed=1%';

ANALYZE public.analytics_events;

-- ---------------------------------------------------------------------------
-- 2. Borrar los visitantes generados por embeds.
--    Match POSITIVO: sólo se borra la fila si existe un evento de embed que
--    le corresponda. Cualquier cosa ambigua se conserva.
--    IMPORTANTE: este paso va ANTES del 3, porque necesita que
--    analytics_events todavía tenga las filas de embed para cruzar.
-- ---------------------------------------------------------------------------
DELETE FROM public.profile_visitors pv
WHERE EXISTS (
  SELECT 1
  FROM public.analytics_events ae
  WHERE ae.event_type = 'page_view'
    AND coalesce(ae.metadata->>'referrer', '') LIKE '%embed=1%'
    AND ae.user_id    = pv.profile_id
    AND ae.visitor_id = pv.visitor_id
    AND ae.created_at >= pv.created_at - interval '5 seconds'
    AND ae.created_at <= pv.created_at + interval '5 seconds'
);

-- ---------------------------------------------------------------------------
-- 3. Borrar los eventos generados por embeds.
-- ---------------------------------------------------------------------------
DELETE FROM public.analytics_events
WHERE event_type = 'page_view'
  AND coalesce(metadata->>'referrer', '') LIKE '%embed=1%';

-- Los block_click que llegaron desde un embed son marginales (2.790 clicks
-- en total contra 319.834 page_view), pero se van por el mismo criterio.
DELETE FROM public.analytics_events
WHERE coalesce(metadata->>'referrer', '') LIKE '%embed=1%';

DROP INDEX IF EXISTS public.tmp_analytics_embed;

-- ---------------------------------------------------------------------------
-- 4. Retención: el UI de insights (DATE_FILTERS en InsightsTab.tsx) ofrece
--    como máximo 3M, así que nada más viejo que 90 días es visible desde el
--    producto. El barrido semanal en /api/cron/weekly-digest mantiene esta
--    ventana de acá en adelante; esto es el corte inicial.
-- ---------------------------------------------------------------------------
DELETE FROM public.analytics_events  WHERE created_at < now() - interval '90 days';
DELETE FROM public.profile_visitors  WHERE created_at < now() - interval '90 days';

-- ---------------------------------------------------------------------------
-- 5. Índices alineados con las queries reales de lib/analytics-service.ts.
--
--    analytics-service filtra SIEMPRE por (user_id, event_type, created_at).
--    Los índices de 2026-03-15 eran de una sola columna, así que Postgres
--    tenía que leer del heap todas las filas del usuario y filtrar después.
--
--    Los índices que se dropean:
--      idx_analytics_user_id            -> prefijo del compuesto nuevo
--      idx_profile_visitors_profile_id  -> prefijo del compuesto nuevo
--      idx_profile_visitors_visitor_user_id -> ninguna query filtra por esa
--         columna (sólo se lee para hidratar avatares contra profiles), y
--         cada INSERT pagaba su mantenimiento
--
--    Los *_created_at se conservan: son los que usa el barrido de retención.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_analytics_user_type_created
  ON public.analytics_events (user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_visitors_profile_created
  ON public.profile_visitors (profile_id, created_at DESC);

DROP INDEX IF EXISTS public.idx_analytics_user_id;
DROP INDEX IF EXISTS public.idx_profile_visitors_profile_id;
DROP INDEX IF EXISTS public.idx_profile_visitors_visitor_user_id;

ANALYZE public.analytics_events;
ANALYZE public.profile_visitors;

-- ---------------------------------------------------------------------------
-- 6. CORRER APARTE, en una query separada del SQL Editor.
--    Los DELETE de arriba dejan ~300k tuplas muertas: el espacio no vuelve
--    al disco ni mejora el cache hit ratio hasta que se reescribe la tabla.
--    Toma un lock exclusivo de unos segundos sobre tablas que, a esta
--    altura, sólo se escriben desde el tracker.
--
--      VACUUM FULL ANALYZE public.analytics_events;
--      VACUUM FULL ANALYZE public.profile_visitors;
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 7. Verificación. Antes de correr esto los números eran:
--      analytics_events 322.622 · profile_visitors 319.838
--    Después de los pasos 1-4 deberían quedar en el orden de unos pocos
--    miles: las visitas que hicieron personas de verdad.
-- ---------------------------------------------------------------------------
-- SELECT 'analytics_events' AS tabla, count(*) FROM public.analytics_events
-- UNION ALL
-- SELECT 'profile_visitors', count(*) FROM public.profile_visitors;
