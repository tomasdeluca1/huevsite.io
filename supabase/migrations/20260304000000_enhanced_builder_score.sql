-- Migration: Enhanced Builder Score logic with quality checks, social reciprocity and freshness
-- Date: 2026-03-04

CREATE OR REPLACE FUNCTION public.recompute_builder_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_profile RECORD;
  v_blocks_count INTEGER;
  v_project_count INTEGER := 0;
  v_building_count INTEGER := 0;
  v_writing_count INTEGER := 0;
  v_has_github BOOLEAN;
  v_endorsements_received INTEGER;
  v_endorsements_given INTEGER;
  v_nominations_received INTEGER;
  v_nominations_given INTEGER;
  v_followers_count INTEGER;
  v_last_update TIMESTAMPTZ;
  v_block RECORD;
BEGIN
  -- 1. Obtener datos del perfil
  SELECT name, tagline, image, github_handle, pro_since, updated_at 
  INTO v_profile 
  FROM public.profiles WHERE id = target_user_id;
  
  -- Si el perfil no existe, retornar 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- A. Completitud base (Max 100)
  IF v_profile.image IS NOT NULL AND v_profile.image != '' THEN v_score := v_score + 33; END IF;
  IF v_profile.name IS NOT NULL AND v_profile.name != '' THEN v_score := v_score + 33; END IF;
  
  -- Validación de calidad para el tagline (min 10 chars)
  IF v_profile.tagline IS NOT NULL AND length(v_profile.tagline) > 10 THEN 
    v_score := v_score + 34; 
  ELSIF v_profile.tagline IS NOT NULL AND v_profile.tagline != '' THEN
    v_score := v_score + 10; -- Penalización por muy corto
  END IF;

  -- B. Estadísticas de Bloques (con Diminishing Returns)
  FOR v_block IN SELECT type, data FROM public.blocks WHERE user_id = target_user_id AND visible = true LOOP
    -- Solo contamos si el bloque tiene contenido real (al menos 5 chars en el data o título si existe)
    -- Simplificado: asumimos que si está visible es porque tiene algo, pero podríamos ser más estrictos
    
    IF v_block.type = 'project' THEN
      v_project_count := v_project_count + 1;
      IF v_project_count <= 3 THEN v_score := v_score + 75;
      ELSIF v_project_count <= 6 THEN v_score := v_score + 30;
      ELSE v_score := v_score + 5; END IF;
    
    ELSIF v_block.type = 'building' THEN
      v_building_count := v_building_count + 1;
      IF v_building_count <= 3 THEN v_score := v_score + 30;
      ELSE v_score := v_score + 10; END IF;

    ELSIF v_block.type = 'writing' THEN
      v_writing_count := v_writing_count + 1;
      IF v_writing_count <= 3 THEN v_score := v_score + 20;
      ELSE v_score := v_score + 5; END IF;
    END IF;
  END LOOP;

  -- Bonus GitHub (Conectado o bloque activo) - AUMENTADO A 150
  SELECT EXISTS (SELECT 1 FROM public.blocks WHERE user_id = target_user_id AND visible = true AND type = 'github') INTO v_has_github;
  IF v_has_github OR (v_profile.github_handle IS NOT NULL AND v_profile.github_handle != '') THEN
    v_score := v_score + 150;
  END IF;

  -- C. Validación Social (Recibida)
  SELECT count(*) INTO v_endorsements_received FROM public.endorsements WHERE to_id = target_user_id;
  SELECT count(*) INTO v_nominations_received FROM public.showcase_nominations WHERE user_id = target_user_id;
  SELECT count(*) INTO v_followers_count FROM public.follows WHERE following_id = target_user_id;

  v_score := v_score + (v_endorsements_received * 25);
  v_score := v_score + (v_nominations_received * 15);
  v_score := v_score + (v_followers_count * 10);

  -- D. Social Reciprocity (Dada) - NUEVO
  SELECT count(*) INTO v_endorsements_given FROM public.endorsements WHERE from_id = target_user_id;
  SELECT count(*) INTO v_nominations_given FROM public.showcase_nominations WHERE nominated_by = target_user_id;

  -- Tope de 10 para endorsements dados (150 pts max)
  v_score := v_score + (LEAST(v_endorsements_given, 10) * 15);
  -- Tope de 5 para nominaciones dadas (100 pts max)
  v_score := v_score + (LEAST(v_nominations_given, 5) * 20);

  -- E. Freshness Bonus (+50) - NUEVO
  -- Si el perfil se actualizó en los últimos 30 días
  IF v_profile.updated_at > (NOW() - INTERVAL '30 days') THEN
    v_score := v_score + 50;
  END IF;

  -- F. Pro Bonus (+100) - NUEVO
  IF v_profile.pro_since IS NOT NULL THEN
    v_score := v_score + 100;
  END IF;

  -- 4. Actualizar el perfil
  UPDATE public.profiles SET builder_score = v_score WHERE id = target_user_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
