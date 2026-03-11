import React, { useState, useEffect } from 'react';
import { Language, Car, Agency, Reservation, ReservationStep1, ReservationStep2, AdditionalService } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Upload, FileText, Loader2 } from 'lucide-react';
import { ThankYouPage } from './ThankYouPage';

// services for saving data
import { uploadClientProfilePhoto, uploadClientDocument } from '../../services/uploadClientImage';
import { DatabaseService } from '../../services/DatabaseService';
import { ReservationsService } from '../../services/ReservationsService';

// Algerian Wilayas
const ALGERIAN_WILAYAS = [
  '01 - Adrar',
  '02 - Chlef',
  '03 - Laghouat',
  '04 - Oum El Bouaghi',
  '05 - Batna',
  '06 - Béjaïa',
  '07 - Biskra',
  '08 - Béchar',
  '09 - Blida',
  '10 - Boumerdès',
  '11 - Teboussem',
  '12 - Tlemcen',
  '13 - Tiaret',
  '14 - Tizi Ouzou',
  '15 - Alger (urban)',
  '16 - Alger',
  '17 - Sétif',
  '18 - Saïda',
  '19 - Skikda',
  '20 - Sidi Bel Abbès',
  '21 - Annaba',
  '22 - Guelma',
  '23 - Constantine',
  '24 - Médéa',
  '25 - Mostaganem',
  '26 - M\'sila',
  '27 - Mascara',
  '28 - Ouargla',
  '29 - Oran',
  '30 - El Bayadh',
  '31 - Illizi',
  '32 - Bordj Baji Mokhtar',
  '33 - Ouled Djellal',
  '34 - Béni Abbès',
  '35 - In Salah',
  '36 - In Guezzam',
  '37 - Touggourt',
  '38 - Djanet',
];

