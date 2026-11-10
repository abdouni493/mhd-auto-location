-- ============================================================================
-- MHD AUTO — CHAQUE AGENCE CRÉE ET VOIT SES PROPRES VOITURES — 2026-11-12
-- ============================================================================
-- À exécuter dans le SQL Editor du projet principal. Idempotent.
--
-- Filet de sécurité : toute voiture créée par un compte d'agence est
-- automatiquement rattachée à CETTE agence (table car_companies), même si
-- l'application n'a pas pu enregistrer le lien.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.link_new_car_to_own_company()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company uuid := public.auth_company_id();
BEGIN
  IF v_company IS NOT NULL THEN
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

-- ============================================================================
-- CONTRÔLE (facultatif) : voitures rattachées à PLUSIEURS agences
-- ============================================================================
-- SELECT c.brand, c.model, c.plate_number, string_agg(co.name, ', ') AS agences
-- FROM public.cars c
-- JOIN public.car_companies cc ON cc.car_id = c.id
-- JOIN public.companies co ON co.id = cc.company_id
-- GROUP BY c.id, c.brand, c.model, c.plate_number
-- HAVING count(*) > 1;
--
-- Pour rendre une voiture à une seule agence (remplacer les valeurs) :
-- DELETE FROM public.car_companies
-- WHERE car_id = (SELECT id FROM public.cars WHERE plate_number = 'XXXXX')
--   AND company_id <> (SELECT id FROM public.companies WHERE name = 'Agence 2');
