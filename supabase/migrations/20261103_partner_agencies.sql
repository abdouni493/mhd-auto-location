-- ============================================================================
-- AGENCES PARTENAIRES (applications de location connectées) — 2026-11-03
-- ============================================================================
-- À exécuter sur CHAQUE projet Supabase qui utilise cette application
-- (application principale + chaque agence partenaire). Idempotent.
--
-- Une « agence partenaire » est une autre installation de cette application
-- (son propre projet Supabase). Le site public lit les voitures du partenaire
-- avec sa clé anon et y crée la réservation via SA RPC
-- create_website_reservation : la commande apparaît donc directement dans
-- « Commandes Website » de l'application du propriétaire de la voiture.
-- La clé anon est publique par nature (déjà embarquée dans chaque site web).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partner_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  phone text,
  email text,
  supabase_url text NOT NULL,
  anon_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_agencies_url_key ON public.partner_agencies (supabase_url);

ALTER TABLE public.partner_agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_agencies_public_read ON public.partner_agencies;
CREATE POLICY partner_agencies_public_read ON public.partner_agencies
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS partner_agencies_auth_all ON public.partner_agencies;
CREATE POLICY partner_agencies_auth_all ON public.partner_agencies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT ON public.partner_agencies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_agencies TO authenticated;

-- Le site d'une autre agence doit pouvoir LIRE les voitures et agences de ce
-- projet avec la clé anon (normalement déjà le cas pour le site public).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cars' AND cmd IN ('SELECT','ALL') AND 'anon' = ANY(roles)) THEN
    EXECUTE 'CREATE POLICY cars_anon_read_partner ON public.cars FOR SELECT TO anon USING (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agencies' AND cmd IN ('SELECT','ALL') AND 'anon' = ANY(roles)) THEN
    EXECUTE 'CREATE POLICY agencies_anon_read_partner ON public.agencies FOR SELECT TO anon USING (true)';
  END IF;
END $$;
GRANT SELECT ON public.cars, public.agencies TO anon;

-- Prérequis : les RPC create_website_reservation / get_reserved_periods /
-- get_unavailable_car_ids (migrations 20260702, 20260706, 20260708, 20260709)
-- doivent être installées sur chaque projet partenaire.
NOTIFY pgrst, 'reload schema';
