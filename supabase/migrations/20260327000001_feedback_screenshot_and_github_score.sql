ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

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
  v_endorsements_given INTEGER;
  v_nominations_received INTEGER;
  v_nominations_given INTEGER;
  v_followers_count INTEGER;
  v_block RECORD;
  v_sub_sites_count INTEGER := 0;
  v_unique_visitors INTEGER := 0;
  v_has_project BOOLEAN := false;
  v_has_building BOOLEAN := false;
  v_has_writing BOOLEAN := false;
BEGIN
  SELECT name, tagline, image, github_handle, pro_since, updated_at, custom_domain
  INTO v_profile
  FROM public.profiles WHERE id = target_user_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_profile.image IS NOT NULL AND v_profile.image != '' THEN v_score := v_score + 33; END IF;
  IF v_profile.name  IS NOT NULL AND v_profile.name  != '' THEN v_score := v_score + 33; END IF;
  IF v_profile.tagline IS NOT NULL AND length(v_profile.tagline) > 10 THEN
    v_score := v_score + 34;
  ELSIF v_profile.tagline IS NOT NULL AND v_profile.tagline != '' THEN
    v_score := v_score + 10;
  END IF;

  FOR v_block IN SELECT type FROM public.blocks WHERE user_id = target_user_id AND visible = true LOOP
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
    FROM public.blocks
    WHERE user_id = target_user_id
      AND visible = true
      AND type = 'github'
      AND COALESCE(data->>'username', '') != ''
      AND jsonb_typeof(data->'stats') = 'object'
      AND (data->'stats' ? 'stars')
      AND (data->'stats' ? 'repos')
      AND (data->'stats' ? 'followers')
      AND (
        COALESCE(jsonb_array_length(COALESCE(data->'stats'->'topLanguages', '[]'::jsonb)), 0) > 0
        OR (data->'stats' ? 'issuesClosed')
        OR (data->'stats' ? 'totalCommits')
        OR COALESCE(jsonb_array_length(COALESCE(data->'stats'->'heatmap', '[]'::jsonb)), 0) > 0
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
  v_project_count INTEGER := 0; v_project_pts INTEGER := 0;
  v_building_count INTEGER := 0; v_building_pts INTEGER := 0;
  v_writing_count INTEGER := 0; v_writing_pts INTEGER := 0;
  v_has_github BOOLEAN := false; v_has_project BOOLEAN := false; v_has_building BOOLEAN := false; v_has_writing BOOLEAN := false;
  v_endorsements_received INTEGER; v_nominations_received INTEGER; v_followers_count INTEGER;
  v_endorsements_given INTEGER; v_nominations_given INTEGER;
  v_sub_sites_count INTEGER := 0; v_unique_visitors INTEGER := 0;
  v_block RECORD;
BEGIN
  SELECT name, tagline, image, github_handle, pro_since, updated_at, custom_domain INTO v_profile FROM public.profiles WHERE id = target_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Profile not found'); END IF;

  IF v_profile.image IS NOT NULL AND v_profile.image != '' THEN v_score_base := v_score_base + 33; END IF;
  IF v_profile.name  IS NOT NULL AND v_profile.name  != '' THEN v_score_base := v_score_base + 33; END IF;
  IF v_profile.tagline IS NOT NULL AND length(v_profile.tagline) > 10 THEN v_score_base := v_score_base + 34;
  ELSIF v_profile.tagline IS NOT NULL AND v_profile.tagline != '' THEN v_score_base := v_score_base + 10; END IF;

  FOR v_block IN SELECT type FROM public.blocks WHERE user_id = target_user_id AND visible = true LOOP
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
    FROM public.blocks
    WHERE user_id = target_user_id
      AND visible = true
      AND type = 'github'
      AND COALESCE(data->>'username', '') != ''
      AND jsonb_typeof(data->'stats') = 'object'
      AND (data->'stats' ? 'stars')
      AND (data->'stats' ? 'repos')
      AND (data->'stats' ? 'followers')
      AND (
        COALESCE(jsonb_array_length(COALESCE(data->'stats'->'topLanguages', '[]'::jsonb)), 0) > 0
        OR (data->'stats' ? 'issuesClosed')
        OR (data->'stats' ? 'totalCommits')
        OR COALESCE(jsonb_array_length(COALESCE(data->'stats'->'heatmap', '[]'::jsonb)), 0) > 0
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

  IF v_profile.updated_at > (NOW() - INTERVAL '30 days') THEN v_score_bonus := v_score_bonus + 50; END IF;
  IF v_profile.pro_since IS NOT NULL THEN v_score_bonus := v_score_bonus + 100; END IF;

  SELECT count(*) INTO v_sub_sites_count FROM public.sub_sites WHERE user_id = target_user_id;
  IF v_sub_sites_count >= 1 THEN v_score_pro_gaming := v_score_pro_gaming + 80 + (LEAST(v_sub_sites_count - 1, 4) * 40); END IF;
  IF v_profile.custom_domain IS NOT NULL AND v_profile.custom_domain != '' THEN v_score_pro_gaming := v_score_pro_gaming + 150; END IF;

  SELECT count(DISTINCT visitor_id) INTO v_unique_visitors FROM public.analytics_events WHERE user_id = target_user_id AND event_type = 'page_view' AND created_at > (NOW() - INTERVAL '30 days');
  v_score_visibility := LEAST((v_unique_visitors / 10) * 10, 200);

  v_result := jsonb_build_object(
    'total', v_score_base + v_score_content + v_score_social_received + v_score_social_given + v_score_bonus + v_score_pro_gaming + v_score_visibility,
    'breakdown', jsonb_build_object(
      'base', jsonb_build_object('score', v_score_base, 'details', jsonb_build_object('has_image', v_profile.image IS NOT NULL AND v_profile.image != '', 'has_name', v_profile.name IS NOT NULL AND v_profile.name != '', 'tagline_length', length(COALESCE(v_profile.tagline, '')))),
      'content', jsonb_build_object('score', v_score_content, 'details', jsonb_build_object('project_count', v_project_count, 'building_count', v_building_count, 'writing_count', v_writing_count, 'has_github', v_has_github, 'content_diversity_bonus', v_has_project AND v_has_building AND v_has_writing)),
      'social_received', jsonb_build_object('score', v_score_social_received, 'details', jsonb_build_object('endorsements', v_endorsements_received, 'nominations', v_nominations_received, 'followers', v_followers_count)),
      'social_given', jsonb_build_object('score', v_score_social_given, 'details', jsonb_build_object('endorsements_given', v_endorsements_given, 'nominations_given', v_nominations_given)),
      'bonus', jsonb_build_object('score', v_score_bonus, 'details', jsonb_build_object('is_fresh', v_profile.updated_at > (NOW() - INTERVAL '30 days'), 'is_pro', v_profile.pro_since IS NOT NULL)),
      'pro_gaming', jsonb_build_object('score', v_score_pro_gaming, 'details', jsonb_build_object('sub_sites_count', v_sub_sites_count, 'has_custom_domain', (v_profile.custom_domain IS NOT NULL AND v_profile.custom_domain != ''))),
      'visibility', jsonb_build_object('score', v_score_visibility, 'details', jsonb_build_object('unique_visitors_30d', v_unique_visitors))
    )
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recompute all builder scores with the new logic
SELECT public.recompute_all_builder_scores();
