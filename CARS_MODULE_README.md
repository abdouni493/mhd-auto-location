# Cars Module Implementation

This document explains the complete Cars module implementation for the LuxDrive car rental application using Supabase.

## Overview

The Cars module provides full CRUD operations for managing cars in the rental system, including image upload functionality using Supabase Storage.

## Database Setup

### 1. Create the Cars Table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  plate_number TEXT NOT NULL UNIQUE,
  price_per_day NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to perform all operations
CREATE POLICY "Allow authenticated users to manage cars" ON cars
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index on plate_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_cars_plate_number ON cars(plate_number);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
```

### 2. Storage Bucket

The module uses a Supabase storage bucket named `cars` for storing vehicle images. Make sure this bucket exists and is configured for public access.

## Environment Variables

Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=https://tjyqmxiqeegcnvopibyb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqeXFteGlxZWVnY252b3BpYnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4OTg1MjIsImV4cCI6MjA4ODQ3NDUyMn0.7-6qvX4F3oebYm-W1bBl6SsKQf-A79bc1PP7PhpQYcQ
```

## File Structure

```
src/
├── supabase.ts                    # Supabase client configuration
├── services/
│   ├── uploadCarImage.ts          # Image upload service
│   └── carService.ts              # Car CRUD operations
└── components/
    ├── AddCarForm.tsx             # Form for adding new cars
    └── CarsList.tsx               # Display list of cars
```

## Services

### uploadCarImage.ts

Handles image upload to Supabase Storage:

```typescript
import { uploadCarImage } from '../services/uploadCarImage'

const result = await uploadCarImage(file, carId)
// Returns: { success: boolean, url?: string, error?: string }
```

### carService.ts

Provides CRUD operations for cars:

```typescript
import { addCar, getCars, getCar, updateCar, deleteCar } from '../services/carService'

// Add a new car
const result = await addCar({
  brand: 'Toyota',
  model: 'Camry',
  year: 2020,
  plate_number: 'ABC-123',
  price_per_day: 50,
  status: 'available',
  image: file // Optional File object
})

// Get all cars
const cars = await getCars()

// Get single car
const car = await getCar('car-id')

// Update car
const updated = await updateCar('car-id', { status: 'rented' })

// Delete car
await deleteCar('car-id')
```

## Components

### AddCarForm

A complete form component for adding new cars with image upload:

```tsx
import AddCarForm from './components/AddCarForm'

<AddCarForm
  onCarAdded={() => console.log('Car added!')}
  onClose={() => setShowForm(false)}
/>
```

Features:
- Brand, model, year, plate number, price inputs
- Status dropdown (available, rented, maintenance, unavailable)
- Image upload with preview
- Form validation
- Loading states and error handling

### CarsList

Displays a grid of cars with their images:

```tsx
import CarsList from './components/CarsList'

<CarsList />
```

Features:
- Responsive grid layout
- Car images with fallback for missing images
- Status badges with color coding
- Add new car button
- Loading and error states

## Usage Example

Here's how to integrate the Cars module into your application:

```tsx
import React, { useState } from 'react'
import CarsList from './components/CarsList'
import AddCarForm from './components/AddCarForm'

const CarsPage: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div>
      <CarsList />
      {showAddForm && (
        <div className="modal-overlay">
          <AddCarForm
            onCarAdded={() => {
              // Refresh data or show success message
              setShowAddForm(false)
            }}
            onClose={() => setShowAddForm(false)}
          />
        </div>
      )}
    </div>
  )
}

export default CarsPage
```

## Security Notes

- Row Level Security (RLS) is enabled on the cars table
- Only authenticated users can perform operations
- Images are stored in Supabase Storage with public access
- File uploads are validated for type and size (max 5MB)

## Error Handling

All service functions return a result object with `success`, optional `data`, and optional `error` fields:

```typescript
const result = await addCar(carData)
if (result.success) {
  console.log('Car added:', result.car)
} else {
  console.error('Error:', result.error)
}
```

## Next Steps

1. Execute the SQL script in your Supabase dashboard
2. Test the image upload functionality
3. Integrate the components into your existing CarsPage
4. Add authentication if not already implemented
5. Consider adding image optimization and resizing