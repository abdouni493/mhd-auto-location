/**
 * Tarification location : jour / semaine / mois.
 *
 * Règle métier (unique source de vérité) :
 *
 * • L'agence saisit un **prix par jour** pour chacune des trois formules :
 *   – `priceDay`   : tarif journalier « à la journée » ;
 *   – tarif journalier « en formule semaine » ;
 *   – tarif journalier « en formule mois ».
 * • Les colonnes stockées `price_week` / `price_month` contiennent le **total**
 *   de la formule, soit respectivement `tarif jour × 7` et `tarif jour × 30`.
 *   Rien ne change côté base : les contrats, la conversion de devises et
 *   l'historique continuent de lire des totaux.
 * • L'affichage (site public, fiches véhicule) montre le tarif journalier, et
 *   le total de la formule entre parenthèses.
 *
 * Toutes les vues passent par les helpers ci-dessous afin qu'un seul endroit
 * décide des multiplicateurs et des valeurs de repli.
 */

/** Nombre de jours facturés dans une formule « semaine ». */
export const WEEK_DAYS = 7;
/** Nombre de jours facturés dans une formule « mois ». */
export const MONTH_DAYS = 30;

/** Sous-ensemble de `Car` nécessaire au calcul (facilite les appels partiels). */
export interface CarRates {
  priceDay?: number | null;
  priceWeek?: number | null;
  priceMonth?: number | null;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Tarif journalier « à la journée ». */
export const dayRate = (car?: CarRates | null): number => num(car?.priceDay);

/**
 * Total d'une semaine. Repli sur `priceDay × 7` tant qu'aucun tarif semaine
 * n'a été saisi sur le véhicule.
 */
export const weekTotal = (car?: CarRates | null): number =>
  num(car?.priceWeek) || dayRate(car) * WEEK_DAYS;

/** Total d'un mois. Repli sur `priceDay × 30`. */
export const monthTotal = (car?: CarRates | null): number =>
  num(car?.priceMonth) || dayRate(car) * MONTH_DAYS;

/** Tarif journalier appliqué en formule semaine (total ÷ 7). */
export const weekDayRate = (car?: CarRates | null): number =>
  Math.round(weekTotal(car) / WEEK_DAYS);

/** Tarif journalier appliqué en formule mois (total ÷ 30). */
export const monthDayRate = (car?: CarRates | null): number =>
  Math.round(monthTotal(car) / MONTH_DAYS);

/** Total semaine à partir d'un tarif journalier saisi. */
export const weekTotalFromDay = (perDay: number): number => Math.round(num(perDay) * WEEK_DAYS);

/** Total mois à partir d'un tarif journalier saisi. */
export const monthTotalFromDay = (perDay: number): number => Math.round(num(perDay) * MONTH_DAYS);

/** Décomposition d'une durée de location en mois / semaines / jours. */
export interface RentalBreakdown {
  /** Durée totale demandée, en jours. */
  days: number;
  months: number;
  weeks: number;
  /** Jours restants facturés au tarif journalier. */
  extraDays: number;
  /** Tarifs unitaires retenus (utiles à l'affichage du détail). */
  monthTotal: number;
  weekTotal: number;
  dayRate: number;
  /** Montants par tranche. */
  monthsAmount: number;
  weeksAmount: number;
  extraDaysAmount: number;
  /** Somme des trois tranches. */
  total: number;
}

/**
 * Calcule le prix de base d'une location.
 *
 * La durée est consommée par tranches décroissantes : mois entiers d'abord
 * (formule la plus avantageuse), puis semaines entières, puis jours isolés.
 * Une réservation de 7 jours est donc facturée au total semaine, une de 30
 * jours au total mois — exactement comme le demande la grille tarifaire.
 */
export function computeRentalBase(car: CarRates | null | undefined, days: number): RentalBreakdown {
  const totalDays = Math.max(0, Math.floor(Number(days) || 0));

  const mTotal = monthTotal(car);
  const wTotal = weekTotal(car);
  const dRate = dayRate(car);

  const months = Math.floor(totalDays / MONTH_DAYS);
  const afterMonths = totalDays % MONTH_DAYS;
  const weeks = Math.floor(afterMonths / WEEK_DAYS);
  const extraDays = afterMonths % WEEK_DAYS;

  const monthsAmount = months * mTotal;
  const weeksAmount = weeks * wTotal;
  const extraDaysAmount = extraDays * dRate;

  return {
    days: totalDays,
    months,
    weeks,
    extraDays,
    monthTotal: mTotal,
    weekTotal: wTotal,
    dayRate: dRate,
    monthsAmount,
    weeksAmount,
    extraDaysAmount,
    total: Math.round(monthsAmount + weeksAmount + extraDaysAmount),
  };
}
