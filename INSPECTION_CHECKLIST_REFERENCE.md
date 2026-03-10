# Inspection Checklist - Complete List for Database

## Default Checklist Items (Pre-populated in inspection_checklist_items table)

### 🛡️ SÉCURITÉ (Security) - 12 items

1. Ceintures de sécurité
2. Freins
3. Feux
4. Pneus
5. Direction
6. Klaxon
7. Rétroviseurs
8. Essuie-glaces
9. Airbags
10. Triangle de signalisation
11. Extincteur
12. Cric et roue de secours

### 🔧 ÉQUIPEMENTS (Equipment) - 12 items

1. GPS
2. Siège bébé
3. Chaîne neige
4. Câbles de démarrage
5. Kit de premiers secours
6. Radio/CD
7. Climatisation
8. Verrouillage centralisé
9. Ouverture automatique portes
10. Régulateur de vitesse
11. Caméra de recul
12. Capteurs de stationnement

### ✨ CONFORT & PROPRETÉ (Comfort & Cleanliness) - 12 items

1. Sièges
2. Volant
3. Tableau de bord
4. Éclairage intérieur
5. Vitres électriques
6. Rétroviseurs électriques
7. Autoradio
8. Prises USB
9. Cendrier
10. Coffre-fort
11. Tapis de sol
12. Propreté générale

---

## Total: 36 Default Items

All items:
- Stored in `inspection_checklist_items` table
- Can be deleted by users
- Users can add custom items
- Items persist across all reservations
- Organized by category
- Each inspection has responses for selected items

---

## Database Structure

```sql
-- Storage
inspection_checklist_items table
├── id: UUID (Primary Key)
├── category: 'securite' | 'equipements' | 'confort'
├── item_name: text
├── display_order: integer (for sorting)
└── created_at: timestamp

-- Responses per inspection
inspection_responses table
├── id: UUID (Primary Key)
├── inspection_id: FK → vehicle_inspections
├── checklist_item_id: FK → inspection_checklist_items
├── status: boolean (true=OK, false=Issue)
└── note: text (optional)
```

---

## User Interactions

### Default View
- Shows all 36 pre-populated items
- Organized in 3 tabs/sections
- Each item has checkbox

### Customize
**Delete Item:** 
- Click delete on item
- Confirm deletion
- Item removed from database
- Will not appear in future inspections

**Add Custom Item:**
- Click "Add custom item" button
- Select category
- Enter item name
- Save to database
- Appears in that category for all future inspections

---

## Display in UI

### Step 3 - Inspection de Départ

```
✅ Contrôle d'État du Véhicule

[Tab: Sécurité]
☐ Ceintures de sécurité
☐ Freins
☐ Feux
... (12 items total, loaded from DB)

[Tab: Équipements]  
☐ GPS
☐ Siège bébé
... (12 items total, loaded from DB)

[Tab: Confort & Propreté]
☐ Sièges
☐ Volant
... (12 items total, loaded from DB)

[+ Add Custom Item]
```

### Item Interactions
- **Check/Uncheck:** Mark as OK or Issue
- **Delete:** Remove from all future inspections
- **Note:** Add optional note for issues

---

## Implementation Notes

1. **Load items from database, not hardcoded**
   ```typescript
   const items = await ReservationsService.getChecklistItems();
   const grouped = groupByCategory(items);
   ```

2. **Save responses to database**
   ```typescript
   await ReservationsService.saveInspectionResponse(
     inspectionId,
     checklistItemId,
     statusBoolean,
     optionalNote
   );
   ```

3. **Add custom items**
   ```typescript
   await ReservationsService.addCustomChecklistItem(
     'securite',
     'New custom item'
   );
   ```

4. **Delete items**
   ```typescript
   await ReservationsService.deleteChecklistItem(itemId);
   ```

---

## SQL Insert Statement for Default Items

Already included in `reservations_database_setup.sql`:

```sql
INSERT INTO public.inspection_checklist_items (category, item_name, display_order) VALUES
-- Sécurité (1-12)
('securite', 'Ceintures de sécurité', 1),
('securite', 'Freins', 2),
('securite', 'Feux', 3),
('securite', 'Pneus', 4),
('securite', 'Direction', 5),
('securite', 'Klaxon', 6),
('securite', 'Rétroviseurs', 7),
('securite', 'Essuie-glaces', 8),
('securite', 'Airbags', 9),
('securite', 'Triangle de signalisation', 10),
('securite', 'Extincteur', 11),
('securite', 'Cric et roue de secours', 12),
-- Équipements (1-12)
('equipements', 'GPS', 1),
('equipements', 'Siège bébé', 2),
('equipements', 'Chaîne neige', 3),
('equipements', 'Câbles de démarrage', 4),
('equipements', 'Kit de premiers secours', 5),
('equipements', 'Radio/CD', 6),
('equipements', 'Climatisation', 7),
('equipements', 'Verrouillage centralisé', 8),
('equipements', 'Ouverture automatique portes', 9),
('equipements', 'Régulateur de vitesse', 10),
('equipements', 'Caméra de recul', 11),
('equipements', 'Capteurs de stationnement', 12),
-- Confort & Propreté (1-12)
('confort', 'Sièges', 1),
('confort', 'Volant', 2),
('confort', 'Tableau de bord', 3),
('confort', 'Éclairage intérieur', 4),
('confort', 'Vitres électriques', 5),
('confort', 'Rétroviseurs électriques', 6),
('confort', 'Autoradio', 7),
('confort', 'Prises USB', 8),
('confort', 'Cendrier', 9),
('confort', 'Coffre-fort', 10),
('confort', 'Tapis de sol', 11),
('confort', 'Propreté générale', 12);
```

