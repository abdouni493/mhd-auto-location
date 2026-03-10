# 🗄️ Database Setup Instructions

## ⚠️ Important: Setup Required for Reservations System

The PlannerPage is now connected to the database, but the database tables need to be created first.

## 📋 Quick Setup Guide

### Step 1: Open Supabase Console
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Go to **SQL Editor** (left sidebar)

### Step 2: Execute SQL Setup
1. Click **"New Query"**
2. Copy all the SQL from: `reservations_database_setup.sql` (in the root directory)
3. Paste it into the SQL editor
4. Click **"Run"** button

### Step 3: Verify Setup
After execution, you should see:
- ✅ 6 new tables created:
  - `reservations`
  - `vehicle_inspections`
  - `inspection_checklist_items`
  - `inspection_responses`
  - `reservation_services`
  - `payments`

- ✅ 36 pre-populated checklist items
- ✅ RLS (Row Level Security) policies
- ✅ Storage bucket policies

### Step 4: Test Connection
1. Return to the application
2. Navigate to **Planner** page
3. You should see:
   - ✅ Loading spinner disappears
   - ✅ Empty state if no reservations yet
   - ✅ Any existing reservations displayed

---

## 🔧 If You Get an Error

### Error: "Database setup required"
**Solution:** Execute the SQL setup as described above.

### Error: "relation does not exist"
**Solution:** Make sure you ran the complete SQL file, not just part of it.

### Error: "Permission denied"
**Solution:** Ensure your Supabase user has the proper permissions (usually default for project owner).

---

## 📄 SQL File Location
- Path: `/reservations_database_setup.sql`
- Size: ~3KB
- Type: PostgreSQL SQL

---

## ✅ What's Included in the SQL Setup

### Tables Created:
1. **reservations** - Main reservation data
2. **vehicle_inspections** - Inspection records with photos/signatures
3. **inspection_checklist_items** - Checklist items (36 default + custom)
4. **inspection_responses** - Checklist answers per inspection
5. **reservation_services** - Additional services for reservations
6. **payments** - Payment records

### Security:
- RLS policies for authenticated access
- Storage bucket policies for file uploads
- Proper constraints and indexes
- Cascading deletes

### Pre-populated Data:
- 36 default inspection checklist items
- Organized by categories (security, equipment, comfort, cleanliness)

---

## 🚀 Next Steps After Setup

Once the database is set up:

1. **Create Reservations:** Click "Nouvelle Réservation" button
2. **View Reservations:** See all reservations in the Planner
3. **Manage Inspections:** Database-driven checklists
4. **Track Payments:** Payment history per reservation

---

## 📞 Need Help?

- Check the `COMPLETE_RESERVATION_SETUP.md` for detailed information
- Check the `QUICK_REFERENCE.md` for troubleshooting
- Review `SYSTEM_ARCHITECTURE_DIAGRAMS.md` for schema overview

---

**Status:** ✅ Application ready, ⏳ Waiting for database setup

Once SQL is executed in Supabase, refresh the page and everything will work!
