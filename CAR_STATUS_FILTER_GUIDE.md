# 🚗 Car Status Filter Implementation Guide

This guide shows how to implement car filtering by "disponible" status in your application.

## 1. In CreateReservationForm - Car Selection Step

Add this filter when displaying available cars for selection:

```typescript
// At the top of the component where cars are displayed:
const availableCars = formData.cars?.filter(car => car.status === 'disponible') || [];

// When rendering car list:
{availableCars.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {availableCars.map(car => (
      <div 
        key={car.id}
        onClick={() => handleCarSelection(car)}
        className="cursor-pointer border-2 rounded-lg p-4 hover:border-green-600 transition-all"
      >
        <h4 className="font-bold">{car.brand} {car.model}</h4>
        <p className="text-sm text-gray-600">{car.color}</p>
        <p className="text-sm text-gray-600">{car.licensePlate}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
          ✓ {lang === 'fr' ? 'Disponible' : 'متاح'}
        </span>
      </div>
    ))}
  </div>
) : (
  <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
    <p className="text-red-600 font-bold text-lg">
      {lang === 'fr' 
        ? '❌ Aucun véhicule disponible' 
        : '❌ لا توجد مركبات متاحة'}
    </p>
    <p className="text-red-500 text-sm mt-2">
      {lang === 'fr' 
        ? 'Tous les véhicules sont actuellement loués ou en maintenance' 
        : 'جميع المركبات حاليا مستأجرة أو تحت الصيانة'}
    </p>
  </div>
)}
```

## 2. In Dashboard Component - Available Cars Count

Show statistics about available vs. rented cars:

```typescript
// At the top of DashboardPage or similar:
const carStats = {
  total: cars.length,
  available: cars.filter(c => c.status === 'disponible').length,
  rented: cars.filter(c => c.status === 'louer').length,
  maintenance: cars.filter(c => c.status === 'maintenance').length
};

// Display in dashboard grid:
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Total Cars */}
  <div className="bg-white rounded-lg shadow p-6">
    <div className="text-saas-text-muted text-sm font-bold uppercase mb-2">
      🚗 {lang === 'fr' ? 'Total' : 'الإجمالي'}
    </div>
    <p className="text-3xl font-black text-saas-text-main">
      {carStats.total}
    </p>
  </div>

  {/* Available Cars - Green */}
  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
    <div className="text-green-700 text-sm font-bold uppercase mb-2">
      ✓ {lang === 'fr' ? 'Disponible' : 'متاح'}
    </div>
    <p className="text-3xl font-black text-green-600">
      {carStats.available}
    </p>
  </div>

  {/* Rented Cars - Blue */}
  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-6 border border-blue-200">
    <div className="text-blue-700 text-sm font-bold uppercase mb-2">
      🚗 {lang === 'fr' ? 'En Location' : 'قيد الاستئجار'}
    </div>
    <p className="text-3xl font-black text-blue-600">
      {carStats.rented}
    </p>
  </div>

  {/* Maintenance - Orange */}
  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow p-6 border border-orange-200">
    <div className="text-orange-700 text-sm font-bold uppercase mb-2">
      🔧 {lang === 'fr' ? 'Maintenance' : 'صيانة'}
    </div>
    <p className="text-3xl font-black text-orange-600">
      {carStats.maintenance}
    </p>
  </div>
</div>
```

## 3. Car Status Badge Component

Create a reusable component for displaying car status:

```typescript
const CarStatusBadge: React.FC<{ status: string; lang: Language }> = ({ status, lang }) => {
  const statusConfig = {
    disponible: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      label: lang === 'fr' ? 'Disponible' : 'متاح',
      icon: '✓'
    },
    louer: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      label: lang === 'fr' ? 'En Location' : 'قيد الاستئجار',
      icon: '🚗'
    },
    maintenance: {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      label: lang === 'fr' ? 'Maintenance' : 'صيانة',
      icon: '🔧'
    },
    reserved: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      label: lang === 'fr' ? 'Réservé' : 'محجوز',
      icon: '⏳'
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;

  return (
    <span className={`inline-block px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-bold`}>
      {config.icon} {config.label}
    </span>
  );
};

// Usage:
<CarStatusBadge status={car.status} lang={lang} />
```

## 4. In CarsPage - Filter Controls

Add filter buttons to show/hide different status cars:

