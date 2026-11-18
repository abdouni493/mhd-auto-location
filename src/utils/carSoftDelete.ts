/**
 * Suppression « douce » des voitures — SANS migration SQL.
 *
 * Supprimer réellement une ligne `cars` déclenche les suppressions en cascade
 * de la base (réservations, dépenses, maintenances, inspections…). Pour
 * conserver tout l'historique, la voiture n'est donc PAS supprimée
 * physiquement : on la marque comme supprimée dans sa colonne JSONB
 * `currencies` (clé réservée `__deleted_at`), puis l'application la masque
 * partout (liste des véhicules, planificateur, site public, offres…).
 *
 * Les réservations, dépenses et maintenances gardent ainsi leur voiture
 * (marque, modèle, immatriculation) pour l'affichage et les rapports.
 */

export const CAR_DELETED_KEY = '__deleted_at';

/** true si la ligne `cars` (brute, snake_case) a été supprimée par l'utilisateur. */
export function isCarRowDeleted(row: any): boolean {
  if (!row) return false;
  const cur = row.currencies;
  if (cur && typeof cur === 'object' && !Array.isArray(cur) && cur[CAR_DELETED_KEY]) return true;
  return false;
}

/** Filtre une liste de lignes `cars` brutes pour retirer les voitures supprimées. */
export function withoutDeletedCars<T = any>(rows: T[] | null | undefined): T[] {
  return (rows || []).filter(r => !isCarRowDeleted(r));
}

/** Valeur `currencies` à écrire pour marquer la voiture comme supprimée. */
export function markCurrenciesDeleted(current: any): Record<string, any> {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  return { ...base, [CAR_DELETED_KEY]: new Date().toISOString() };
}
