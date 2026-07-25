import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Car, Language, VehicleExpense } from '../types';
import { MaintenanceCard } from './MaintenanceCard';
import { CarModal } from './CarModal';
import { VehicleExpenseModal } from './VehicleExpenseModal';
import { MaintenanceStatus, getMaintenanceStatus } from '../services/maintenanceService';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, RefreshCw, Filter } from 'lucide-react';
import { getCars, updateCar } from '../services/carService';
import { addVehicleExpense, updateVehicleExpense, getVehicleExpenses } from '../services/expenseService';

interface MaintenancePageProps {
  lang: Language;
  isAuthLoading?: boolean;
  user?: any;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  lang,
  isAuthLoading = false,
  user = null,
}) => {
  const location = useLocation();
  const [cars, setCars] = useState<Car[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'warning' | 'success'>('all');
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedExpenseType, setSelectedExpenseType] = useState<'vidange' | 'chaine' | 'assurance' | 'controle' | 'autre'>('vidange');
  const [prefilledExpense, setPrefilledExpense] = useState<Partial<VehicleExpense> | undefined>(undefined);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);

  const isRtl = lang === 'ar';

  /**
   * Ouvre TOUJOURS le formulaire en CRÉATION.
   *
   * Le gabarit renvoyé ne porte jamais d'`id` : la fenêtre affiche donc
   * « Nouvelle dépense » et l'enregistrement insère une nouvelle ligne. Le
   * gabarit est reconstruit à chaque ouverture, ce qui évite de retrouver les
   * valeurs de la dépense précédemment saisie.
   */
  const openNewExpense = (
    car: Car,
    type: 'vidange' | 'chaine' | 'assurance' | 'controle' | 'autre'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const isMileageBased = type === 'vidange' || type === 'chaine';

    setSelectedCar(car);
    setSelectedExpenseType(type);
    setExpenseError(null);
    setPrefilledExpense({
      // Pas d'`id` : création, jamais édition.
      carId: car.id,
      type,
      cost: 0,
      note: '',
      date: today,
      currentMileage: car.mileage,
      ...(isMileageBased
        ? { nextVidangeKm: 10000 }
        : { expirationDate: inOneYear }),
    });
    setIsExpenseModalOpen(true);
  };

  // Load cars data
  const loadCarsData = async () => {
    try {
      setLoading(true);
      const result = await getCars();
      if (result.success && result.cars) {
        const mappedCars: Car[] = result.cars.map(dbCar => ({
          id: dbCar.id || '',
          brand: dbCar.brand,
          model: dbCar.model,
          registration: dbCar.plate_number,
          year: dbCar.year,
          color: dbCar.color || 'Premium',
          vin: dbCar.vin || '',
          energy: dbCar.energy || 'Essence',
          transmission: dbCar.transmission || 'Automatique',
          seats: dbCar.seats || 5,
          doors: dbCar.doors || 4,
          priceDay: Math.round(Number(dbCar.price_per_day)),
          priceWeek: Math.round(Number(dbCar.price_week || dbCar.price_per_day * 2)),
          priceMonth: Math.round(Number(dbCar.price_month || dbCar.price_per_day * 4)),
          deposit: Math.round(Number(dbCar.deposit || dbCar.price_per_day * 2)),
          images: dbCar.image_url ? [dbCar.image_url] : ['https://picsum.photos/seed/car/400/300'],
          mileage: dbCar.mileage || 0,
          status: (dbCar.status || 'disponible') as 'disponible' | 'louer' | 'maintenance' | 'available',
        }));

        setCars(mappedCars);

        // Load all vehicle expenses
        const expensesResult = await getVehicleExpenses();
        const allExpenses = expensesResult.expenses || [];
        console.log(`[MaintenancePage] Loaded ${allExpenses.length} total expenses`);

        // Load maintenance data with expenses
        const maintenanceStatus = await getMaintenanceStatus(mappedCars, allExpenses);
        setMaintenanceData(maintenanceStatus);
      }
    } catch (err) {
      console.error('Error loading cars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;

    loadCarsData();
  }, [user, isAuthLoading]);

  // Handle navigation from dashboard alert
  useEffect(() => {
    const state = location.state as any;
    // Guard: only proceed if state has all required fields and they are non-empty strings
    if (
      state &&
      typeof state.selectedCarId === 'string' && state.selectedCarId.length > 0 &&
      typeof state.expenseType === 'string' && state.expenseType.length > 0 &&
      state.showExpenseModal === true
    ) {
      // Find the car with the given ID
      const car = cars.find(c => c.id === state.selectedCarId);
      if (car) {
        // Même chemin que les boutons de la carte : gabarit neuf, jamais un
        // reste de la saisie précédente.
        openNewExpense(car, state.expenseType);
        // Clear the location state immediately to prevent re-triggering
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, cars]);

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setIsCarModalOpen(true);
  };

  const handleSaveCar = async (carData: Partial<Car>) => {
    try {
      if (selectedCar) {
        const updateData = {
          brand: carData.brand || selectedCar.brand,
          model: carData.model || selectedCar.model,
          year: carData.year || selectedCar.year,
          plate_number: carData.registration || selectedCar.registration,
          price_per_day: carData.priceDay || selectedCar.priceDay,
          status: carData.status || selectedCar.status || 'disponible',
          image_url: carData.images?.[0] || selectedCar.images[0],
          color: carData.color || selectedCar.color,
          vin: carData.vin || selectedCar.vin,
          energy: carData.energy || selectedCar.energy,
          transmission: carData.transmission || selectedCar.transmission,
          seats: carData.seats || selectedCar.seats,
          doors: carData.doors || selectedCar.doors,
          price_week: carData.priceWeek || selectedCar.priceWeek,
          price_month: carData.priceMonth || selectedCar.priceMonth,
          deposit: carData.deposit || selectedCar.deposit,
          mileage: carData.mileage || selectedCar.mileage,
        };
        const result = await updateCar(selectedCar.id, updateData);
        if (result.success) {
          setCars(prev =>
            prev.map(c =>
              c.id === selectedCar.id ? { ...c, ...carData } : c
            )
          );
          // Reload maintenance data
          await loadCarsData();
        }
      }
      setIsCarModalOpen(false);
      setSelectedCar(null);
    } catch (err) {
      console.error('Error updating car:', err);
    }
  };

  const handleVidangeClick = (car: Car) => openNewExpense(car, 'vidange');
  const handleChaineClick = (car: Car) => openNewExpense(car, 'chaine');
  const handleAssuranceClick = (car: Car) => openNewExpense(car, 'assurance');
  const handleControleClick = (car: Car) => openNewExpense(car, 'controle');

  /**
   * Enregistre une NOUVELLE dépense en base (table `vehicle_expenses`).
   * On reprend le véhicule et le type réellement choisis dans le formulaire —
   * l'utilisateur peut les changer après l'ouverture.
   */
  const handleSaveExpense = async (expenseData: any) => {
    const carId = expenseData.carId || selectedCar?.id;
    if (!carId) {
      setExpenseError(lang === 'fr' ? 'Sélectionnez un véhicule.' : 'اختر مركبة.');
      return;
    }

    setSavingExpense(true);
    setExpenseError(null);
    try {
      const expense = {
        carId,
        type: expenseData.type || selectedExpenseType,
        cost: Number(expenseData.cost) || 0,
        date: expenseData.date || new Date().toISOString().split('T')[0],
        note: expenseData.note || '',
        currentMileage: expenseData.currentMileage ?? selectedCar?.mileage ?? 0,
        nextVidangeKm: expenseData.nextVidangeKm || null,
        expirationDate: expenseData.expirationDate || null,
        expenseName: expenseData.expenseName || '',
        oilFilterChanged: expenseData.oilFilterChanged || false,
        airFilterChanged: expenseData.airFilterChanged || false,
        fuelFilterChanged: expenseData.fuelFilterChanged || false,
        acFilterChanged: expenseData.acFilterChanged || false,
      };

      const result = await addVehicleExpense(expense);
      if (!result.success) {
        throw new Error(result.error || 'Insertion refusée');
      }

      // Recharge la liste complète des dépenses depuis la base : les cartes de
      // maintenance reflètent immédiatement la nouvelle ligne enregistrée.
      await loadCarsData();
      setIsExpenseModalOpen(false);
      setSelectedCar(null);
      setPrefilledExpense(undefined);
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setExpenseError(
        (lang === 'fr' ? "La dépense n'a pas pu être enregistrée : " : 'تعذر حفظ النفقة: ')
        + (err?.message || 'erreur inconnue')
      );
    } finally {
      setSavingExpense(false);
    }
  };

  const filteredData = maintenanceData.filter(item => {
    const matchesSearch =
      item.car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.car.registration.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;

    // Check if car has any item matching the status
    const items = [
      { type: 'vidange', value: item.vidange.kmRemaining, threshold: 1000 },
      { type: 'chaine', value: item.chaine.kmRemaining, threshold: 1000 },
      { type: 'assurance', value: item.assurance.daysRemaining, threshold: 30 },
      { type: 'controle', value: item.controleTechnique.daysRemaining, threshold: 30 },
    ];

    return items.some(item => {
      if (item.value === null || item.value === undefined) {
        return filterStatus === 'success';
      }

      if (item.type === 'vidange' || item.type === 'chaine') {
        if (filterStatus === 'critical') return item.value <= 0;
        if (filterStatus === 'warning') return item.value > 0 && item.value <= item.threshold;
        if (filterStatus === 'success') return item.value > item.threshold;
      } else {
        if (filterStatus === 'critical') return item.value < 0;
        if (filterStatus === 'warning') return item.value >= 0 && item.value <= item.threshold;
        if (filterStatus === 'success') return item.value > item.threshold;
      }
    });
  });

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-2xl border border-saas-border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-saas-text-main tracking-tighter uppercase flex items-center gap-3">
            🔧 {lang === 'fr' ? 'Maintenance' : 'الصيانة'}
          </h1>
          <p className="text-saas-primary-via font-bold text-[10px] uppercase tracking-[0.3em]">
            {lang === 'fr' ? 'Suivi complet de la maintenance et des services' : 'المتابعة الشاملة للصيانة والخدمات'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-saas-text-muted group-focus-within:text-saas-primary-via transition-colors" size={18} />
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher un véhicule...' : 'بحث عن مركبة...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-saas-bg border border-saas-border rounded-xl outline-none focus:border-saas-primary-via w-full sm:w-80 transition-all font-medium text-sm shadow-sm"
            />
          </div>
          <button
            onClick={loadCarsData}
            className="btn-saas-secondary px-6 py-3.5 group w-full sm:w-auto justify-center"
            title={lang === 'fr' ? 'Actualiser' : 'تحديث'}
          >
            <RefreshCw size={20} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span className="font-bold uppercase tracking-widest text-xs">
              {lang === 'fr' ? 'Actualiser' : 'تحديث'}
            </span>
          </button>
        </div>
      </div>

      {/* Retour d'enregistrement d'une dépense */}
      <AnimatePresence>
        {savingExpense && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-saas-bg border border-saas-border rounded-2xl p-4"
          >
            <Loader2 className="w-5 h-5 animate-spin text-saas-primary-via shrink-0" />
            <p className="text-sm font-semibold text-saas-text-main">
              {lang === 'fr' ? 'Enregistrement de la dépense…' : 'جاري حفظ النفقة…'}
            </p>
          </motion.div>
        )}
        {expenseError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start justify-between gap-4 bg-red-50 border border-red-200 rounded-2xl p-4"
          >
            <p className="text-sm font-semibold text-red-700">⚠️ {expenseError}</p>
            <button
              onClick={() => setExpenseError(null)}
              className="text-xs font-black uppercase tracking-wider text-red-700 hover:underline cursor-pointer shrink-0"
            >
              {lang === 'fr' ? 'Fermer' : 'إغلاق'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 flex-wrap bg-white p-5 rounded-2xl border border-saas-border shadow-sm"
      >
        <span className="text-xs font-bold text-saas-text-muted uppercase tracking-widest">
          {lang === 'fr' ? 'Filtrer:' : 'تصفية:'}
        </span>
        {(['all', 'critical', 'warning', 'success'] as const).map((status) => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterStatus(status)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
              filterStatus === status
                ? status === 'critical'
                  ? 'bg-red-500/10 text-red-600 border-2 border-red-500 shadow-lg shadow-red-500/20'
                  : status === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 border-2 border-amber-500 shadow-lg shadow-amber-500/20'
                  : status === 'success'
                  ? 'bg-green-500/10 text-green-600 border-2 border-green-500 shadow-lg shadow-green-500/20'
                  : 'bg-saas-primary-via/10 text-saas-primary-via border-2 border-saas-primary-via shadow-lg shadow-saas-primary-via/20'
                : 'bg-saas-bg text-saas-text-muted border-2 border-saas-border hover:border-saas-primary-via/50'
            }`}
          >
            {status === 'all' && '🔄'}
            {status === 'critical' && '🔴'}
            {status === 'warning' && '🟡'}
            {status === 'success' && '🟢'}
            <span>
              {status === 'all' && (lang === 'fr' ? 'Tous' : 'الكل')}
              {status === 'critical' && (lang === 'fr' ? 'Critique' : 'حرج')}
              {status === 'warning' && (lang === 'fr' ? 'Attention' : 'تنبيه')}
              {status === 'success' && (lang === 'fr' ? 'Bon' : 'جيد')}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Content Grid */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-96 bg-white rounded-2xl border border-saas-border"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-saas-primary-via animate-spin" />
            <p className="text-saas-text-muted font-medium">
              {lang === 'fr' ? 'Chargement des véhicules...' : 'جاري تحميل السيارات...'}
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredData.map((maintenance) => (
                <MaintenanceCard
                  key={maintenance.car.id}
                  maintenance={maintenance}
                  lang={lang}
                  onEditCar={handleEditCar}
                  onVidangeClick={handleVidangeClick}
                  onChaineClick={handleChaineClick}
                  onAssuranceClick={handleAssuranceClick}
                  onControleClick={handleControleClick}
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">
                {lang === 'fr' ? 'Aucun véhicule trouvé.' : 'لم يتم العثور على مركبات.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Car Edit Modal */}
      <AnimatePresence>
        {isCarModalOpen && (
          <CarModal
            isOpen={isCarModalOpen}
            onClose={() => {
              setIsCarModalOpen(false);
              setSelectedCar(null);
            }}
            onSave={handleSaveCar}
            car={selectedCar || undefined}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* Expense Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && selectedCar && (
          <VehicleExpenseModal
            // Remonté à chaque ouverture : le formulaire repart toujours vierge.
            key={`${selectedCar.id}-${selectedExpenseType}`}
            isOpen={isExpenseModalOpen}
            onClose={() => {
              setIsExpenseModalOpen(false);
              setSelectedCar(null);
              setPrefilledExpense(undefined);
            }}
            onSave={handleSaveExpense}
            expense={prefilledExpense}
            cars={cars.length > 0 ? cars : [selectedCar]}
            lang={lang}
          />
        )}
      </AnimatePresence>
    </div>
  );
};