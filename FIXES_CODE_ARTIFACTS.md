# AutoLocation Fixes - Complete Code Reference

## File 1: `src/services/maintenanceService.ts` (MODIFIED)

### Changes Summary:
1. Fixed KM calculation formula for vidange and chaîne
2. Updated color threshold logic

### Full Updated File:

```typescript
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
      // FIX: nextVidangeKm is an INTERVAL, so: nextAbsoluteTarget = lastMileage + interval
      // kmRemaining = nextAbsoluteTarget - currentMileage
      const latestVidange = vidangeExpenses[0];
      const vidangeStatus = {
        lastDate: latestVidange?.date || null,
        lastMileage: latestVidange?.currentMileage || null,
        nextMileage: latestVidange?.nextVidangeKm || null,
        kmRemaining: latestVidange?.currentMileage !== null && latestVidange?.currentMileage !== undefined && latestVidange?.nextVidangeKm
          ? (latestVidange.currentMileage + latestVidange.nextVidangeKm) - (car.mileage || 0)
          : null,
        expense: latestVidange || null,
      };

      // Calculate chaine status
      // FIX: nextVidangeKm is an INTERVAL, so: nextAbsoluteTarget = lastMileage + interval
      // kmRemaining = nextAbsoluteTarget - currentMileage
      const latestChaine = chaineExpenses[0];
      const chaineStatus = {
        lastDate: latestChaine?.date || null,
        lastMileage: latestChaine?.currentMileage || null,
        nextMileage: latestChaine?.nextVidangeKm || null,
        kmRemaining: latestChaine?.currentMileage !== null && latestChaine?.currentMileage !== undefined && latestChaine?.nextVidangeKm
          ? (latestChaine.currentMileage + latestChaine.nextVidangeKm) - (car.mileage || 0)
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
// FIX: Updated color thresholds
// - KM-based (vidange, chaine): Green > 2000 km, Yellow 0-2000 km, Red <= 0 km (overdue)
// - Day-based (assurance, controle): Green > 30 days, Yellow 0-30 days, Red < 0 days (expired)
export function getStatusColor(
  type: 'vidange' | 'chaine' | 'assurance' | 'controle',
  value: number | null | undefined
): 'critical' | 'warning' | 'success' {
  if (value === null || value === undefined) {
    return 'success'; // No data yet
  }

  if (type === 'vidange' || type === 'chaine') {
    // KM remaining
    if (value <= 0) return 'critical'; // Overdue
    if (value <= 2000) return 'warning'; // Warning zone
    return 'success'; // Plenty of KM left
  } else {
    // Days remaining (assurance, controle)
    if (value < 0) return 'critical'; // Expired
    if (value <= 30) return 'warning'; // Warning zone (30 days or less)
    return 'success'; // Plenty of time left
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
```

---

## File 2: `src/utils/reservationAlerts.ts` (MODIFIED - Key Changes)

### Key Changes:

**1. Added new alert type to interface (Line 9):**
```typescript
type: 'pre_start' | 'pre_end' | 'not_closed' | 'late_activation' | 'expiring_tomorrow';
```

**2. Added new alert logic in getReservationAlert() (Lines 32-49):**
```typescript
// NEW ALERT: Reservation expires tomorrow (date_fin = tomorrow)
if (
  returnDate.getTime() === tomorrow.getTime() && 
  (reservation.status === 'active' || reservation.status === 'confirmed')
) {
  const clientName = `${reservation.client.firstName} ${reservation.client.lastName}`;
  const vehicleName = `${reservation.car.brand} ${reservation.car.model}`;
  return {
    id: `${reservation.id}-expiring-tomorrow`,
    reservationId: reservation.id,
    car: reservation.car,
    reservation,
    type: 'expiring_tomorrow',
    severity: 'high',
    title: 'Réservation expire demain / الحجز ينتهي غدا',
    message: `La réservation de ${clientName} pour ${vehicleName} expire demain (${returnDate.toLocaleDateString('fr-FR')})`,
    icon: '🔔',
    daysUntil: 1,
    status: 'warning',
    actionRequired: true
  };
}
```

---

## File 3: `src/services/notificationService.ts` (NEW FILE)

