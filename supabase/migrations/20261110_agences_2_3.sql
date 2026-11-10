-- ============================================================================
-- MHD AUTO — AGENCE 2 & AGENCE 3 SUR LA MÊME APPLICATION — 2026-11-10
-- ============================================================================
-- À exécuter UNE FOIS dans le SQL Editor du projet Supabase principal (MHD Auto).
-- Idempotent : ré-exécutable sans risque.
--
--  1) Supprime l'ancienne option « agences partenaires » (table partner_agencies)
--  2) Fiches agence : colonnes de coordonnées propres à chaque agence
--  3) Crée les agences « Agence 2 » et « Agence 3 »
--  4) Crée leurs comptes de connexion (admin2@admin.com / admin3@admin.com,
--     mot de passe admin123, nom d'utilisateur admin) — rattachés à LEUR agence
--  5) Routage automatique : une commande du site va à l'agence PROPRIÉTAIRE
--     de la voiture réservée (+ rattrapage des commandes en attente)
--  6) Paramètres : un admin peut changer son e-mail, nom d'utilisateur et
--     mot de passe
--
-- Services et services de protection : tables PARTAGÉES (aucune colonne
-- company_id) → identiques pour toutes les agences, rien à faire.
-- Prérequis : migrations 20260824_multi_company.sql et
-- 20260922_update_own_credentials.sql déjà exécutées.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1) SUPPRESSION DE L'ANCIENNE OPTION « AGENCES PARTENAIRES »
-- ============================================================================
DROP TABLE IF EXISTS public.partner_agencies CASCADE;
DROP POLICY IF EXISTS cars_anon_read_partner ON public.cars;
DROP POLICY IF EXISTS agencies_anon_read_partner ON public.agencies;


-- ============================================================================
-- 2) COORDONNÉES PROPRES À CHAQUE AGENCE
-- ============================================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS description    text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address        text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone          text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone_number_2 text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS bank_number    text;

-- Un admin d'agence peut modifier la fiche de SA propre agence (Paramètres).
DROP POLICY IF EXISTS mc_companies_update ON public.companies;
CREATE POLICY mc_companies_update ON public.companies
  FOR UPDATE TO authenticated
  USING (public.auth_is_super_admin() OR id = public.auth_company_id())
  WITH CHECK (public.auth_is_super_admin() OR id = public.auth_company_id());


-- ============================================================================
-- 3) AGENCES « Agence 2 » ET « Agence 3 »
-- ============================================================================
INSERT INTO public.companies (name, is_primary)
SELECT 'Agence 2', false
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Agence 2');

INSERT INTO public.companies (name, is_primary)
SELECT 'Agence 3', false
WHERE NOT EXISTS (SELECT 1 FROM public.companies WHERE name = 'Agence 3');


-- ============================================================================
-- 4) COMPTES DE CONNEXION DES AGENCES 2 ET 3
-- ============================================================================
DO $$
DECLARE
  acc record;
  v_uid uuid;
  v_company uuid;
BEGIN
  FOR acc IN
    SELECT * FROM (VALUES
      ('admin2@admin.com', 'admin123', 'admin', 'Agence 2'),
      ('admin3@admin.com', 'admin123', 'admin', 'Agence 3')
    ) AS t(email, pwd, username, company_name)
  LOOP
    SELECT id INTO v_company FROM public.companies WHERE name = acc.company_name ORDER BY created_at LIMIT 1;
    SELECT id INTO v_uid FROM auth.users WHERE lower(email) = acc.email LIMIT 1;

    IF v_uid IS NULL THEN
      v_uid := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
        acc.email, extensions.crypt(acc.pwd, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('username', acc.username),
        now(), now(), '', '', '', ''
      );

      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_uid, v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', acc.email, 'email_verified', true),
        'email', now(), now(), now()
      );
    END IF;

    -- Rattache le compte à SON agence (jamais super-admin : il ne voit que ses données)
    INSERT INTO public.app_users (user_id, company_id, is_super_admin)
    VALUES (v_uid, v_company, false)
    ON CONFLICT (user_id) DO UPDATE
      SET company_id = EXCLUDED.company_id, is_super_admin = false;

    -- Profil (nom d'utilisateur) si la table existe
    IF to_regclass('public.profiles') IS NOT NULL THEN
      EXECUTE 'INSERT INTO public.profiles (id, username, role) VALUES ($1, $2, ''admin'') ON CONFLICT (id) DO NOTHING'
        USING v_uid, acc.username;
    END IF;
  END LOOP;
END $$;


-- ============================================================================
-- 5) ROUTAGE DES COMMANDES DU SITE VERS LE PROPRIÉTAIRE DE LA VOITURE
-- ============================================================================
-- Agence propriétaire d'une voiture : lien car_companies, sinon agence principale.
CREATE OR REPLACE FUNCTION public.car_owner_company_id(p_car_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT cc.company_id FROM public.car_companies cc
       JOIN public.companies c ON c.id = cc.company_id
      WHERE cc.car_id = p_car_id
      ORDER BY c.is_primary DESC, c.created_at ASC LIMIT 1),
    (SELECT id FROM public.companies WHERE is_primary ORDER BY created_at ASC LIMIT 1)
  );