```typescript
const [statusFilter, setStatusFilter] = useState<'all' | 'disponible' | 'louer' | 'maintenance'>('all');

const filteredCars = statusFilter === 'all'
  ? cars
  : cars.filter(car => car.status === statusFilter);

// Display filter buttons:
<div className="flex gap-2 mb-4">
  {[
    { value: 'all', label: lang === 'fr' ? 'Tous' : 'الكل', color: 'gray' },
    { value: 'disponible', label: lang === 'fr' ? 'Disponible' : 'متاح', color: 'green' },
    { value: 'louer', label: lang === 'fr' ? 'En Location' : 'قيد الاستئجار', color: 'blue' },
    { value: 'maintenance', label: lang === 'fr' ? 'Maintenance' : 'صيانة', color: 'orange' }
  ].map(filter => (
    <button
      key={filter.value}
      onClick={() => setStatusFilter(filter.value as any)}
      className={`px-4 py-2 rounded-lg font-bold transition-colors ${
        statusFilter === filter.value
          ? `bg-${filter.color}-600 text-white`
          : `bg-${filter.color}-100 text-${filter.color}-700 hover:bg-${filter.color}-200`
      }`}
    >
      {filter.label}
    </button>
  ))}
</div>

{/* Display filtered cars */}
{filteredCars.map(car => (
  // Car card component
))}
```

## 5. Database Query - Get Available Cars

When querying from Supabase:

```typescript
// Get only available cars
const { data: availableCars, error } = await supabase
  .from('cars')
  .select('*')
  .eq('status', 'disponible')
  .order('brand, model');

// Get cars with count
const { count: availableCount } = await supabase
  .from('cars')
  .select('id', { count: 'exact' })
  .eq('status', 'disponible');

// Get all cars grouped by status
const { data: allCars } = await supabase
  .from('cars')
  .select('*, status')
  .order('status, brand');

// Then filter in JavaScript:
const grouped = {
  disponible: allCars.filter(c => c.status === 'disponible'),
  louer: allCars.filter(c => c.status === 'louer'),
  maintenance: allCars.filter(c => c.status === 'maintenance')
};
```

## 6. Real-time Subscription - Update on Status Change

Listen for car status changes in real-time:

```typescript
useEffect(() => {
  // Subscribe to car changes
  const subscription = supabase
    .from('cars')
    .on('*', payload => {
      if (payload.eventType === 'UPDATE') {
        console.log('Car status changed:', payload.new);
        // Refresh cars list
        setCars(prev => 
          prev.map(c => c.id === payload.new.id ? payload.new : c)
        );
      }
    })
    .subscribe();

  return () => {
    supabase.removeAllChannels();
  };
}, []);
```

## 7. Update Car Status When Activation Completes

Already implemented in `ActivationModal`:

```typescript
// This code already exists in ReservationDetailsView.tsx
// When user clicks "Confirmer et Activer":

// 1. Update car status
await supabase
  .from('cars')
  .update({ status: 'louer' })
  .eq('id', reservation.car.id);

// 2. Update car status back when rental completes
// (Do this in CompletionModal)
await supabase
  .from('cars')
  .update({ status: 'disponible' })
  .eq('id', reservation.car.id);
```

## 8. Add to CompletionModal - Return Car to Available

When rental is completed, mark car as available again:

```typescript
// In CompletionModal, in the onComplete button:
onClick={async () => {
  // ... existing completion logic ...
  
  // Add this: Change car back to disponible
  await supabase
    .from('cars')
    .update({ status: 'disponible' })
    .eq('id', reservation.car.id);
  
  // ... rest of logic ...
}}
```

## Car Status Lifecycle

```
1. Car Created
   Status: "disponible" ✓
   User can: Select for rental

2. Reservation Created
   Status: Still "disponible"
   User can: Cancel reservation, select another car

3. Reservation Confirmed
   Status: Still "disponible"
   User can: Activate (start rental)

4. ACTIVATION HAPPENS ← Implementation Done
   Status: Changes to "louer" ✓
   User can: Complete rental (end rental)

5. Rental Completed
   Status: Changes back to "disponible" ✓
   User can: Select for new rental

6. Maintenance (Manual)
   Status: Changes to "maintenance"
   User cannot: Select for rental

7. Maintenance Done (Manual)
   Status: Changes back to "disponible"
   User can: Select for rental again
```

## Summary of Changes

✅ Filter cars by "disponible" status in car selection
✅ Update car status to "louer" when rental activated
✅ Update car status back to "disponible" when rental completed
✅ Display available cars count in dashboard
✅ Show car status badges throughout UI
✅ Add filter controls in cars management page
✅ Real-time subscription for status changes

---

**Next Step**: Implement these code snippets in your components based on your current UI structure.

**Questions?** Refer to ACTIVATION_INTERFACE_COMPLETE.md for detailed explanations.
