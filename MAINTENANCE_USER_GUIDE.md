# Maintenance Module - User Guide 🔧

## Overview
The new Maintenance Module provides a comprehensive vehicle maintenance tracking system with real-time status monitoring, filtering, and quick action capabilities.

## How to Access

### From the Sidebar
1. Look for the **🔧 Maintenance** button in the sidebar (below Vehicles)
2. Click to navigate to the Maintenance dashboard

### URL
Direct link: `/maintenance`

## Main Dashboard Features

### 1. Header Section
- **Title**: "🔧 Maintenance des Véhicules" (FR) / "🔧 صيانة المركبات" (AR)
- **Subtitle**: Description of the module functionality
- **Color**: Gradient blue/purple theme matching SaaS design

### 2. Controls Bar (Sticky Top)

#### Search Bar
- Search by car brand, model, or registration
- Real-time filtering as you type
- Placeholder: "Rechercher..." (FR) / "البحث..." (AR)

#### Filter Buttons
- **🔄 Tous / الكل** (All): Show all cars
- **🔴 Critique / حرج** (Critical): Only show cars with critical maintenance needs
- **🟡 Attention / تنبيه** (Warning): Only show cars needing attention soon
- **🟢 Bon / جيد** (Good): Show well-maintained cars

#### Refresh Button
- Manual data reload
- Shows spinner animation while loading
- Updates all maintenance data

### 3. Car Grid Display

Each car is displayed as a maintenance card with the following layout:

#### Card Header (Image Section)
- Car image with gradient overlay
- Car brand and model in white text
- Registration plate
- Current mileage in KM
- Edit button (top-right corner)

#### Four Maintenance Items
Each item is a clickable button showing:

**🛢️ Vidange (Oil Change)**
- Icon: Oil droplet
- Last date performed
- Kilometers remaining until next service
- Status color indicator
- Click to record new vidange or update

**⛓️ Chaîne (Chain Change)**
- Icon: Chain link
- Last date performed
- Kilometers remaining until next service
- Status color indicator
- Click to record new chain change

**🛡️ Assurance (Insurance)**
- Icon: Shield
- Last date purchased
- Days remaining until expiration
- Status color indicator
- Click to update insurance

**🛠️ Contrôle Technique (Technical Inspection)**
- Icon: Wrench
- Last date performed
- Days remaining until expiration
- Status color indicator
- Click to update inspection

#### Card Footer
- Transmission type (⚙️)
- Energy type (⛽)

## Status Indicators

### Color Coding

#### 🔴 Critical (Red)
- **For KM-based** (Vidange, Chaîne): 0 KM or less remaining
- **For Date-based** (Assurance, Contrôle): Already expired
- **Action**: Immediate attention required

#### 🟡 Warning (Amber)
- **For KM-based** (Vidange, Chaîne): 1-1000 KM remaining
- **For Date-based** (Assurance, Contrôle): 1-30 days remaining
- **Action**: Schedule maintenance soon

#### 🟢 Success (Green)
- **For KM-based** (Vidange, Chaîne): More than 1000 KM remaining
- **For Date-based** (Assurance, Contrôle): More than 30 days remaining
- **Action**: No immediate action needed

## Interactive Actions

### Edit Car Information
**Button**: 🖊️ Edit button in card header

**Action**: 
1. Click the edit button
2. Car edit modal opens
3. Update car mileage, specifications, etc.
4. Changes saved to database
5. Maintenance status automatically recalculated

### Record/Update Maintenance

**For Vidange (Oil Change)**:
1. Click on the "🛢️ Vidange" item
2. Expense modal opens with:
   - Type pre-selected as "Vidange"
   - Car pre-selected
   - Current mileage auto-filled
   - Next service mileage auto-calculated
3. Enter cost, filters changed (optional), notes
4. Save - maintenance record created

**For Chaîne (Chain Change)**:
1. Click on the "⛓️ Chaîne" item
2. Same as Vidange but for chain service
3. Saves chain change record

**For Assurance (Insurance)**:
1. Click on the "🛡️ Assurance" item
2. Expense modal opens with:
   - Type pre-selected as "Assurance"
   - Car pre-selected
   - Expiration date field available
3. Enter cost, expiration date, notes
4. Save - insurance record created

**For Contrôle Technique (Technical Inspection)**:
1. Click on the "🛠️ Contrôle" item
2. Expense modal opens with:
   - Type pre-selected as "Contrôle"
   - Car pre-selected
   - Expiration date field available
3. Enter cost, expiration date, notes
4. Save - inspection record created

## Search & Filter Workflow

### Example 1: Find All Problematic Cars
1. Click **🔴 Critique** filter
2. Dashboard shows only cars with critical maintenance needs
3. Use search to find specific car if needed

### Example 2: Find Specific Car by Model
1. Type "Toyota" in search bar
2. All Toyota cars appear
3. Click filter to see only warnings if needed

### Example 3: View All Cars Needing Insurance Update
1. Click **🟡 Attention** filter
2. See all cars with maintenance needs in next 30 days
3. Click insurance items to update expired or expiring insurance

## Animations & UX

### Card Animations
- Smooth fade-in on page load
- Lift effect on hover (card rises slightly)
- Image zoom on hover
- Smooth transitions between states

### Button Effects
- Scale-up on hover (1.02x)
- Press animation on click
- Status color transitions
- Button state feedback

### Modal Animations
- Fade-in with scale animation
- Smooth slide effects
- Auto-close after successful save
- Error state handling

## Data Persistence

### Automatic Updates
- All changes save to database immediately
- Maintenance status recalculates automatically
- Search and filters work on live data
- Refresh shows latest information

### Data Sync
- Click refresh button to reload from server
- Manual data sync available anytime
- Automatic calculation of:
  - Days until expiration
  - KM remaining
  - Status levels

## Language Support

### French (Français)
- All labels in French
- French date formatting
- LTR layout
- Bilingual expense types

### Arabic (العربية)
- All labels in Arabic
- Arabic date formatting
- RTL layout automatically applied
- Full Arabic interface

## Tips & Best Practices

1. **Regular Updates**: Update mileage after each maintenance to keep data accurate
2. **Set Reminders**: Use status colors to plan maintenance before critical
3. **Bulk Actions**: When multiple cars need same maintenance, search and click each
4. **Filter by Status**: Use filters to prioritize maintenance schedule
5. **Check Before Rental**: Review maintenance status before renting out cars
6. **Plan Ahead**: Monitor warning status to schedule maintenance during low-usage periods

## Troubleshooting

### Cards Not Showing
- Click refresh button to reload data
- Check database connection
- Verify cars have been added to system

### Status Not Updating
- Edit car mileage to force recalculation
- Refresh page
- Check that expense was saved properly

### Modal Not Opening
- Ensure car is selected
- Check for JavaScript console errors
- Try refreshing the page

### Search Not Working
- Ensure search term matches car data
- Try partial matches (e.g., "Toy" for Toyota)
- Use exact registration plate

---

**For Support**: Contact your system administrator
**Last Updated**: May 3, 2026
