-- ============================================================================
-- MHD AUTO — BASCULE D'AGENCE POUR L'ADMIN PRINCIPAL — 2026-11-14
-- ============================================================================
-- À exécuter dans le SQL Editor du projet principal. Idempotent.
--
-- L'admin de l'agence principale peut maintenant travailler « comme »
-- Agence 2 / Agence 3. Quand il crée une voiture dans cette vue,
-- l'application la rattache à l'agence consultée : le filet de sécurité
-- côté base ne doit donc PAS la rattacher en plus à l'agence principale.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.link_new_car_to_own_company()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid := public.auth_company_id();
BEGIN
  -- L'admin principal (super-admin) choisit lui-même l'agence de la voiture.
  IF v_company IS NOT NULL AND NOT public.auth_is_super_admin() THEN
    INSERT INTO public.car_companies (car_id, company_id)
    VALUES (NEW.id, v_company)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_new_car_to_own_company ON public.cars;
CREATE TRIGGER trg_link_new_car_to_own_company
  AFTER INSERT ON public.cars
  FOR EACH ROW EXECUTE FUNCTION public.link_new_car_to_own_company();

NOTIFY pgrst, 'reload schema';