interface OrdersPageProps {
  lang: Language;
  cars: Car[];
  agencies: Agency[];
  isLoadingAgencies?: boolean;
  selectedCar?: Car | null;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ lang, cars, agencies, isLoadingAgencies = false, selectedCar: initialCar }) => {
  const [currentStep, setCurrentStep] = useState<'search' | 'step1' | 'step2' | 'step3' | 'step4' | 'success'>(
    initialCar ? 'step1' : 'search'
  );
  const [selectedCar, setSelectedCar] = useState<Car | null>(initialCar || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Step 1 State
  const [step1, setStep1] = useState<ReservationStep1>({
    carId: initialCar?.id || '',
    departureDate: '',
    departureTime: '10:00',
    departureAgency: '',
    returnDate: '',
    returnTime: '10:00',
    returnAgency: '',
    differentReturnAgency: false,
  });

  // Step 2 State
  const [step2, setStep2] = useState<ReservationStep2>({
    photo: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    placeOfBirth: '',
    licenseNumber: '',
    licenseExpiration: '',
    licenseDelivery: '',
    licenseDeliveryPlace: '',
    additionalDocType: 'none',
    additionalDocNumber: '',
    additionalDocDelivery: '',
    additionalDocExpiration: '',
    additionalDocDeliveryAddress: '',
    wilaya: '16 - Alger',
    completeAddress: '',
    scannedDocuments: [],
  });

  // Step 3 State - Services
  const [step3, setStep3] = useState<{ additionalServices: AdditionalService[] }>({
    additionalServices: [],
  });

  // Step 4 State - Pricing
  const [step4, setStep4] = useState({
    advancePercentage: 20,
    notes: '',
  });

  // upload / submission status
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search logic
  const filteredCars = searchQuery.trim()
    ? cars.filter(car =>
        car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.vin.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectCar = (car: Car) => {
    setSelectedCar(car);
    setStep1(prev => ({ ...prev, carId: car.id }));
    setSearchQuery(`${car.brand} ${car.model}`);
    setShowResults(false);
    setCurrentStep('step1');
  };

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setStep1(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setStep1(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStep2(prev => ({ ...prev, [name]: value }));
  };

  const handleStep3Change = (service: AdditionalService) => {
    setStep3(prev => {
      const updated = prev.additionalServices.filter(s => s.id !== service.id);
      const exists = prev.additionalServices.find(s => s.id === service.id);
      if (!exists) {
        updated.push(service);
      }
      return { additionalServices: updated };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingProfile(true);
    try {
      const result = await uploadClientProfilePhoto(file);
      if (result.success && result.url) {
        setStep2(prev => ({ ...prev, photo: result.url }));
      } else {
        setUploadError(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Profile upload error:', err);
      setUploadError('Upload error');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    setUploadError(null);
    const files = Array.from(fileList) as File[];

    for (const file of files) {
      setUploadingDocument(true);
      try {
        const result = await uploadClientDocument(file);
        if (result.success && result.url) {
          setStep2(prev => ({
            ...prev,
            scannedDocuments: [...(prev.scannedDocuments || []), result.url],
          }));
        } else {
          setUploadError(result.error || 'Upload failed');
        }
      } catch (err) {
        console.error('Document upload error:', err);
        setUploadError('Upload error');
      } finally {
        setUploadingDocument(false);
      }
    }
  };

  const removeDocument = (index: number) => {
    setStep2(prev => ({
      ...prev,
      scannedDocuments: prev.scannedDocuments?.filter((_, i) => i !== index) || [],
    }));
  };

  // Calculate days
  const calculateDays = () => {
    if (!step1.departureDate || !step1.returnDate) return 0;
    const start = new Date(step1.departureDate);
    const end = new Date(step1.returnDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const days = calculateDays();
  const totalPrice = selectedCar ? (selectedCar.priceDay * days) : 0;

  // Load services from database
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const dbServices = await DatabaseService.getServices();
        setServices(dbServices);
        setServicesError(null);
      } catch (err) {
        console.error('Error loading services:', err);
        setServices([]);
        setServicesError('Failed to load services');
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, []);

  const isStep1Valid =
    step1.carId &&
    step1.departureDate &&
    step1.departureTime &&
    step1.departureAgency &&
    step1.returnDate &&
    step1.returnTime &&
    (step1.differentReturnAgency ? step1.returnAgency : true);

  const isStep2Valid =
    step2.firstName &&
    step2.lastName &&
    step2.phone &&
    step2.email &&
    step2.licenseNumber &&
    step2.wilaya;

  // when user confirms final step, create client and reservation records
  const handleConfirmReservation = async () => {
    if (!selectedCar) {
      return;
    }
    setIsSubmitting(true);
    setUploadError(null);
    try {
      // build client payload from step2 state
      const clientPayload: any = {
        firstName: step2.firstName,
        lastName: step2.lastName,
        phone: step2.phone,
        email: step2.email,
        dateOfBirth: step2.dateOfBirth,
        placeOfBirth: step2.placeOfBirth,
        idCardNumber: step2.additionalDocType === 'id_card' ? (step2.additionalDocNumber || '') : '',
        licenseNumber: step2.licenseNumber,
        licenseExpirationDate: step2.licenseExpiration,
        licenseDeliveryDate: step2.licenseDelivery,
        licenseDeliveryPlace: step2.licenseDeliveryPlace,
        documentType: step2.additionalDocType,
        documentNumber: step2.additionalDocNumber,
        documentDeliveryDate: step2.additionalDocDelivery,
        documentExpirationDate: step2.additionalDocExpiration,
        documentDeliveryAddress: step2.additionalDocDeliveryAddress,
        wilaya: step2.wilaya,
        completeAddress: step2.completeAddress,
        profilePhoto: step2.photo,
        scannedDocuments: step2.scannedDocuments,
      };

      const createdClient = await DatabaseService.createClient(clientPayload);

      // compute pricing values for reservation
      const totalServices = step3.additionalServices.reduce((sum, s) => sum + s.price, 0);
      const total = totalPrice + totalServices;
      // Do not calculate advance payment - client has not paid anything yet
      // Payment must be added manually via "Ajouter Paiement" in reservation details
      const advance = 0;
      const remaining = Math.max(0, total - advance);

      const reservationRes = await ReservationsService.createReservation({
        clientId: createdClient.id,
        carId: selectedCar.id,
        departureDate: step1.departureDate,
        departureTime: step1.departureTime,
        departureAgencyId: step1.departureAgency,
        returnDate: step1.returnDate,
        returnTime: step1.returnTime,
        returnAgencyId: step1.differentReturnAgency ? step1.returnAgency : step1.departureAgency,
        pricePerDay: selectedCar.priceDay,
        priceWeek: selectedCar.priceWeek,
        priceMonth: selectedCar.priceMonth,
        totalDays: days,
        totalPrice: total,
        deposit: selectedCar.deposit,
        advancePayment: advance,
        remainingPayment: remaining,
        notes: step4.notes,
        status: 'pending',
      });

      if (step3.additionalServices.length > 0) {
        await ReservationsService.updateReservationServices(reservationRes.id, step3.additionalServices);
      }

      setShowThankYou(true);
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      alert(lang === 'fr' ? `Erreur: ${err.message}` : `خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showThankYou && (
        <ThankYouPage
          lang={lang}
          onBackHome={() => {
            setShowThankYou(false);
            setCurrentStep('search');
            setSelectedCar(null);
            setSearchQuery('');
            setStep1({
              carId: '',
              departureDate: '',
              departureTime: '10:00',
              departureAgency: '',
              returnDate: '',
              returnTime: '10:00',
              returnAgency: '',
              differentReturnAgency: false,
            });
            setStep2({
              photo: '',
              firstName: '',
              lastName: '',
              phone: '',
              email: '',
              dateOfBirth: '',
              placeOfBirth: '',
              licenseNumber: '',
              licenseExpiration: '',
              licenseDelivery: '',
              licenseDeliveryPlace: '',
              additionalDocType: 'none',
              additionalDocNumber: '',
              additionalDocDelivery: '',
              additionalDocExpiration: '',
              additionalDocDeliveryAddress: '',
              wilaya: '16 - Alger',
              completeAddress: '',
              scannedDocuments: [],
            });
            setStep3({ additionalServices: [] });
            setStep4({ advancePercentage: 20, notes: '' });
          }}
        />
      )}

      {!showThankYou && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress Indicator */}
            {currentStep !== 'search' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-8">
                  {['step1', 'step2', 'step3', 'step4'].map((step, i) => {
                    const stepLabels = {
                      step1: { emoji: '🚗', label: 'Réservation' },
                      step2: { emoji: '👤', label: 'Informations' },
                      step3: { emoji: '🛎️', label: 'Services' },
                      step4: { emoji: '💰', label: 'Tarification' },
                    };
                    const stepIndex = ['step1', 'step2', 'step3', 'step4'].indexOf(currentStep);
                    const isCompleted = stepIndex > i;
                    const isCurrent = currentStep === step;

                    return (
                      <React.Fragment key={step}>
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-r from-saas-primary-via to-saas-primary-end text-white shadow-lg'
                              : isCompleted
                              ? 'bg-saas-success-start text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {stepLabels[step as keyof typeof stepLabels]?.emoji}
                      </div>
                      {i < 3 && (
                        <div
                          className={`flex-1 h-1 mx-4 rounded transition-all ${
                            isCompleted
                              ? 'bg-saas-success-start'
                              : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                    );
                  })}
                </div>
                <p className="text-center text-sm font-bold text-slate-600">
                  {currentStep === 'step1' && (lang === 'fr' ? 'Étape 1 : Dates et Agences' : 'الخطوة 1: التواريخ والوكالات')}
                  {currentStep === 'step2' && (lang === 'fr' ? 'Étape 2 : Informations Personnelles' : 'الخطوة 2: المعلومات الشخصية')}
                  {currentStep === 'step3' && (lang === 'fr' ? 'Étape 3 : Services Supplémentaires' : 'الخطوة 3: خدمات إضافية')}
                  {currentStep === 'step4' && (lang === 'fr' ? 'Étape 4 : Tarification Finale' : 'الخطوة 4: التسعير النهائي')}
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* SEARCH STEP */}
              {currentStep === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-slate-900 mb-4">
                      🚗 {{fr: 'Créer une réservation', ar: 'إنشاء حجز'}[lang]}
                    </h1>
                    <p className="text-xl text-slate-600">
                      {{fr: 'Cherchez votre voiture idéale', ar: 'ابحث عن سيارتك المثالية'}[lang]}
                    </p>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      placeholder={lang === 'fr' ? 'Cherchez par marque, modèle...' : 'ابحث عن العلامة والموديل...'}
                      className="w-full px-6 py-4 text-lg border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-2xl transition-colors"
                    />
                    {showResults && filteredCars.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border-2 border-slate-300 rounded-2xl mt-2 shadow-xl z-50 max-h-96 overflow-y-auto">
                        {filteredCars.map(car => (
                          <button
                            key={car.id}
                            onClick={() => handleSelectCar(car)}
                            className="w-full text-left px-6 py-4 hover:bg-slate-100 border-b border-slate-200 last:border-b-0 transition-colors"
                          >
                            <p className="font-black text-slate-900">{car.brand} {car.model}</p>
                            <p className="text-sm text-slate-500">{car.registration} • {car.year}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* All Cars Grid */}
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-6">
                      {{fr: 'Toutes les voitures disponibles', ar: 'جميع السيارات المتاحة'}[lang]}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cars.map(car => (
                        <motion.button
                          key={car.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelectCar(car)}
                          className="text-left bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-600"
                        >
                          <div className="h-40 bg-slate-200 overflow-hidden">
                            <img
                              src={car.images[0]}
                              alt={car.model}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-black text-slate-900">{car.brand} {car.model}</h3>
                            <p className="text-sm text-slate-500 mb-3">{car.registration}</p>
                            <p className="font-black text-blue-600">{car.priceDay.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}/{{fr: 'jour', ar: 'يوم'}[lang]}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 1 */}
              {currentStep === 'step1' && selectedCar && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl shadow-xl p-8 space-y-8"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                      {selectedCar.brand} {selectedCar.model}
                    </h2>
                    <p className="text-slate-600">{selectedCar.registration} • {selectedCar.year}</p>
                  </div>

                  <div className="space-y-6">
                    {/* Departure Section */}
                    <div className="border-2 border-blue-200 rounded-2xl p-6 space-y-4">
                      <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                        🛫 {{fr: 'DÉPART', ar: 'المغادرة'}[lang]}
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">{{fr: 'Date *', ar: 'التاريخ *'}[lang]}</label>
                          <input
                            type="date"
                            name="departureDate"
                            value={step1.departureDate}
                            onChange={handleStep1Change}
                            className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">{{fr: 'Heure *', ar: 'الساعة *'}[lang]}</label>
                          <input
                            type="time"
                            name="departureTime"
                            value={step1.departureTime}
                            onChange={handleStep1Change}
                            className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">{{fr: 'Sélectionner une agence de départ *', ar: 'اختر وكالة المغادرة *'}[lang]}</label>
                        <select
                          name="departureAgency"
                          value={step1.departureAgency}
                          onChange={handleStep1Change}
                          disabled={isLoadingAgencies}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors disabled:bg-slate-100"
                        >
                          <option value="">
                            {isLoadingAgencies
                              ? (lang === 'fr' ? 'Chargement...' : 'جاري التحميل...')
                              : (lang === 'fr' ? 'Sélectionner une agence...' : 'اختر وكالة...')}
                          </option>
                          {agencies.map(agency => (
                            <option key={agency.id} value={agency.id}>
                              {agency.name} - {agency.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Return Section */}
                    <div className="border-2 border-green-200 rounded-2xl p-6 space-y-4">
                      <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                        🛬 {{fr: 'RETOUR', ar: 'الإرجاع'}[lang]}
                      </h3>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          name="differentReturnAgency"
                          checked={step1.differentReturnAgency}
                          onChange={handleStep1Change}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <span className="font-bold text-slate-700">
                          {{fr: 'Agence différente', ar: 'وكالة مختلفة'}[lang]}
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">{{fr: 'Date *', ar: 'التاريخ *'}[lang]}</label>
                          <input
                            type="date"
                            name="returnDate"
                            value={step1.returnDate}
                            onChange={handleStep1Change}
                            className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">{{fr: 'Heure *', ar: 'الساعة *'}[lang]}</label>
                          <input
                            type="time"
                            name="returnTime"
                            value={step1.returnTime}
                            onChange={handleStep1Change}
                            className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                          />
                        </div>
                      </div>

                      {step1.differentReturnAgency && (
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">
                            {{fr: 'Sélectionner une agence de retour *', ar: 'اختر وكالة الإرجاع *'}[lang]}
                          </label>
                          <select
                            name="returnAgency"
                            value={step1.returnAgency}
                            onChange={handleStep1Change}
                            disabled={isLoadingAgencies}
                            className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors disabled:bg-slate-100"
                          >
                            <option value="">
                              {isLoadingAgencies
                                ? (lang === 'fr' ? 'Chargement...' : 'جاري التحميل...')
                                : (lang === 'fr' ? 'Sélectionner une agence...' : 'اختر وكالة...')}
                            </option>
                            {agencies.map(agency => (
                              <option key={agency.id} value={agency.id}>
                                {agency.name} - {agency.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-4 pt-6 border-t border-slate-200">
                    <button
                      onClick={() => setCurrentStep('search')}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-3 px-6 rounded-xl transition-colors"
                    >
                      <ChevronLeft size={20} /> {{fr: 'Retour', ar: 'السابق'}[lang]}
                    </button>
                    <button
                      onClick={() => isStep1Valid && setCurrentStep('step2')}
                      disabled={!isStep1Valid}
                      className={`flex-1 flex items-center justify-center gap-2 font-black py-3 px-6 rounded-xl transition-all ${
                        isStep1Valid
                          ? 'bg-gradient-to-r from-saas-primary-via to-saas-primary-end text-white hover:shadow-lg'
                          : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {{fr: 'Suivant', ar: 'التالي'}[lang]} <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 */}
              {currentStep === 'step2' && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Personal Info */}
                  <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      📸 {{fr: 'Photo Optionnelle', ar: 'صورة اختيارية'}[lang]}
                    </h2>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {step2.photo ? (
                          <img src={step2.photo} alt="Photo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">📷</span>
                        )}
                      </div>
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploadingProfile}
                        />
                        <span className={`cursor-pointer bg-saas-primary-via hover:bg-saas-primary-end text-white font-bold py-2 px-6 rounded-lg transition-colors inline-block ${uploadingProfile ? 'opacity-50' : ''}`}>
                          {uploadingProfile
                            ? (lang === 'fr' ? 'Téléchargement...' : 'جاري...')
                            : (lang === 'fr' ? 'Charger une photo' : 'تحميل صورة')}
                        </span>
                      </label>
                    </div>
                    {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      👤 {{fr: 'Informations Personnelles', ar: 'معلومات شخصية'}[lang]}
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">✍️ {{fr: 'Prénom *', ar: 'الاسم الأول *'}[lang]}</label>
                        <input
                          type="text"
                          name="firstName"
                          value={step2.firstName}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">✍️ {{fr: 'Nom de Famille *', ar: 'الاسم الأخير *'}[lang]}</label>
                        <input
                          type="text"
                          name="lastName"
                          value={step2.lastName}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">📱 {{fr: 'Téléphone *', ar: 'الهاتف *'}[lang]}</label>
                        <input
                          type="tel"
                          name="phone"
                          value={step2.phone}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">📧 {{fr: 'Email *', ar: 'البريد الإلكتروني *'}[lang]}</label>
                        <input
                          type="email"
                          name="email"
                          value={step2.email}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">🎂 {{fr: 'Date Naissance', ar: 'تاريخ الميلاد'}[lang]}</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={step2.dateOfBirth}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">📍 {{fr: 'Lieu Naissance', ar: 'مكان الميلاد'}[lang]}</label>
                        <input
                          type="text"
                          name="placeOfBirth"
                          value={step2.placeOfBirth}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Official Documents */}
                  <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      🆔 {{fr: 'Documents Officiels', ar: 'المستندات الرسمية'}[lang]}
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">🚗 {{fr: 'N° Permis *', ar: 'رقم الرخصة *'}[lang]}</label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={step2.licenseNumber}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">⏱️ {{fr: 'Expiration Permis', ar: 'انتهاء الرخصة'}[lang]}</label>
                        <input
                          type="date"
                          name="licenseExpiration"
                          value={step2.licenseExpiration}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">📅 {{fr: 'Délivrance Permis', ar: 'تاريخ إصدار الرخصة'}[lang]}</label>
                        <input
                          type="date"
                          name="licenseDelivery"
                          value={step2.licenseDelivery}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">📍 {{fr: 'Lieu Délivrance', ar: 'مكان الإصدار'}[lang]}</label>
                        <input
                          type="text"
                          name="licenseDeliveryPlace"
                          value={step2.licenseDeliveryPlace}
                          onChange={handleStep2Change}
                          className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Document */}
                  <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      🎫 {{fr: 'Document Additionnel', ar: 'وثيقة إضافية'}[lang]}
                    </h2>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">{{fr: 'Type Doc', ar: 'نوع الوثيقة'}[lang]}</label>
                      <select
                        name="additionalDocType"
                        value={step2.additionalDocType}
                        onChange={handleStep2Change}
                        className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                      >
                        <option value="none">{{fr: 'Aucun', ar: 'بدون'}[lang]}</option>
                        <option value="id_card">{{fr: 'Carte d\'identité', ar: 'بطاقة الهوية'}[lang]}</option>
                        <option value="passport">{{fr: 'Passeport', ar: 'جواز سفر'}[lang]}</option>
                      </select>
                    </div>

                    {step2.additionalDocType !== 'none' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">🔢 {{fr: 'N° Document', ar: 'رقم الوثيقة'}[lang]}</label>
                            <input
                              type="text"
                              name="additionalDocNumber"
                              value={step2.additionalDocNumber}
                              onChange={handleStep2Change}
                              className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">📅 {{fr: 'Délivrance', ar: 'الإصدار'}[lang]}</label>
                            <input
                              type="date"
                              name="additionalDocDelivery"
                              value={step2.additionalDocDelivery}
                              onChange={handleStep2Change}
                              className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">⏰ {{fr: 'Expiration', ar: 'الانتهاء'}[lang]}</label>
                            <input
                              type="date"
                              name="additionalDocExpiration"
                              value={step2.additionalDocExpiration}
                              onChange={handleStep2Change}
                              className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">📍 {{fr: 'Adresse Délivrance', ar: 'عنوان الإصدار'}[lang]}</label>
                            <input
                              type="text"
                              name="additionalDocDeliveryAddress"
                              value={step2.additionalDocDeliveryAddress}
                              onChange={handleStep2Change}
                              className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Scanned Documents */}
                  <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      📄 {{fr: 'Documents Scannés', ar: 'الوثائق الممسوحة'}[lang]}
                    </h2>
                    <p className="text-slate-600 text-sm">
                      {{fr: 'Téléchargez vos documents officiels (permis de conduire, carte d\'identité, etc.)', ar: 'قم بتحميل وثائقك الرسمية (رخصة القيادة، بطاقة الهوية، إلخ)'}[lang]}
                    </p>

                    <div className="space-y-4">
                      <label>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          disabled={uploadingDocument}
                        />
                        <span className={`cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-colors inline-flex items-center gap-2 ${uploadingDocument ? 'opacity-50' : ''}`}>
                          {uploadingDocument ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              {lang === 'fr' ? 'Téléchargement...' : 'جاري التحميل...'}
                            </>
                          ) : (
                            <>
                              <Upload size={20} />
                              {{fr: 'Télécharger des Documents', ar: 'تحميل الوثائق'}[lang]}
                            </>
                          )}
                        </span>
                      </label>
                      {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}

                      {/* Display uploaded documents */}
                      {step2.scannedDocuments && step2.scannedDocuments.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                          {step2.scannedDocuments.map((docUrl, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border-2 border-amber-200 bg-amber-50 flex items-center justify-center">
                                {docUrl.includes('data:application/pdf') ? (
                                  <div className="text-center p-4">
                                    <FileText className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                    <p className="text-xs text-amber-700">{{fr: 'PDF', ar: 'PDF'}[lang]}</p>
                                  </div>
                                ) : (
                                  <img
                                    src={docUrl}
                                    alt={`${{fr: 'Document', ar: 'وثيقة'}[lang]} ${index + 1}`}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => window.open(docUrl, '_blank')}
                                  />
                                )}
                              </div>
                              <button
                                onClick={() => removeDocument(index)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                              <div className="absolute bottom-2 left-2 bg-amber-600 text-white text-xs px-2 py-1 rounded">
                                {{fr: 'Doc', ar: 'وثيقة'}[lang]} {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(!step2.scannedDocuments || step2.scannedDocuments.length === 0) && (
                        <div className="text-center py-8 text-slate-400">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">{{fr: 'Aucun document téléchargé', ar: 'لم يتم تحميل أي وثيقة'}[lang]}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address & Location */}
                  <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      🏠 {{fr: 'Adresse & Localisation', ar: 'العنوان والموقع'}[lang]}
                    </h2>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">🏙️ {{fr: 'Wilaya *', ar: 'الولاية *'}[lang]}</label>
                      <select
                        name="wilaya"
                        value={step2.wilaya}
                        onChange={handleStep2Change}
                        className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors"
                      >
                        {ALGERIAN_WILAYAS.map(wilaya => (
                          <option key={wilaya} value={wilaya}>
                            {wilaya}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">📮 {{fr: 'Adresse Complète', ar: 'العنوان الكامل'}[lang]}</label>
                      <textarea
                        name="completeAddress"
                        value={step2.completeAddress}
                        onChange={handleStep2Change}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl transition-colors resize-none"
                        placeholder={lang === 'fr' ? 'Rue, N°, Quartier...' : 'الشارع، الرقم، المنطقة...'}
                      />
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setCurrentStep('step1')}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-3 px-6 rounded-xl transition-colors"
                    >
                      <ChevronLeft size={20} /> {{fr: 'Retour', ar: 'السابق'}[lang]}
                    </button>
                    <button
                      onClick={() => isStep2Valid && setCurrentStep('step3')}
                      disabled={!isStep2Valid}
                      className={`flex-1 flex items-center justify-center gap-2 font-black py-3 px-6 rounded-xl transition-all ${
                        isStep2Valid
                          ? 'bg-gradient-to-r from-saas-primary-via to-saas-primary-end text-white hover:shadow-lg'
                          : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {{fr: 'Suivant', ar: 'التالي'}[lang]} <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 - SERVICES */}
              {currentStep === 'step3' && selectedCar && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-black text-slate-900">
                    🛎️ {{fr: 'Services Supplémentaires', ar: 'الخدمات الإضافية'}[lang]}
                  </h3>

                  {/* Available Services */}
                  <div className="bg-white rounded-3xl shadow-xl p-8">
                    {loadingServices ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-primary-via"></div>
                      </div>
                    ) : servicesError ? (
                      <div className="text-center py-12">
                        <p className="text-red-600 font-bold">{servicesError}</p>
                      </div>
                    ) : services.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-slate-600 font-bold">{{fr: 'Aucun service disponible', ar: 'لا توجد خدمات'}[lang]}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service) => {
                          const isSelected = step3.additionalServices.some(s => s.id === service.id);

                          return (
                            <div
                              key={service.id}
                              onClick={() => handleStep3Change({
                                id: service.id,
                                name: service.name || service.service_name,
                                price: service.price,
                                description: service.description,
                                category: service.category || 'service',
                                selected: false
                              })}
                              className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-saas-success-start bg-green-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-bold text-lg text-slate-900">{service.name || service.service_name}</h4>
                                  <p className="text-slate-600 text-sm mb-2">{service.description}</p>
                                  <p className="font-black text-saas-success-start">{service.price.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'border-saas-success-start bg-saas-success-start' : 'border-slate-300'
                                }`}>
                                  {isSelected && <span className="text-white text-sm">✓</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Services Summary */}
                  {step3.additionalServices.length > 0 && (
                    <div className="bg-gradient-to-r from-saas-primary-via/10 to-saas-primary-end/10 rounded-3xl border-2 border-saas-primary-via p-8 space-y-4">
                      <h4 className="text-lg font-black text-slate-900">
                        🛒 {{fr: 'Services Sélectionnés', ar: 'الخدمات المختارة'}[lang]}
                      </h4>
                      <div className="space-y-2">
                        {step3.additionalServices.map((service) => (
                          <div key={service.id} className="flex justify-between items-center">
                            <span className="font-bold">{service.name}</span>
                            <span className="font-bold text-saas-primary-via">{service.price.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                          </div>
                        ))}
                        <div className="border-t border-saas-primary-via/30 pt-2 mt-4">
                          <div className="flex justify-between items-center text-lg font-black">
                            <span>{{fr: 'Total Services', ar: 'إجمالي الخدمات'}[lang]}</span>
                            <span className="text-saas-primary-via">{step3.additionalServices.reduce((sum, s) => sum + s.price, 0).toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setCurrentStep('step2')}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-3 px-6 rounded-xl transition-colors"
                    >
                      <ChevronLeft size={20} /> {{fr: 'Retour', ar: 'السابق'}[lang]}
                    </button>
                    <button
                      onClick={() => setCurrentStep('step4')}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-saas-primary-via to-saas-primary-end text-white font-black py-3 px-6 rounded-xl transition-all hover:shadow-lg"
                    >
                      {{fr: 'Suivant', ar: 'التالي'}[lang]} <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4 - TARIFICATION */}
              {currentStep === 'step4' && selectedCar && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-black text-slate-900">
                    💰 {{fr: 'Tarification Finale', ar: 'التسعير النهائي'}[lang]}
                  </h3>

                  {/* Reservation Summary */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <h4 className="text-lg font-black text-slate-900 mb-4">
                      📋 {{fr: 'Résumé de la Réservation', ar: 'ملخص الحجز'}[lang]}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="font-bold text-slate-900">🚗 {{fr: 'Véhicule', ar: 'المركبة'}[lang]}</p>
                        <p className="text-slate-600">{selectedCar.brand} {selectedCar.model}</p>
                        <p className="text-slate-600">{selectedCar.registration}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">📅 {{fr: 'Période', ar: 'الفترة'}[lang]}</p>
                        <p className="text-slate-600">{step1.departureDate} → {step1.returnDate}</p>
                        <p className="text-slate-600">{days} {{fr: 'jours', ar: 'أيام'}[lang]}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">👤 {{fr: 'Client', ar: 'العميل'}[lang]}</p>
                        <p className="text-slate-600">{step2.firstName} {step2.lastName}</p>
                        <p className="text-slate-600">{step2.phone}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">📍 {{fr: 'Wilaya', ar: 'الولاية'}[lang]}</p>
                        <p className="text-slate-600">{step2.wilaya}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h4 className="text-lg font-black text-slate-900 mb-6">
                      💰 {{fr: 'Décomposition du Prix', ar: 'تفصيل السعر'}[lang]}
                    </h4>

                    <div className="space-y-4">
                      {/* Base Vehicle Price */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h5 className="font-bold text-slate-900 mb-3">{{fr: 'Prix du Véhicule', ar: 'سعر المركبة'}[lang]}</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>{days} {{fr: 'jour(s) × ', ar: 'يوم × '}[lang]}{selectedCar.priceDay.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                            <span className="font-bold">{totalPrice.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-300 pt-2 text-lg font-bold">
                            <span>{{fr: 'Sous-total Véhicule', ar: 'المجموع الفرعي للمركبة'}[lang]}</span>
                            <span>{totalPrice.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Services */}
                      {step3.additionalServices.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-bold text-blue-900 mb-3">{{fr: 'Services Supplémentaires', ar: 'الخدمات الإضافية'}[lang]}</h5>
                          <div className="space-y-2">
                            {step3.additionalServices.map((service) => (
                              <div key={service.id} className="flex justify-between items-center">
                                <span>{service.name}</span>
                                <span>{service.price.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center border-t border-blue-300 pt-2 font-bold">
                              <span>{{fr: 'Total Services', ar: 'إجمالي الخدمات'}[lang]}</span>
                              <span>{step3.additionalServices.reduce((sum, s) => sum + s.price, 0).toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Final Total */}
                      <div className="bg-gradient-to-r from-saas-success-start/20 to-saas-success-end/20 rounded-lg p-4 border-2 border-saas-success-start">
                        <div className="flex justify-between items-center text-xl font-black text-slate-900">
                          <span>{{fr: 'TOTAL COMMANDE', ar: 'إجمالي الطلب'}[lang]}</span>
                          <span className="text-saas-success-start text-3xl">{(totalPrice + step3.additionalServices.reduce((sum, s) => sum + s.price, 0)).toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Confirmation */}
                  <div className="bg-gradient-to-r from-saas-primary-via to-saas-primary-end rounded-3xl shadow-xl p-8 text-white space-y-4">
                    <h2 className="text-2xl font-black mb-2">✅ {{fr: 'Êtes-vous prêt?', ar: 'هل أنت جاهز؟'}[lang]}</h2>
                    <p className="text-white/90 font-bold">
                      {{fr: 'Cliquez sur confirmer pour finaliser votre commande. Nous vous appellerons bientôt pour la confirmation.', ar: 'انقر على تأكيد لإنهاء طلبك. سنتصل بك قريباً للتأكيد.'}[lang]}
                    </p>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setCurrentStep('step3')}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black py-3 px-6 rounded-xl transition-colors"
                    >
                      <ChevronLeft size={20} /> {{fr: 'Retour', ar: 'السابق'}[lang]}
                    </button>
                    <button
                      onClick={handleConfirmReservation}
                      disabled={isSubmitting || uploadingProfile || uploadingDocument}
                      className={`flex-1 bg-gradient-to-r from-saas-success-start to-saas-success-end hover:from-saas-success-start hover:to-saas-success-end text-white font-black py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl ${(isSubmitting || uploadingProfile || uploadingDocument) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin w-5 h-5 mr-2" />
                          {lang === 'fr' ? 'En cours...' : 'جاري...'}
                        </>
                      ) : (
                        <>✅ {{fr: 'Confirmer la Commande', ar: 'تأكيد الطلب'}[lang]}</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </>
  );
};
