# Conditions Personalizer - User Guide

## Feature Overview

The **Conditions Personalizer** allows you to customize rental conditions directly from the reservation interface. When a user clicks on the "Conditions" button while previewing a contract, they can now:

1. **View and Edit Conditions**: See all rental terms and conditions
2. **Add New Conditions**: Add custom conditions specific to this reservation
3. **Edit Existing Conditions**: Modify any condition text
4. **Delete Conditions**: Remove conditions that don't apply
5. **Reorder Conditions**: Move conditions up or down
6. **Format Conditions**: Customize font size, color, and background
7. **Preview**: See how the conditions will look before saving
8. **Save**: Store customized conditions with the reservation

---

## How to Use

### Step 1: Access the Conditions Personalizer

1. Go to **Planner Page**
2. Select a reservation
3. Click the **Print** button (🖨️)
4. Click **"Personnaliser les Conditions"** (French) or **"تخصيص الشروط"** (Arabic)

### Step 2: View Conditions List

The left panel shows all current conditions as a numbered list:
- Default conditions are loaded from the database
- Each condition is displayed with edit and delete buttons

### Step 3: Edit a Condition

1. Click on any condition in the list
2. Click the **Edit (✎)** button
3. Modify the text in the textarea
4. Click **OK** to save or **Cancel** to discard changes

### Step 4: Add a New Condition

1. Click the **"+ Ajouter une condition"** button (green dashed box)
2. Enter the new condition text
3. Click **Ajouter** to add it to the list
4. Click **Annuler** to cancel

### Step 5: Delete a Condition

1. Click on the condition you want to remove
2. Click the **Delete (🗑️)** button
3. The condition is immediately removed

### Step 6: Reorder Conditions

1. Click on a condition
2. Use the **⬆ Haut** (Up) or **⬇ Bas** (Down) buttons that appear
3. The condition will move in the list

### Step 7: Format Conditions

The right panel has formatting options:

**Font Size:**
- Slider from 10px to 18px
- Applies to condition text preview

**Text Color:**
- Color picker for condition text
- Default: #333333 (dark gray)

**Background Color:**
- Color picker for background
- Default: #ffffff (white)

### Step 8: Preview Changes

- The right panel shows a live preview
- Select any condition to preview it with applied formatting
- Shows how it will appear when printed

### Step 9: Save Conditions

1. Click the blue **"Sauvegarder les conditions"** button (bottom right)
2. The system saves to the database:
   - Stores with the reservation
   - Uses the formatting from the editor
   - All conditions joined with newlines

### Step 10: Close

Click **"Fermer"** (Close) to exit the personalizer

---

## Formatting Guidelines

### Font Size
- **10-12px**: Good for dense text, many conditions
- **13-14px**: Standard/recommended size
- **15-18px**: Large print, easier to read
- Choose based on how many conditions you have

### Text Color
- **#000000** (Black): Standard, high contrast
- **#333333** (Dark Gray): Softer, still readable
- **#1a365d** (Dark Blue): Professional
- Avoid very light colors - they won't be readable when printed

### Background Color
- **#ffffff** (White): Standard, clean appearance
- **#f5f5f5** (Light Gray): Subtle background
- **#fff9e6** (Light Yellow): Highlights important conditions
- **#e6f2ff** (Light Blue): Professional appearance

---

## Default Conditions

By default, the system loads these conditions:

1. **السن** (Age): Driver must be 20+ with 2+ years license
2. **جواز السفر** (Passport): Passport deposit + insurance required
3. **الوقود** (Fuel): Customer pays for fuel
4. **الدفع** (Payment): Cash payment at handover
5. **النظافة** (Cleanliness): Return car clean or pay cleaning fee

More conditions can be added during personalization.

---

## Keyboard Shortcuts

- **Enter** in Add Condition textarea: Focus Add button
- **Escape**: Would close (browser default)

---

## Database Storage

Conditions are saved to the **reservations** table:

```sql
UPDATE reservations
SET conditions_text = 'condition1\ncondition2\ncondition3'
WHERE id = 'reservation_id';
```

### Format
- Conditions joined with newline (`\n`)
- Text format (not HTML)
- Preserves all special characters

---

## API Integration

The component saves to Supabase:

```typescript
await supabase
  .from('reservations')
  .update({ conditions_text: conditionsText })
  .eq('id', reservationId);
```

---

## Error Handling

### If conditions won't save:
1. Check Supabase connection
2. Verify reservation ID is valid
3. Ensure user has permission to edit
4. Look at browser console for errors

### If conditions won't load:
1. Reservation might not exist
2. Check database for conditions_text column
3. Reload the page

---

## Printing with Custom Conditions

1. After personalizing conditions
2. Click **"Sauvegarder les conditions"** to save
3. Close the personalizer
4. Use the main print function
5. Custom conditions will be included in the printed document

---

## Language Support

The interface supports:
- **French (fr)**: "Personnaliser les Conditions", "Ajouter une condition", etc.
- **Arabic (ar)**: "تخصيص الشروط", "إضافة شرط جديد", etc.

Language switches automatically based on your app's language setting.

---

## Features Summary

✅ Edit existing conditions  
✅ Add new custom conditions  
✅ Delete conditions  
✅ Reorder conditions (move up/down)  
✅ Format with font size, color, background  
✅ Live preview  
✅ Save to database  
✅ Bilingual interface (FR/AR)  
✅ Responsive design  
✅ Animated transitions  

---

## Component Files

- **ConditionsPersonalizer.tsx**: Main component with editor UI
- **PlannerPage.tsx**: Integration point (button opens personalizer)
- **types.ts**: Updated ReservationDetails interface

---

## Example Workflow

1. Create a reservation
2. Go to Planner
3. Select the reservation
4. Click Print → "Personnaliser les Conditions"
5. Add: "Maximum 300 km/day"
6. Edit: Change color to #1a365d (blue)
7. Add: "Valid insurance required"
8. Delete default condition if not needed
9. Click Save
10. Close and print

Conditions now appear in the contract with your custom text and formatting!

---

## Tips & Tricks

- **Reuse Conditions**: You can copy text from one reservation's conditions to another
- **Batch Edit**: Edit multiple conditions before saving (one save operation)
- **Color Coding**: Use different colors for:
  - Red (#ff4444): Critical conditions
  - Blue (#1a365d): Standard conditions
  - Green (#228822): Optional/bonus terms
- **Font Sizing**: Larger font for main points, smaller for details
- **Preview First**: Always check preview before saving for long text

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Conditions not saving | Check internet connection, try again |
| Personalizer won't open | Ensure a valid reservation is selected |
| Can't see preview | Make sure at least one condition is selected |
| Text too small/large | Adjust font size slider to 13-14px |
| Conditions disappear | Reload page and try again |

---

## Version Info

- **Created**: March 2026
- **Component**: ConditionsPersonalizer.tsx
- **Integration**: PlannerPage.tsx
- **Language Support**: French (fr), Arabic (ar)