```typescript
/**
 * Notification Service
 * Handles browser notifications and scheduled alerts for reservations expiring tomorrow
 */

export interface ScheduledNotification {
  id: string;
  reservationId: string;
  type: 'reservation_expiry';
  scheduledTime: string; // ISO string for 9:00 AM on expiry day
  message: string;
  triggered: boolean;
}

const STORAGE_KEY = 'scheduled_notifications';

/**
 * Request permission for browser notifications (if needed)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Send a browser notification
 */
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window)) {
    console.log('Browser notifications not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  return new Notification(title, {
    icon: '🚗',
    ...options
  });
}

/**
 * Schedule a notification for 9:00 AM on a specific date
 */
export function scheduleNotification(
  reservationId: string,
  expiryDate: Date,
  message: string
): ScheduledNotification {
  // Create a date for 9:00 AM on the expiry date
  const scheduledTime = new Date(expiryDate);
  scheduledTime.setHours(9, 0, 0, 0);

  const notification: ScheduledNotification = {
    id: `${reservationId}-expiry-9am`,
    reservationId,
    type: 'reservation_expiry',
    scheduledTime: scheduledTime.toISOString(),
    message,
    triggered: false
  };

  // Save to localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  const notifications: ScheduledNotification[] = stored ? JSON.parse(stored) : [];

  // Remove duplicates
  const filtered = notifications.filter(n => n.id !== notification.id);
  filtered.push(notification);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  console.log('[Notification] Scheduled notification:', notification);

  return notification;
}

/**
 * Check and trigger scheduled notifications
 * Call this periodically (e.g., every minute)
 */
export function checkAndTriggerScheduledNotifications(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  const notifications: ScheduledNotification[] = JSON.parse(stored);
  const now = new Date();
  let updated = false;

  notifications.forEach(notif => {
    if (!notif.triggered) {
      const scheduledTime = new Date(notif.scheduledTime);
      // Trigger if we're within 5 minutes of scheduled time or past it
      const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff <= 5) {
        sendNotification('🔔 ' + notif.message, {
          badge: '🚗',
          tag: notif.id
        });
        notif.triggered = true;
        updated = true;
        console.log('[Notification] Triggered scheduled notification:', notif.id);
      }
    }
  });

  if (updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
}

/**
 * Remove a scheduled notification
 */
export function removeScheduledNotification(notificationId: string): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  const notifications: ScheduledNotification[] = JSON.parse(stored);
  const filtered = notifications.filter(n => n.id !== notificationId);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  console.log('[Notification] Removed scheduled notification:', notificationId);
}

/**
 * Get all scheduled notifications
 */
export function getScheduledNotifications(): ScheduledNotification[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all triggered notifications (cleanup)
 */
export function clearTriggeredNotifications(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  const notifications: ScheduledNotification[] = JSON.parse(stored);
  const active = notifications.filter(n => !n.triggered);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
  console.log('[Notification] Cleared triggered notifications');
}
```

---

## File 4: `src/components/DashboardPage.tsx` (MODIFIED - Key Changes)

### Changes:

**1. Added import (Line 13):**
```typescript
import { scheduleNotification, checkAndTriggerScheduledNotifications, requestNotificationPermission } from '../services/notificationService';
```

**2. Added notification scheduling effect (Lines 429-443):**
```typescript
// Schedule notifications for reservations expiring tomorrow
useEffect(() => {
  if (reservations.length === 0) return;

  // Request notification permission on first load
  requestNotificationPermission();

  // Get all alerts to find expiring_tomorrow alerts
  const allAlerts = getReservationAlerts(reservations);
  const expiringTomorrowAlerts = allAlerts.filter(a => a.type === 'expiring_tomorrow');

  // Schedule notifications for each expiring reservation
  expiringTomorrowAlerts.forEach(alert => {
    const returnDate = new Date(alert.reservation.step1.returnDate);
    const clientName = `${alert.reservation.client.firstName} ${alert.reservation.client.lastName}`;
    const vehicleName = `${alert.reservation.car.brand} ${alert.reservation.car.model}`;
    const message = `La réservation de ${clientName} pour ${vehicleName} expire demain!`;
    
    scheduleNotification(alert.reservationId, returnDate, message);
  });

  console.log(`[Dashboard] Scheduled ${expiringTomorrowAlerts.length} notification(s) for expiring reservations`);
}, [reservations]);
```

**3. Added notification check interval (Lines 445-455):**
```typescript
// Check and trigger scheduled notifications every minute
useEffect(() => {
  const notificationCheckInterval = setInterval(() => {
    checkAndTriggerScheduledNotifications();
  }, 60000); // Check every minute

  // Check immediately on mount
  checkAndTriggerScheduledNotifications();

  return () => clearInterval(notificationCheckInterval);
}, []);
```

---

## Summary of All Modifications

| File | Type | Changes |
|------|------|---------|
| maintenanceService.ts | Modified | KM formula fix + color threshold update |
| reservationAlerts.ts | Modified | Added expiring_tomorrow alert type + logic |
| notificationService.ts | NEW | Complete notification system (170 lines) |
| DashboardPage.tsx | Modified | Import + 2 new effects (scheduling + checking) |

**Total Lines Added/Modified: ~250 lines**

