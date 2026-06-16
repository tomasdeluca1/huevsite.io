-- Board presets (Pro): hasta 3 boards por perfil principal.
-- Cada board es un set propio de bloques del perfil principal (sub_site_id IS NULL),
-- distinguido por board_index (0,1,2). profiles.published_board dice cuál es el público.
-- El diseño del perfil (color, redondeo, foto, tagline) es compartido entre boards.
--
-- Retrocompatible: los bloques existentes quedan en board_index 0 (DEFAULT 0) y
-- published_board arranca en 0, así nada cambia hasta que el usuario use la feature.

ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS board_index SMALLINT NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.blocks ADD CONSTRAINT blocks_board_index_range CHECK (board_index BETWEEN 0 AND 2);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS published_board SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS board_names JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_published_board_range CHECK (published_board BETWEEN 0 AND 2);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Índice para la query pública del board principal.
CREATE INDEX IF NOT EXISTS blocks_main_board_idx
  ON public.blocks (user_id, board_index) WHERE sub_site_id IS NULL;

-- ── Score RPC: contar solo el board PUBLICADO del perfil principal ────────────
-- Antes, los loops contaban TODOS los bloques del usuario (sin filtrar sub_site_id
-- ni board). Con boards, eso dejaría que armar 3 boards infle el score. Scope:
-- bloques de sub-site siguen contando igual; los del perfil principal solo si
-- board_index = published_board. Re-CREATE OR REPLACE de ambas funciones
-- (base: 20260615000000_testimonial_score) + recompute global.

CREATE OR REPLACE FUNCTION public.recompute_builder_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_profile RECORD;
  v_project_count INTEGER := 0;
  v_building_count INTEGER := 0;
  v_writing_count INTEGER := 0;
  v_has_github BOOLEAN := false;
  v_endorsements_received INTEGER;
  v_nominations_received INTEGER;
  v_followers_count INTEGER;
  v_block RECORD;
  v_sub_sites_count INTEGER := 0;
  v_unique_visitors INTEGER := 0;
  v_has_project BOOLEAN := false;
  v_has_building BOOLEAN := false;
  v_has_writing BOOLEAN := false;
  v_endorsements_given INTEGER;
  v_nominations_given INTEGER;
  v_block_limit INTEGER;
  v_has_testimonial BOOLEAN := false;
  v_published_board SMALLINT := 0;
