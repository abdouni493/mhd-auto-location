-- ============================================================================
-- MHD AUTO — LIVRAISON + PERMISSIONS DES EMPLOYÉS + AGENCE 4 — 2026-11-15
-- ============================================================================
-- À exécuter UNE FOIS dans le SQL Editor du projet principal. Idempotent.
--
--  1) Réservations : option « Livraison du véhicule » (livreur + montant)
--  2) Employés : colonne permissions (interfaces, boutons, voitures visibles)
--  3) Connexion des employés (rôle anon) : lecture des agences + rattachement
--     d'une NOUVELLE voiture à leur agence
--  4) Agence 4 + son compte admin4@admin.com / admin124 (username admin4)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1) LIVRAISON DU VÉHICULE
-- ============================================================================
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_enabled     boolean NOT NULL DEFAULT false;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_worker_id   uuid;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_worker_name text;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_amount      numeric NOT NULL DEFAULT 0;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS delivery_payout_mode text NOT NULL DEFAULT 'deferred';


-- ============================================================================
-- 2) PERMISSIONS DES EMPLOYÉS
-- ============================================================================
-- { "interfaces": [...], "actions": { "<interface>": [...] }, "carScope": "own" | "all" }
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Employé ancien sans agence → agence principale (jamais « toutes agences »).
UPDATE public.workers
SET company_id = (SELECT id FROM public.companies WHERE is_primary ORDER BY created_at LIMIT 1)
WHERE company_id IS NULL;

-- « Voir les voitures de toutes les agences » : réservé aux employés de
-- l'agence principale. Retiré aux employés des autres agences.
UPDATE public.workers w
SET permissions = w.permissions - 'carScope'
FROM public.companies c
WHERE c.id = w.company_id AND NOT c.is_primary AND w.permissions ? 'carScope';


-- ============================================================================
-- 3) CONNEXION DES EMPLOYÉS (session employé = rôle anon)
-- ============================================================================
-- a) Lecture de la liste des agences (nom / logo de SON agence, agence principale)
DROP POLICY IF EXISTS mc_companies_select_anon ON public.companies;
CREATE POLICY mc_companies_select_anon ON public.companies
  FOR SELECT TO anon USING (true);
GRANT SELECT ON public.companies TO anon;

-- b) Rattachement d'une voiture qu'il vient de créer (voiture encore sans agence)
DROP POLICY IF EXISTS mc_car_companies_insert_new_car ON public.car_companies;
CREATE POLICY mc_car_companies_insert_new_car ON public.car_companies
  FOR INSERT TO anon
  WITH CHECK (NOT EXISTS (
    SELECT 1 FROM public.car_companies x WHERE x.car_id = car_companies.car_id
  ));
GRANT INSERT ON public.car_companies TO anon;


-- ============================================================================
-- 4) AGENCE 4 + COMPTE admin4@admin.com
-- ============================================================================
INSERT INTO public.companies (name, is_primary)
SELECT 'Agence 4', false
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Agence 4');

DO $$
DECLARE
  v_uid uuid;
  v_company uuid;
BEGIN
  SELECT id INTO v_company FROM public.companies WHERE name = 'Agence 4' ORDER BY created_at LIMIT 1;
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'admin4@admin.com' LIMIT 1;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'admin4@admin.com', extensions.crypt('admin124', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', 'admin4'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_uid, v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', 'admin4@admin.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('admin124', extensions.gen_salt('bf')),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('username', 'admin4'),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_uid;
  END IF;

  -- Admin de SON agence uniquement (pas super-admin)
  INSERT INTO public.app_users (user_id, company_id, is_super_admin)
  VALUES (v_uid, v_company, false)
  ON CONFLICT (user_id) DO UPDATE
    SET company_id = EXCLUDED.company_id, is_super_admin = false;
END $$;

NOTIFY pgrst, 'reload schema';

-- Contrôle
SELECT c.name AS agence, u.email, a.is_super_admin
FROM public.app_users a
JOIN auth.users u ON u.id = a.user_id
LEFT JOIN public.companies c ON c.id = a.company_id
ORDER BY c.is_primary DESC, c.created_at;
