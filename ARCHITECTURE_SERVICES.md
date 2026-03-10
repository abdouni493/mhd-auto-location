# Architecture Overview - Services Implementation

## Component Hierarchy

```
CreateReservationForm (Main Form Component)
└── Step5AdditionalServices (Step 5 Component)
    ├── Services Section
    │   ├── Service Cards (Grid)
    │   └── Create Service Modal
    ├── Driver Section
    │   ├── Toggle Switch
    │   ├── Driver Dropdown
    │   └── Selected Driver Card
    ├── Caution Section
    │   └── Amount Input
    └── Summary Section
        └── Total Supplements Display
```

## Data Flow

### Services
```
User Opens Step 5
    ↓
useEffect triggers
    ↓
DatabaseService.getServices()
    ↓
Supabase: SELECT * FROM services WHERE is_active=true
    ↓
Map response to component state
    ↓
Render Service Cards
    ↓
User selects service
    ↓
Update formData.step5.additionalServices
```

### Driver Selection
```
User Clicks Driver Toggle
    ↓
loadDrivers() function called
    ↓
DatabaseService.getDrivers()
    ↓
Supabase: SELECT * FROM workers WHERE type='driver'
    ↓
Map response to drivers state
    ↓
Show Driver Dropdown
    ↓
User clicks driver
    ↓
setSelectedDriver()
    ↓
Render Selected Driver Card
```

### Service Creation
```
User Clicks "Créer un Service"
    ↓
Show Modal Form
    ↓
User fills: Category, Name, Price, Description
    ↓
User clicks "Créer Service"
    ↓
validateForm()
    ↓
DatabaseService.createService()
    ↓
Supabase: INSERT INTO services
    ↓
Add to services state
    ↓
Auto-select service
    ↓
Close modal
    ↓
Update summary
```

## Database Queries

### Get Services
```sql
SELECT * FROM services 
WHERE is_active = true 
ORDER BY created_at DESC
```

### Create Service
```sql
INSERT INTO services 
(category, service_name, description, price, is_active) 
VALUES ($1, $2, $3, $4, true)
RETURNING *
```

### Get Drivers
```sql
SELECT * FROM workers 
WHERE type = 'driver' 
ORDER BY full_name ASC
```

## State Management

### Component State
```typescript
const [services, setServices] = useState<any[]>([])
const [drivers, setDrivers] = useState<any[]>([])
const [loadingServices, setLoadingServices] = useState(true)
const [loadingDrivers, setLoadingDrivers] = useState(false)
const [selectedDriver, setSelectedDriver] = useState<any>(null)
const [driverCaution, setDriverCaution] = useState(0)
const [newService, setNewService] = useState({...})
const [showNewServiceForm, setShowNewServiceForm] = useState(false)
const [showDriverList, setShowDriverList] = useState(false)
```

### Parent Form State
```typescript
formData.step5 = {
  additionalServices: [{
    id: string
    category: string
    name: string
    price: number
    description: string
  }]
}
```

## Error Handling

### Service Loading
```
Error: Try/catch with console.error
Fallback: Empty services array
User sees: "Aucun service disponible" message
```

### Driver Loading
```
Error: Try/catch with console.error
Fallback: Empty drivers array
User sees: "Aucun chauffeur disponible" message
```

### Service Creation
```
Validation: Check name && price > 0
Error: Try/catch + alert
Success: Close modal, update lists, auto-select
```

## Performance Optimizations

1. **Lazy Driver Loading**: Drivers loaded only when toggle activated
2. **Loading States**: Spinner shown while fetching data
3. **Conditional Rendering**: Driver list only shows when expanded
4. **Memoization Ready**: Component can be wrapped with React.memo if needed
5. **Event Delegation**: Click handlers optimized with proper scoping

## Styling System

### Color Scheme
- **Services**: Slate/Green theme
- **Drivers**: Blue/Indigo theme
- **Caution**: Yellow/Orange theme
- **Summary**: Blue/Purple theme

### CSS Classes
- `btn-saas-primary`: Primary button style
- `input-saas`: Input field style
- `label-saas`: Label style
- `bg-gradient-to-r`: Gradient backgrounds
- `rounded-2xl`: Rounded corners (design system)

## Integration Points

### DatabaseService
```typescript
DatabaseService.getServices()
DatabaseService.createService()
DatabaseService.getDrivers()
```

### Form Data
```typescript
formData.step5.additionalServices
// Connected to Step6FinalPricing for price calculation
```

### Navigation
```typescript
handleNext() // Goes to Step 6
handlePrevious() // Goes to Step 4
```

## Dependencies

### Libraries
- React (Hooks: useState, useEffect)
- Framer Motion (Animations)
- Lucide Icons (Icons)
- Supabase Client (Database)

### Custom Services
- DatabaseService (Queries)
- TypeScript Types (AdditionalService, Worker, etc.)

## Response Mapping

### From Supabase services table
```typescript
{
  id: UUID,
  category: 'decoration' | 'equipment' | 'insurance' | 'service',
  service_name: string,
  description: string,
  price: numeric,
  is_active: boolean,
  created_at: timestamp
}
↓ Mapped to ↓
{
  id: string,
  category: string,
  name: string,
  description: string,
  price: number,
  isActive: boolean,
  createdAt: string
}
```

### From Supabase workers table (drivers)
```typescript
{
  id: UUID,
  full_name: string,
  date_of_birth: date,
  phone: string,
  email: string,
  address: string,
  profile_photo: string,
  type: 'driver',
  payment_type: string,
  base_salary: number,
  username: string,
  password: string,
  created_at: timestamp
}
↓ Mapped to ↓
{
  id: string,
  fullName: string,
  dateOfBirth: string,
  phone: string,
  email: string,
  address: string,
  profilePhoto: string,
  type: string,
  paymentType: string,
  baseSalary: number,
  username: string,
  password: string,
  createdAt: string
}
```

## Future Enhancements

1. **Service Categories Filter**: Filter by equipment, insurance, etc.
2. **Driver Rating Display**: Show driver ratings
3. **Service Pricing Tiers**: Volume discounts
4. **Driver Availability**: Check driver calendar
5. **Service Analytics**: Track popular services
6. **Service Images**: Add service photos
7. **Driver Reviews**: Customer reviews system
8. **Bulk Pricing**: Discounts for multiple services

## Deployment Checklist

- [x] SQL migration created
- [x] DatabaseService methods added
- [x] Component updated
- [x] UI/UX implemented
- [x] Loading states added
- [x] Error handling added
- [x] Build tested (0 errors)
- [ ] Execute SQL migration
- [ ] Add test drivers to database
- [ ] User acceptance testing
- [ ] Production deployment