$$;
GRANT EXECUTE ON FUNCTION public.car_owner_company_id(uuid) TO anon, authenticated;

-- Avant insertion : une réservation sans agence (commande du site, rôle anon)
-- reçoit l'agence propriétaire de la voiture ; son client suit la même agence.
-- (S'exécute avant trg_set_company_id : ordre alphabétique des triggers.)
CREATE OR REPLACE FUNCTION public.route_reservation_to_car_owner()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL AND NEW.car_id IS NOT NULL THEN
    NEW.company_id := public.car_owner_company_id(NEW.car_id::uuid);
    IF NEW.client_id IS NOT NULL AND NEW.company_id IS NOT NULL THEN
      UPDATE public.clients SET company_id = NEW.company_id
       WHERE id = NEW.client_id AND company_id IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_a_route_reservation_owner ON public.reservations;
CREATE TRIGGER trg_a_route_reservation_owner
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.route_reservation_to_car_owner();

-- Rattrapage : commandes du site déjà reçues et pas encore attribuées.
UPDATE public.reservations r
SET company_id = public.car_owner_company_id(r.car_id::uuid)
WHERE r.company_id IS NULL AND r.car_id IS NOT NULL;

UPDATE public.clients c
SET company_id = r.company_id
FROM public.reservations r
WHERE r.client_id = c.id AND c.company_id IS NULL AND r.company_id IS NOT NULL;


-- ============================================================================
-- 6) IDENTIFIANTS : e-mail / nom d'utilisateur / mot de passe (admins inclus)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_own_credentials(
  p_current_email    text,
  p_current_password text,
  p_new_email        text DEFAULT NULL,
  p_new_username     text DEFAULT NULL,
  p_new_password     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_cur_email  text := lower(trim(p_current_email));
  v_new_email  text := NULLIF(lower(trim(COALESCE(p_new_email, ''))), '');
  v_username   text := NULLIF(trim(COALESCE(p_new_username, '')), '');
  v_user_id    uuid;
  v_auth_ok    boolean := false;
  v_worker_ok  boolean := false;
  v_worker_id  uuid;
