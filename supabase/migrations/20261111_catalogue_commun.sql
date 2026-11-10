-- ============================================================================
-- MHD AUTO — SERVICES & PROTECTIONS COMMUNS À TOUTES LES AGENCES — 2026-11-11
-- ============================================================================
-- À exécuter dans le SQL Editor du projet principal. Idempotent.
--
-- Les services (services) et les services de protection
-- (protection_assurances + éléments + liens) sont un CATALOGUE COMMUN :
--   • LECTURE : toutes les agences + le site public ;
--   • ÉCRITURE : uniquement l'agence principale.
-- Toutes les anciennes règles (policies) de ces tables sont remplacées, au cas
-- où une règle limitait la lecture au compte qui les a créés.
-- ============================================================================

-- L'utilisateur connecté appartient-il à l'agence principale ?
CREATE OR REPLACE FUNCTION public.auth_is_main_agency()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT a.is_super_admin OR a.company_id IS NULL OR c.is_primary
    FROM public.app_users a
    LEFT JOIN public.companies c ON c.id = a.company_id
    WHERE a.user_id = auth.uid()
  ), true);  -- compte sans ligne app_users = compte historique de l'agence principale
$$;
GRANT EXECUTE ON FUNCTION public.auth_is_main_agency() TO anon, authenticated;

DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['services','protection_assurances','protection_assurance_items','protection_assurance_item_links'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;

    -- Supprime TOUTES les règles existantes de la table
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Lecture : tout le monde (agences, employés, site public)
    EXECUTE format('CREATE POLICY catalog_read ON public.%I FOR SELECT TO anon, authenticated USING (true)', t);

    -- Écriture : agence principale uniquement
    EXECUTE format('CREATE POLICY catalog_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.auth_is_main_agency())', t);
    EXECUTE format('CREATE POLICY catalog_update ON public.%I FOR UPDATE TO authenticated USING (public.auth_is_main_agency()) WITH CHECK (public.auth_is_main_agency())', t);
    EXECUTE format('CREATE POLICY catalog_delete ON public.%I FOR DELETE TO authenticated USING (public.auth_is_main_agency())', t);

    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- Si une colonne company_id existe sur ces tables, elle ne doit plus rien filtrer.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['services','protection_assurances','protection_assurance_items','protection_assurance_item_links'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = t AND column_name = 'company_id') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_set_company_id ON public.%I', t);
      BEGIN
        EXECUTE format('UPDATE public.%I SET company_id = NULL WHERE company_id IS NOT NULL', t);
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'company_id de % conservé (%)', t, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
