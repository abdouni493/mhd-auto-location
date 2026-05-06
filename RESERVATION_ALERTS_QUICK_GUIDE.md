# Quick Reference: Reservation Expiry Alerts

## What's New ✨

Two additional alert cards for reservation expiration:

1. **🚨 Expire Aujourd'hui** (Today's return date)
2. **🔔 Expire Demain** (Tomorrow's return date)

---

## How It Works

### For "Today" Alerts
```
IF reservation.returnDate === TODAY 
   AND status IN ['active', 'confirmed']
THEN show 🚨 CRITICAL alert card
```

**Display:**
- Red gradient card (Red-600 to Rose-700)
- Icon: 🚨
- Title: "Expire Aujourd'hui / الحجز ينتهي اليوم"
- Message: "La réservation expire aujourd'hui à minuit!"
- Severity Badge: Critical (animated pulse)

---

### For "Tomorrow" Alerts
```
IF reservation.returnDate === TOMORROW 
   AND status IN ['active', 'confirmed']
THEN show 🔔 HIGH alert card
```

**Display:**
- Orange-to-Red gradient card (Orange-400 to Red-500)
- Icon: 🔔
- Title: "Expire Demain / الحجز ينتهي غدا"
- Message: "La réservation expire demain ({date})!"
- Severity Badge: High severity (no pulse)

---

## Alert Display Order

All alerts sorted by severity:

```
1. 🔴 CRITICAL (Red cards)
   ├─ 🚨 Expire Aujourd'hui (TODAY)
   ├─ ⏰ Non Fermée (Overdue)
   └─ ⚠️ Activation Retardée (3+ days late)

2. 🟠 HIGH (Orange cards)
   ├─ 🔔 Expire Demain (TOMORROW)
   └─ ⚠️ Activation Retardée (< 3 days late)

3. 🟡 MEDIUM (Yellow cards)
   ├─ 🚗 Départ Demain (Departure tomorrow)
   └─ 📅 Retour Demain (Return tomorrow - old)

4. 🟢 LOW (Green cards)
   └─ [Reserved for future]
```

---

## Card Layout

Both cards display:

```
┌────────────────────────────────────┐
│ 🚨 EXPIRE AUJOURD'HUI (Icon + Label)
├────────────────────────────────────┤
│  [Circular Car Image]              │
│  Brand Model • Registration        │
│  "Réservation expire aujourd'hui"  │
├────────────────────────────────────┤
│ 👤 Client Name    📞 Phone Number │
│                                    │
│ Départ: 2026-05-06                │
│ Durée: 5 jour(s)                  │
│ Montant Total: 50,000 DA           │
├────────────────────────────────────┤
│    [➜ View Details Button]        │
└────────────────────────────────────┘
```

---

## Testing

### Create Today Alert
```
1. Go to Reservations
2. Create new reservation
3. Set Return Date = Today (2026-05-06)
4. Set Status = Active or Confirmed
5. Go to Dashboard
6. Should see 🚨 card with red color
```

### Create Tomorrow Alert
```
1. Go to Reservations
2. Create new reservation
3. Set Return Date = Tomorrow (2026-05-07)
4. Set Status = Active or Confirmed
5. Go to Dashboard
6. Should see 🔔 card with orange color
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/utils/reservationAlerts.ts` | Added `expiring_today` type, new alert logic |
| `src/components/ReservationAlertCard.tsx` | Added display cases for both alert types |

---

## Browser Notifications

✅ **Enabled** for both alert types at 9:00 AM:
- "La réservation de {client} pour {car} expire aujourd'hui!"
- "La réservation de {client} pour {car} expire demain!"

---

## Language Support

| Language | Today | Tomorrow |
|----------|-------|----------|
| **French** | Expire Aujourd'hui | Expire Demain |
| **Arabic** | الحجز ينتهي اليوم | الحجز ينتهي غدا |

---

## Severity Priority

1. **expiring_today** → 🔴 CRITICAL (🚨)
2. **expiring_tomorrow** → 🟠 HIGH (🔔)
3. Pre-start/Pre-end → 🟡 MEDIUM (🚗/📅)

Lower priority alerts will not show if higher priority alerts exist (one alert per reservation).

---

## Important Notes

- ✅ Alert checks run in order: Today → Tomorrow → Departure → Return → Overdue → Late
- ✅ First matching condition wins (prevents multiple alerts per reservation)
- ✅ Both use same styling as "Départ Demain" card
- ✅ Cards show when dashboard loads + refreshes every minute
- ✅ Notifications sent at 9:00 AM with deduplication
- ✅ Fully bilingual (FR/AR)
- ✅ Responsive design (mobile/tablet/desktop)

---

## Example Output

On Dashboard with mixed reservations:

```
🚨 Expire Aujourd'hui
└─ Toyota Corolla (ABC-123)
   "Réservation expire aujourd'hui à minuit!"
   Client: Mohamed Ali
   
🔔 Expire Demain  
└─ Fiat Panda (XYZ-789)
   "Réservation expire demain 07-05-2026"
   Client: Fatima Bensaïd

🚗 Départ Demain
└─ Renault Clio (MNO-456)
   "Réservation commence demain"
   Client: Ahmed Boumediene
```

---

## Status

✅ **Implementation Complete**
✅ **No TypeScript Errors**
✅ **Tested Alert Logic**
✅ **Cards Display Properly**
✅ **Bilingual Supported**
✅ **Ready to Deploy**