BEGIN
  IF v_cur_email IS NULL OR v_cur_email = '' THEN
    RAISE EXCEPTION 'EMAIL_REQUIRED';
  END IF;
  IF p_current_password IS NULL OR p_current_password = '' THEN
    RAISE EXCEPTION 'CURRENT_PASSWORD_REQUIRED';
  END IF;
  IF p_new_password IS NOT NULL AND p_new_password <> '' AND length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'PASSWORD_TOO_SHORT';
  END IF;

  -- L'e-mail inchangé est traité comme « pas de changement d'e-mail ».
  IF v_new_email = v_cur_email THEN
    v_new_email := NULL;
  END IF;

  -- 1) Identité : compte Supabase Auth (admins, et employés dotés d'un compte).
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_cur_email LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    SELECT (encrypted_password = extensions.crypt(p_current_password, encrypted_password))
      INTO v_auth_ok
    FROM auth.users WHERE id = v_user_id;
    v_auth_ok := COALESCE(v_auth_ok, false);
  END IF;

  -- 2) Repli : employé sans compte Auth, authentifié sur `workers.password`.
  SELECT id INTO v_worker_id FROM public.workers WHERE lower(email) = v_cur_email LIMIT 1;
  IF v_worker_id IS NOT NULL THEN
    SELECT (password IS NOT NULL AND password = p_current_password)
      INTO v_worker_ok
    FROM public.workers WHERE id = v_worker_id;
    v_worker_ok := COALESCE(v_worker_ok, false);
  END IF;

  IF NOT v_auth_ok AND NOT v_worker_ok THEN
    RAISE EXCEPTION 'INVALID_CURRENT_PASSWORD';
  END IF;

  -- 3) Le nouvel e-mail ne doit appartenir à personne d'autre.
  IF v_new_email IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_new_email AND id IS DISTINCT FROM v_user_id) THEN
      RAISE EXCEPTION 'EMAIL_ALREADY_USED';
    END IF;
    IF EXISTS (SELECT 1 FROM public.workers WHERE lower(email) = v_new_email AND id IS DISTINCT FROM v_worker_id) THEN
      RAISE EXCEPTION 'EMAIL_ALREADY_USED';
    END IF;
  END IF;

  -- 4) Nom d'utilisateur : unique parmi les employés.
  IF v_username IS NOT NULL AND v_worker_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.workers
      WHERE lower(username) = lower(v_username) AND id IS DISTINCT FROM v_worker_id
    ) THEN
      RAISE EXCEPTION 'USERNAME_ALREADY_USED';
    END IF;
  END IF;

  -- 5) Application sur auth.users (+ identité e-mail, sinon la connexion casse).
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET email              = COALESCE(v_new_email, email),
        encrypted_password = CASE
                               WHEN p_new_password IS NULL OR p_new_password = '' THEN encrypted_password
                               ELSE extensions.crypt(p_new_password, extensions.gen_salt('bf'))
                             END,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        raw_user_meta_data = CASE
                               WHEN v_username IS NULL THEN raw_user_meta_data
                               ELSE COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('username', v_username)
                             END,
        updated_at         = now()
    WHERE id = v_user_id;

    -- Nom d'utilisateur des admins d'agence (table profiles, si présente)
    IF v_username IS NOT NULL AND to_regclass('public.profiles') IS NOT NULL THEN
      EXECUTE 'UPDATE public.profiles SET username = $1 WHERE id = $2' USING v_username, v_user_id;
    END IF;

    IF v_new_email IS NOT NULL THEN
      UPDATE auth.identities
      SET identity_data = COALESCE(identity_data, '{}'::jsonb)
                          || jsonb_build_object('email', v_new_email, 'email_verified', true),
          updated_at    = now()
      WHERE user_id = v_user_id AND provider = 'email';
    END IF;
  END IF;

  -- 6) Application sur la fiche employé (e-mail, identifiant, mot de passe).
  IF v_worker_id IS NOT NULL THEN
    UPDATE public.workers
    SET email    = COALESCE(v_new_email, email),
        username = COALESCE(v_username, username),
        password = CASE
                     WHEN p_new_password IS NULL OR p_new_password = '' THEN password
                     ELSE p_new_password
                   END
    WHERE id = v_worker_id;
  END IF;

  RETURN jsonb_build_object(
    'success',          true,
    'email',            COALESCE(v_new_email, v_cur_email),
    'email_changed',    v_new_email IS NOT NULL,
    'password_changed', p_new_password IS NOT NULL AND p_new_password <> '',
    'auth_user',        v_user_id IS NOT NULL,
    'worker',           v_worker_id IS NOT NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_own_credentials(text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_own_credentials(text, text, text, text, text) TO anon, authenticated;


NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VÉRIFICATION (facultatif)
-- ============================================================================
-- SELECT c.name, u.email, a.is_super_admin
-- FROM public.app_users a
-- JOIN auth.users u ON u.id = a.user_id
-- LEFT JOIN public.companies c ON c.id = a.company_id
-- ORDER BY c.created_at;
