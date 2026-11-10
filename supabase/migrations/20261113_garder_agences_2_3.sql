-- ============================================================================
-- MHD AUTO — GARDER UNIQUEMENT : AGENCE PRINCIPALE + AGENCE 2 + AGENCE 3
-- ============================================================================
-- À exécuter dans le SQL Editor du projet principal. Idempotent.
--
-- Supprime toute autre agence (ex. « I CAR »). Rien n'est perdu : ses
-- réservations, clients, dépenses, employés… et ses voitures sont d'abord
-- rattachés à l'agence principale. Ses comptes de connexion sont supprimés.
-- ============================================================================

DO $$
DECLARE
  v_primary uuid;
  v_old     uuid;
  t         text;
  tables text[] := ARRAY[
    'reservations','clients','vehicle_expenses','store_expenses','payments',
    'workers','maintenance_alerts','document_templates','worker_advances',
    'worker_absences','worker_payments','worker_roles','promo_codes',
    'entreprises','rental_settings','agency_settings'
  ];
BEGIN
  SELECT id INTO v_primary FROM public.companies WHERE is_primary ORDER BY created_at LIMIT 1;
  IF v_primary IS NULL THEN
    RAISE EXCEPTION 'Aucune agence principale trouvée — rien n''a été supprimé.';
  END IF;

  FOR v_old IN
    SELECT id FROM public.companies
    WHERE id <> v_primary AND name NOT IN ('Agence 2', 'Agence 3')
  LOOP
    -- 1) Données métier → agence principale
    FOREACH t IN ARRAY tables LOOP
      IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = t AND column_name = 'company_id') THEN
        EXECUTE format('UPDATE public.%I SET company_id = $1 WHERE company_id = $2', t)
          USING v_primary, v_old;
      END IF;
    END LOOP;

    -- 2) Voitures → agence principale
    INSERT INTO public.car_companies (car_id, company_id)
    SELECT car_id, v_primary FROM public.car_companies WHERE company_id = v_old
    ON CONFLICT DO NOTHING;
    DELETE FROM public.car_companies WHERE company_id = v_old;

    -- 3) Comptes de connexion de cette agence (hors super-admin)
    BEGIN
      DELETE FROM auth.users u
      USING public.app_users a
      WHERE a.user_id = u.id AND a.company_id = v_old AND NOT a.is_super_admin;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Comptes non supprimés (%), simple détachement.', SQLERRM;
    END;
    DELETE FROM public.app_users WHERE company_id = v_old AND NOT is_super_admin;
    UPDATE public.app_users SET company_id = v_primary WHERE company_id = v_old;

    -- 4) L'agence elle-même
    DELETE FROM public.companies WHERE id = v_old;
    RAISE NOTICE 'Agence % supprimée.', v_old;
  END LOOP;
END $$;

-- Contrôle : il ne doit rester que 3 agences
SELECT name, is_primary FROM public.companies ORDER BY is_primary DESC, created_at;
