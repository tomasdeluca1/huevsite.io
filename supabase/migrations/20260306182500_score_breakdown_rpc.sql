-- Migration: Add Score Breakdown function
-- Returns a detailed JSON object with the score breakdown for a specific user

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
  
  v_project_count INTEGER := 0;
  v_project_pts INTEGER := 0;
  v_building_count INTEGER := 0;
  v_building_pts INTEGER := 0;
  v_writing_count INTEGER := 0;
  v_writing_pts INTEGER := 0;
  v_has_github BOOLEAN;
  
  v_endorsements_received INTEGER;
  v_nominations_received INTEGER;
  v_followers_count INTEGER;
  v_endorsements_given INTEGER;
  v_nominations_given INTEGER;
  
  v_block RECORD;
BEGIN
  -- 1. Obtener datos del perfil
  SELECT name, tagline, image, github_handle, pro_since, updated_at 
  INTO v_profile 
  FROM public.profiles WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- A. Completitud base
  IF v_profile.image IS NOT NULL AND v_profile.image != '' THEN v_score_base := v_score_base + 33; END IF;
  IF v_profile.name IS NOT NULL AND v_profile.name != '' THEN v_score_base := v_score_base + 33; END IF;
  IF v_profile.tagline IS NOT NULL AND length(v_profile.tagline) > 10 THEN 
    v_score_base := v_score_base + 34; 
  ELSIF v_profile.tagline IS NOT NULL AND v_profile.tagline != '' THEN
    v_score_base := v_score_base + 10;
  END IF;

  -- B. Contenido
  FOR v_block IN SELECT type FROM public.blocks WHERE user_id = target_user_id AND visible = true LOOP
    IF v_block.type = 'project' THEN
      v_project_count := v_project_count + 1;
      IF v_project_count <= 3 THEN v_project_pts := v_project_pts + 75;
      ELSIF v_project_count <= 6 THEN v_project_pts := v_project_pts + 30;
      ELSE v_project_pts := v_project_pts + 5; END IF;
    ELSIF v_block.type = 'building' THEN
      v_building_count := v_building_count + 1;
      IF v_building_count <= 3 THEN v_building_pts := v_building_pts + 30;
      ELSE v_building_pts := v_building_pts + 10; END IF;
    ELSIF v_block.type = 'writing' THEN
      v_writing_count := v_writing_count + 1;
      IF v_writing_count <= 3 THEN v_writing_pts := v_writing_pts + 20;
      ELSE v_writing_pts := v_writing_pts + 5; END IF;
    END IF;
  END LOOP;
  v_score_content := v_project_pts + v_building_pts + v_writing_pts;

  SELECT EXISTS (SELECT 1 FROM public.blocks WHERE user_id = target_user_id AND visible = true AND type = 'github') INTO v_has_github;
  IF v_has_github OR (v_profile.github_handle IS NOT NULL AND v_profile.github_handle != '') THEN
    v_score_content := v_score_content + 150;
  END IF;

  -- C. Social Recibido
  SELECT count(*) INTO v_endorsements_received FROM public.endorsements WHERE to_id = target_user_id;
  SELECT count(*) INTO v_nominations_received FROM public.showcase_nominations WHERE user_id = target_user_id;
  SELECT count(*) INTO v_followers_count FROM public.follows WHERE following_id = target_user_id;

  v_score_social_received := (v_endorsements_received * 25) + (v_nominations_received * 15) + (v_followers_count * 10);

  -- D. Social Dado
  SELECT count(*) INTO v_endorsements_given FROM public.endorsements WHERE from_id = target_user_id;
  SELECT count(*) INTO v_nominations_given FROM public.showcase_nominations WHERE nominated_by = target_user_id;

  v_score_social_given := (LEAST(v_endorsements_given, 10) * 15) + (LEAST(v_nominations_given, 5) * 20);

  -- E. Bonus
  IF v_profile.updated_at > (NOW() - INTERVAL '30 days') THEN
    v_score_bonus := v_score_bonus + 50;
  END IF;
  IF v_profile.pro_since IS NOT NULL THEN
    v_score_bonus := v_score_bonus + 100;
  END IF;

  v_result := jsonb_build_object(
    'total', v_score_base + v_score_content + v_score_social_received + v_score_social_given + v_score_bonus,
    'breakdown', jsonb_build_object(
      'base', jsonb_build_object(
        'score', v_score_base,
        'details', jsonb_build_object(
          'has_image', v_profile.image IS NOT NULL AND v_profile.image != '',
          'has_name', v_profile.name IS NOT NULL AND v_profile.name != '',
          'tagline_length', length(COALESCE(v_profile.tagline, ''))
        )
      ),
      'content', jsonb_build_object(
        'score', v_score_content,
        'details', jsonb_build_object(
          'project_count', v_project_count,
          'building_count', v_building_count,
          'writing_count', v_writing_count,
          'has_github', v_has_github OR (v_profile.github_handle IS NOT NULL AND v_profile.github_handle != '')
        )
      ),
      'social_received', jsonb_build_object(
        'score', v_score_social_received,
        'details', jsonb_build_object(
          'endorsements', v_endorsements_received,
          'nominations', v_nominations_received,
          'followers', v_followers_count
        )
      ),
      'social_given', jsonb_build_object(
        'score', v_score_social_given,
        'details', jsonb_build_object(
          'endorsements_given', v_endorsements_given,
          'nominations_given', v_nominations_given
        )
      ),
      'bonus', jsonb_build_object(
        'score', v_score_bonus,
        'details', jsonb_build_object(
          'is_fresh', v_profile.updated_at > (NOW() - INTERVAL '30 days'),
          'is_pro', v_profile.pro_since IS NOT NULL
        )
      )
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
