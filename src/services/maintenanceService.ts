import { supabase } from '../supabase';
import { Car, VehicleExpense } from '../types';

export interface MaintenanceStatus {
  car: Car;
  vidange: {
    lastDate: string | null;
    lastMileage: number | null;
    nextMileage: number | null;
    kmRemaining: number | null;
    expense: VehicleExpense | null;
  };
  chaine: {
    lastDate: string | null;
    lastMileage: number | null;
    nextMileage: number | null;
    kmRemaining: number | null;
    expense: VehicleExpense | null;
  };
  assurance: {
    lastDate: string | null;
    expirationDate: string | null;
    daysRemaining: number | null;
    isExpired: boolean;
    expense: VehicleExpense | null;
  };
  controleTechnique: {
    lastDate: string | null;
    expirationDate: string | null;
    daysRemaining: number | null;
    isExpired: boolean;
    expense: VehicleExpense | null;
  };
}

export async function getMaintenanceStatus(cars: Car[]): Promise<MaintenanceStatus[]> {
  try {
    const result: MaintenanceStatus[] = [];

    for (const car of cars) {
      // Get all vehicle expenses for this car
      const { data: expenses, error } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .eq('car_id', car.id)
        .order('date', { ascending: false });

      if (error) {
        console.error(`Error fetching expenses for car ${car.id}:`, error);
        continue;
      }

      const mappedExpenses: VehicleExpense[] = (expenses || []).map(exp => ({
        id: exp.id,
        carId: exp.car_id,
        type: exp.type,
        cost: exp.cost,
        date: exp.date,
        note: exp.note,
        currentMileage: exp.current_mileage,
        nextVidangeKm: exp.next_vidange_km,
        expirationDate: exp.expiration_date,
        expenseName: exp.expense_name,
        createdAt: exp.created_at,
        oilFilterChanged: exp.oil_filter_changed || false,
        airFilterChanged: exp.air_filter_changed || false,
        fuelFilterChanged: exp.fuel_filter_changed || false,
        acFilterChanged: exp.ac_filter_changed || false,
      }));

      // Separate expenses by type
      const vidangeExpenses = mappedExpenses.filter(e => e.type === 'vidange');
      const chaineExpenses = mappedExpenses.filter(e => e.type === 'chaine');
      const assuranceExpenses = mappedExpenses.filter(e => e.type === 'assurance');
      const controleExpenses = mappedExpenses.filter(e => e.type === 'controle');

      // Calculate vidange status
      const latestVidange = vidangeExpenses[0];
      const vidangeStatus = {
        lastDate: latestVidange?.date || null,
        lastMileage: latestVidange?.currentMileage || null,
        nextMileage: latestVidange?.nextVidangeKm || null,
        kmRemaining: latestVidange?.nextVidangeKm
          ? Math.max(0, latestVidange.nextVidangeKm - (car.mileage || 0))
          : null,
        expense: latestVidange || null,
      };

      // Calculate chaine status
      const latestChaine = chaineExpenses[0];
      const chaineStatus = {
        lastDate: latestChaine?.date || null,
        lastMileage: latestChaine?.currentMileage || null,
        nextMileage: latestChaine?.nextVidangeKm || null,
        kmRemaining: latestChaine?.nextVidangeKm
          ? Math.max(0, latestChaine.nextVidangeKm - (car.mileage || 0))
          : null,
        expense: latestChaine || null,
      };

      // Calculate assurance status
      const latestAssurance = assuranceExpenses[0];
      const today = new Date();
      const assuranceExpiration = latestAssurance?.expirationDate
        ? new Date(latestAssurance.expirationDate)
        : null;
      const assuranceDaysRemaining = assuranceExpiration
        ? Math.ceil((assuranceExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const assuranceStatus = {
        lastDate: latestAssurance?.date || null,
        expirationDate: latestAssurance?.expirationDate || null,
        daysRemaining: assuranceDaysRemaining,
        isExpired: assuranceDaysRemaining !== null && assuranceDaysRemaining < 0,
        expense: latestAssurance || null,
      };

      // Calculate controle technique status
      const latestControle = controleExpenses[0];
      const controleExpiration = latestControle?.expirationDate
        ? new Date(latestControle.expirationDate)
        : null;
      const controleDaysRemaining = controleExpiration
        ? Math.ceil((controleExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const controleStatus = {
        lastDate: latestControle?.date || null,
        expirationDate: latestControle?.expirationDate || null,
        daysRemaining: controleDaysRemaining,
        isExpired: controleDaysRemaining !== null && controleDaysRemaining < 0,
        expense: latestControle || null,
      };

      result.push({
        car,
        vidange: vidangeStatus,
        chaine: chaineStatus,
        assurance: assuranceStatus,
        controleTechnique: controleStatus,
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    return [];
  }
}

// Get status color based on alert level
export function getStatusColor(
  type: 'vidange' | 'chaine' | 'assurance' | 'controle',
  value: number | null | undefined,
  threshold: number = type === 'vidange' || type === 'chaine' ? 1000 : 30
): 'critical' | 'warning' | 'success' {
  if (value === null || value === undefined) {
    return 'success'; // No data yet
  }

  if (type === 'vidange' || type === 'chaine') {
    // KM remaining
    if (value <= 0) return 'critical';
    if (value <= threshold) return 'warning';
    return 'success';
  } else {
    // Days remaining
    if (value < 0) return 'critical'; // Expired
    if (value <= threshold) return 'warning';
    return 'success';
  }
}

export function getStatusEmoji(status: 'critical' | 'warning' | 'success'): string {
  switch (status) {
    case 'critical':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'success':
      return '🟢';
  }
}
