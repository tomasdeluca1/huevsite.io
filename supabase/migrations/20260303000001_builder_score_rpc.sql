-- 1. Función para recalcular el score de un usuario específico
CREATE OR REPLACE FUNCTION public.recompute_builder_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_profile RECORD;
  v_blocks_count INTEGER;
  v_project_count INTEGER;
  v_building_count INTEGER;
  v_writing_count INTEGER;
  v_has_github BOOLEAN;
  v_endorsements_count INTEGER;
  v_nominations_count INTEGER;
  v_followers_count INTEGER;
BEGIN
  -- 1. Obtener datos del perfil
  SELECT name, tagline, image, github_handle INTO v_profile FROM public.profiles WHERE id = target_user_id;
  
  -- Si el perfil no existe, retornar 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Completitud base (Max 150)
  IF v_profile.image IS NOT NULL AND v_profile.image != '' THEN v_score := v_score + 50; END IF;
  IF v_profile.tagline IS NOT NULL AND v_profile.tagline != '' THEN v_score := v_score + 50; END IF;
  IF v_profile.name IS NOT NULL AND v_profile.name != '' THEN v_score := v_score + 50; END IF;

  -- 2. Estadísticas de Bloques
  SELECT count(*) INTO v_blocks_count FROM public.blocks WHERE user_id = target_user_id AND visible = true;
  
  IF v_blocks_count > 0 THEN
    v_score := v_score + 100; -- Bonus por tener bloques configurados
    
    SELECT count(*) INTO v_project_count FROM public.blocks WHERE user_id = target_user_id AND visible = true AND type = 'project';
    SELECT count(*) INTO v_building_count FROM public.blocks WHERE user_id = target_user_id AND visible = true AND type = 'building';
    SELECT count(*) INTO v_writing_count FROM public.blocks WHERE user_id = target_user_id AND visible = true AND type = 'writing';
    SELECT EXISTS (SELECT 1 FROM public.blocks WHERE user_id = target_user_id AND visible = true AND type = 'github') INTO v_has_github;
    
    v_score := v_score + (v_project_count * 50);
    v_score := v_score + (v_building_count * 30);
    v_score := v_score + (v_writing_count * 20);
    
    -- Bonus GitHub (Conectado o bloque activo)
    IF v_has_github OR (v_profile.github_handle IS NOT NULL AND v_profile.github_handle != '') THEN
      v_score := v_score + 100;
    END IF;
  END IF;

  -- 3. Validación Social
  -- Nota: Ajustamos nombres de columnas según la estructura real de la base
  SELECT count(*) INTO v_endorsements_count FROM public.endorsements WHERE to_id = target_user_id;
  SELECT count(*) INTO v_nominations_count FROM public.showcase_nominations WHERE user_id = target_user_id;
  SELECT count(*) INTO v_followers_count FROM public.follows WHERE following_id = target_user_id;

  v_score := v_score + (v_endorsements_count * 25);
  v_score := v_score + (v_nominations_count * 15);
  v_score := v_score + (v_followers_count * 10);

  -- 4. Actualizar el perfil
  UPDATE public.profiles SET builder_score = v_score WHERE id = target_user_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para recalcular TODOS los scores de una vez
CREATE OR REPLACE FUNCTION public.recompute_all_builder_scores()
RETURNS VOID AS $$
DECLARE
  profile_id UUID;
BEGIN
  FOR profile_id IN SELECT id FROM public.profiles LOOP
    PERFORM public.recompute_builder_score(profile_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