BEGIN
  SELECT name, tagline, image, github_handle, pro_since, updated_at, custom_domain,
         subscription_tier, extra_blocks_from_share, referral_reward_expires_at, free_trial_ends_at,
         published_board
  INTO v_profile
  FROM public.profiles WHERE id = target_user_id;

  IF NOT FOUND THEN RETURN 0; END IF;
  v_published_board := COALESCE(v_profile.published_board, 0);

  IF (v_profile.subscription_tier = 'pro'
      OR v_profile.pro_since IS NOT NULL
      OR (v_profile.referral_reward_expires_at IS NOT NULL AND v_profile.referral_reward_expires_at > NOW())
      OR (v_profile.free_trial_ends_at IS NOT NULL AND v_profile.free_trial_ends_at > NOW())) THEN
    v_block_limit := 1000000;
  ELSE
    v_block_limit := 5 + COALESCE(v_profile.extra_blocks_from_share, 0);
  END IF;

  IF v_profile.image IS NOT NULL AND v_profile.image != '' THEN v_score := v_score + 33; END IF;
  IF v_profile.name  IS NOT NULL AND v_profile.name  != '' THEN v_score := v_score + 33; END IF;
  IF v_profile.tagline IS NOT NULL AND length(v_profile.tagline) > 10 THEN
    v_score := v_score + 34;
  ELSIF v_profile.tagline IS NOT NULL AND v_profile.tagline != '' THEN
    v_score := v_score + 10;
  END IF;

  FOR v_block IN
    SELECT type FROM public.blocks
    WHERE user_id = target_user_id AND visible = true
      AND (sub_site_id IS NOT NULL OR board_index = v_published_board)
    ORDER BY "order" ASC NULLS LAST, id ASC
    LIMIT v_block_limit
  LOOP
    IF v_block.type = 'project' THEN
      v_project_count := v_project_count + 1;
      v_has_project := true;
      IF v_project_count <= 3 THEN v_score := v_score + 75;
      ELSIF v_project_count <= 6 THEN v_score := v_score + 30;
      ELSE v_score := v_score + 5; END IF;
    ELSIF v_block.type = 'building' THEN
      v_building_count := v_building_count + 1;
      v_has_building := true;
      IF v_building_count <= 3 THEN v_score := v_score + 30;
      ELSE v_score := v_score + 10; END IF;
    ELSIF v_block.type = 'writing' THEN
      v_writing_count := v_writing_count + 1;
      v_has_writing := true;
      IF v_writing_count <= 3 THEN v_score := v_score + 20;
      ELSE v_score := v_score + 5; END IF;
    END IF;
  END LOOP;

  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT type, data FROM public.blocks
      WHERE user_id = target_user_id AND visible = true
        AND (sub_site_id IS NOT NULL OR board_index = v_published_board)
      ORDER BY "order" ASC NULLS LAST, id ASC
      LIMIT v_block_limit
    ) capped
    WHERE capped.type = 'github'
      AND COALESCE(capped.data->>'username', '') != ''
      AND jsonb_typeof(capped.data->'stats') = 'object'
      AND (capped.data->'stats' ? 'stars')
      AND (capped.data->'stats' ? 'repos')
      AND (capped.data->'stats' ? 'followers')
      AND (
        COALESCE(jsonb_array_length(COALESCE(capped.data->'stats'->'topLanguages', '[]'::jsonb)), 0) > 0
        OR (capped.data->'stats' ? 'issuesClosed')
        OR (capped.data->'stats' ? 'totalCommits')
        OR COALESCE(jsonb_array_length(COALESCE(capped.data->'stats'->'heatmap', '[]'::jsonb)), 0) > 0
      )
  ) INTO v_has_github;

  IF v_has_github THEN
    v_score := v_score + 150;
  END IF;

  IF v_has_project AND v_has_building AND v_has_writing THEN v_score := v_score + 100; END IF;

  SELECT count(*) INTO v_endorsements_received FROM public.endorsements WHERE to_id = target_user_id;
  SELECT count(*) INTO v_nominations_received  FROM public.showcase_nominations WHERE user_id = target_user_id;
  SELECT count(*) INTO v_followers_count       FROM public.follows WHERE following_id = target_user_id;
  v_score := v_score + (v_endorsements_received * 25) + (v_nominations_received * 15) + (v_followers_count * 10);

  SELECT count(*) INTO v_endorsements_given FROM public.endorsements WHERE from_id = target_user_id;
  SELECT count(*) INTO v_nominations_given  FROM public.showcase_nominations WHERE nominated_by = target_user_id;
  v_score := v_score + (LEAST(v_endorsements_given, 15) * 15) + (LEAST(v_nominations_given, 5) * 20);

  SELECT EXISTS (
    SELECT 1 FROM public.testimonials
    WHERE user_id = target_user_id AND status <> 'rejected'
  ) INTO v_has_testimonial;
  IF v_has_testimonial THEN v_score := v_score + 50; END IF;

  IF v_profile.updated_at > (NOW() - INTERVAL '30 days') THEN v_score := v_score + 50; END IF;
  IF v_profile.pro_since IS NOT NULL THEN v_score := v_score + 100; END IF;

  SELECT count(*) INTO v_sub_sites_count FROM public.sub_sites WHERE user_id = target_user_id;
  IF v_sub_sites_count >= 1 THEN
    v_score := v_score + 80 + (LEAST(v_sub_sites_count - 1, 4) * 40);
  END IF;

  IF v_profile.custom_domain IS NOT NULL AND v_profile.custom_domain != '' THEN v_score := v_score + 150; END IF;

  SELECT count(DISTINCT visitor_id) INTO v_unique_visitors FROM public.analytics_events WHERE user_id = target_user_id AND event_type = 'page_view' AND created_at > (NOW() - INTERVAL '30 days');
  v_score := v_score + LEAST((v_unique_visitors / 10) * 10, 200);

  UPDATE public.profiles SET builder_score = v_score WHERE id = target_user_id;
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_builder_score_breakdown(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_profile RECORD;
  v_score_base INTEGER := 0;
  v_score_content INTEGER := 0;
  v_score_social_received INTEGER := 0;
  v_score_social_given INTEGER := 0;
  v_score_bonus INTEGER := 0;
  v_score_pro_gaming INTEGER := 0;
  v_score_visibility INTEGER := 0;
  v_score_testimonial INTEGER := 0;
  v_project_count INTEGER := 0; v_project_pts INTEGER := 0;
  v_building_count INTEGER := 0; v_building_pts INTEGER := 0;
  v_writing_count INTEGER := 0; v_writing_pts INTEGER := 0;
  v_has_github BOOLEAN := false; v_has_project BOOLEAN := false; v_has_building BOOLEAN := false; v_has_writing BOOLEAN := false;
  v_endorsements_received INTEGER; v_nominations_received INTEGER; v_followers_count INTEGER;
  v_endorsements_given INTEGER; v_nominations_given INTEGER;
  v_sub_sites_count INTEGER := 0; v_unique_visitors INTEGER := 0;
  v_has_testimonial BOOLEAN := false;
  v_block RECORD;
  v_block_limit INTEGER;
  v_published_board SMALLINT := 0;
BEGIN
  SELECT name, tagline, image, github_handle, pro_since, updated_at, custom_domain,
         subscription_tier, extra_blocks_from_share, referral_reward_expires_at, free_trial_ends_at,
         published_board
  INTO v_profile FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Profile not found'); END IF;
  v_published_board := COALESCE(v_profile.published_board, 0);

  IF (v_profile.subscription_tier = 'pro'
      OR v_profile.pro_since IS NOT NULL
      OR (v_profile.referral_reward_expires_at IS NOT NULL AND v_profile.referral_reward_expires_at > NOW())
      OR (v_profile.free_trial_ends_at IS NOT NULL AND v_profile.free_trial_ends_at > NOW())) THEN
    v_block_limit := 1000000;
  ELSE
    v_block_limit := 5 + COALESCE(v_profile.extra_blocks_from_share, 0);
  END IF;

  IF v_profile.image IS NOT NULL AND v_profile.image != '' THEN v_score_base := v_score_base + 33; END IF;
  IF v_profile.name  IS NOT NULL AND v_profile.name  != '' THEN v_score_base := v_score_base + 33; END IF;
  IF v_profile.tagline IS NOT NULL AND length(v_profile.tagline) > 10 THEN v_score_base := v_score_base + 34;
  ELSIF v_profile.tagline IS NOT NULL AND v_profile.tagline != '' THEN v_score_base := v_score_base + 10; END IF;

  FOR v_block IN
    SELECT type FROM public.blocks
    WHERE user_id = target_user_id AND visible = true
      AND (sub_site_id IS NOT NULL OR board_index = v_published_board)
    ORDER BY "order" ASC NULLS LAST, id ASC
    LIMIT v_block_limit
  LOOP
    IF v_block.type = 'project' THEN
      v_project_count := v_project_count + 1; v_has_project := true;
      IF v_project_count <= 3 THEN v_project_pts := v_project_pts + 75; ELSIF v_project_count <= 6 THEN v_project_pts := v_project_pts + 30; ELSE v_project_pts := v_project_pts + 5; END IF;
    ELSIF v_block.type = 'building' THEN
      v_building_count := v_building_count + 1; v_has_building := true;
      IF v_building_count <= 3 THEN v_building_pts := v_building_pts + 30; ELSE v_building_pts := v_building_pts + 10; END IF;
    ELSIF v_block.type = 'writing' THEN
      v_writing_count := v_writing_count + 1; v_has_writing := true;
      IF v_writing_count <= 3 THEN v_writing_pts := v_writing_pts + 20; ELSE v_writing_pts := v_writing_pts + 5; END IF;
    END IF;
  END LOOP;

  v_score_content := v_project_pts + v_building_pts + v_writing_pts;

  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT type, data FROM public.blocks
      WHERE user_id = target_user_id AND visible = true
        AND (sub_site_id IS NOT NULL OR board_index = v_published_board)
      ORDER BY "order" ASC NULLS LAST, id ASC
      LIMIT v_block_limit
    ) capped
    WHERE capped.type = 'github'
      AND COALESCE(capped.data->>'username', '') != ''
      AND jsonb_typeof(capped.data->'stats') = 'object'
      AND (capped.data->'stats' ? 'stars')
      AND (capped.data->'stats' ? 'repos')
      AND (capped.data->'stats' ? 'followers')
      AND (
        COALESCE(jsonb_array_length(COALESCE(capped.data->'stats'->'topLanguages', '[]'::jsonb)), 0) > 0
        OR (capped.data->'stats' ? 'issuesClosed')
        OR (capped.data->'stats' ? 'totalCommits')
        OR COALESCE(jsonb_array_length(COALESCE(capped.data->'stats'->'heatmap', '[]'::jsonb)), 0) > 0
      )
  ) INTO v_has_github;

  IF v_has_github THEN v_score_content := v_score_content + 150; END IF;
  IF v_has_project AND v_has_building AND v_has_writing THEN v_score_content := v_score_content + 100; END IF;

  SELECT count(*) INTO v_endorsements_received FROM public.endorsements WHERE to_id = target_user_id;
  SELECT count(*) INTO v_nominations_received FROM public.showcase_nominations WHERE user_id = target_user_id;
  SELECT count(*) INTO v_followers_count FROM public.follows WHERE following_id = target_user_id;
  v_score_social_received := (v_endorsements_received * 25) + (v_nominations_received * 15) + (v_followers_count * 10);
  SELECT count(*) INTO v_endorsements_given FROM public.endorsements WHERE from_id = target_user_id;
  SELECT count(*) INTO v_nominations_given FROM public.showcase_nominations WHERE nominated_by = target_user_id;
  v_score_social_given := (LEAST(v_endorsements_given, 15) * 15) + (LEAST(v_nominations_given, 5) * 20);

  SELECT EXISTS (
    SELECT 1 FROM public.testimonials
    WHERE user_id = target_user_id AND status <> 'rejected'
  ) INTO v_has_testimonial;
  IF v_has_testimonial THEN v_score_testimonial := 50; END IF;

  IF v_profile.updated_at > (NOW() - INTERVAL '30 days') THEN v_score_bonus := v_score_bonus + 50; END IF;
  IF v_profile.pro_since IS NOT NULL THEN v_score_bonus := v_score_bonus + 100; END IF;

  SELECT count(*) INTO v_sub_sites_count FROM public.sub_sites WHERE user_id = target_user_id;
  IF v_sub_sites_count >= 1 THEN v_score_pro_gaming := v_score_pro_gaming + 80 + (LEAST(v_sub_sites_count - 1, 4) * 40); END IF;
  IF v_profile.custom_domain IS NOT NULL AND v_profile.custom_domain != '' THEN v_score_pro_gaming := v_score_pro_gaming + 150; END IF;

  SELECT count(DISTINCT visitor_id) INTO v_unique_visitors FROM public.analytics_events WHERE user_id = target_user_id AND event_type = 'page_view' AND created_at > (NOW() - INTERVAL '30 days');
  v_score_visibility := LEAST((v_unique_visitors / 10) * 10, 200);

  v_result := jsonb_build_object(
    'total', v_score_base + v_score_content + v_score_social_received + v_score_social_given + v_score_bonus + v_score_pro_gaming + v_score_visibility + v_score_testimonial,
    'breakdown', jsonb_build_object(
      'base', jsonb_build_object('score', v_score_base, 'details', jsonb_build_object('has_image', v_profile.image IS NOT NULL AND v_profile.image != '', 'has_name', v_profile.name IS NOT NULL AND v_profile.name != '', 'tagline_length', length(COALESCE(v_profile.tagline, '')))),
      'content', jsonb_build_object('score', v_score_content, 'details', jsonb_build_object('project_count', v_project_count, 'building_count', v_building_count, 'writing_count', v_writing_count, 'has_github', v_has_github, 'content_diversity_bonus', v_has_project AND v_has_building AND v_has_writing)),
      'social_received', jsonb_build_object('score', v_score_social_received, 'details', jsonb_build_object('endorsements', v_endorsements_received, 'nominations', v_nominations_received, 'followers', v_followers_count)),
      'social_given', jsonb_build_object('score', v_score_social_given, 'details', jsonb_build_object('endorsements_given', v_endorsements_given, 'nominations_given', v_nominations_given)),
      'testimonial', jsonb_build_object('score', v_score_testimonial, 'details', jsonb_build_object('has_testimonial', v_has_testimonial)),
      'bonus', jsonb_build_object('score', v_score_bonus, 'details', jsonb_build_object('is_fresh', v_profile.updated_at > (NOW() - INTERVAL '30 days'), 'is_pro', v_profile.pro_since IS NOT NULL)),
      'pro_gaming', jsonb_build_object('score', v_score_pro_gaming, 'details', jsonb_build_object('sub_sites_count', v_sub_sites_count, 'has_custom_domain', (v_profile.custom_domain IS NOT NULL AND v_profile.custom_domain != ''))),
      'visibility', jsonb_build_object('score', v_score_visibility, 'details', jsonb_build_object('unique_visitors_30d', v_unique_visitors))
    )
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT public.recompute_all_builder_scores();
