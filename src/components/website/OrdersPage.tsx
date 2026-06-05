import React, { useState, useEffect } from 'react';
import { Language, Car, Agency, Reservation, ReservationStep1, ReservationStep2, AdditionalService } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Upload, FileText, Loader2, Search, Check, X } from 'lucide-react';
import { ThankYouPage } from './ThankYouPage';

import { uploadClientProfilePhoto, uploadClientDocument } from '../../services/uploadClientImage';
import { DatabaseService } from '../../services/DatabaseService';
import { ReservationsService } from '../../services/ReservationsService';

const C = {
  cyan:      '#22D3EE',
  violet:    '#8B5CF6',
  bg:        '#050B18',
  surface:   '#0A1628',
  elevated:  '#0F1E35',
};

const ALGERIAN_WILAYAS = [
  '01 - Adrar','02 - Chlef','03 - Laghouat','04 - Oum El Bouaghi','05 - Batna',
  '06 - Béjaïa','07 - Biskra','08 - Béchar','09 - Blida','10 - Boumerdès',
  '11 - Teboussem','12 - Tlemcen','13 - Tiaret','14 - Tizi Ouzou','15 - Alger (urban)',
  '16 - Alger','17 - Sétif','18 - Saïda','19 - Skikda','20 - Sidi Bel Abbès',
  '21 - Annaba','22 - Guelma','23 - Constantine','24 - Médéa','25 - Mostaganem',
  "26 - M'sila",'27 - Mascara','28 - Ouargla','29 - Oran','30 - El Bayadh',
  '31 - Illizi','32 - Bordj Baji Mokhtar','33 - Ouled Djellal','34 - Béni Abbès',
  '35 - In Salah','36 - In Guezzam','37 - Touggourt','38 - Djanet',
];

// ─── Shared input style helper ───────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  background: '#0F1E35',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#F8FAFC',
};
const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  (e.target as HTMLElement).style.borderColor = '#22D3EE';
  (e.target as HTMLElement).style.boxShadow = '0 0 0 1px rgba(34,211,238,0.25)';
};
const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
  (e.target as HTMLElement).style.boxShadow = 'none';
};

const inputClass = 'w-full px-4 py-3 rounded-xl outline-none transition-all font-medium placeholder:text-vel-dim';

// ─── Section card wrapper ─────────────────────────────────────────────────────
const SectionCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl p-6 sm:p-8 space-y-6 ${className}`}
    style={{ background: C.elevated, border: '1px solid rgba(34,211,238,0.1)' }}
  >
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-black text-vel-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
    {children}
  </h2>
);

// ─── Label ────────────────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-bold text-vel-muted mb-2 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
    {children}
  </label>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────
const steps = [
  { key: 'step1', emoji: '🚗', label: { fr: 'Réservation', ar: 'الحجز' } },
  { key: 'step2', emoji: '👤', label: { fr: 'Informations', ar: 'البيانات' } },
  { key: 'step3', emoji: '🛎️', label: { fr: 'Services', ar: 'الخدمات' } },
  { key: 'step4', emoji: '💰', label: { fr: 'Tarifs', ar: 'الأسعار' } },
];

interface OrdersPageProps {
  lang: Language;
  cars: Car[];
  agencies: Agency[];
  isLoadingAgencies?: boolean;
  selectedCar?: Car | null;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  lang, cars, agencies, isLoadingAgencies = false, selectedCar: initialCar,
}) => {
  const [currentStep, setCurrentStep] = useState<'search' | 'step1' | 'step2' | 'step3' | 'step4' | 'success'>(
    initialCar ? 'step1' : 'search'
  );
  const [selectedCar, setSelectedCar] = useState<Car | null>(initialCar || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

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

  const [step3, setStep3] = useState<{ additionalServices: AdditionalService[] }>({ additionalServices: [] });
  const [step4, setStep4] = useState({ advancePercentage: 20, notes: '' });

  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const exists = prev.additionalServices.find(s => s.id === service.id);
      const updated = exists
        ? prev.additionalServices.filter(s => s.id !== service.id)
        : [...prev.additionalServices, service];
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
      setUploadError('Upload error');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    setUploadError(null);
    for (const file of Array.from(fileList) as File[]) {
      setUploadingDocument(true);
      try {
        const result = await uploadClientDocument(file);
        if (result.success && result.url) {
          setStep2(prev => ({ ...prev, scannedDocuments: [...(prev.scannedDocuments || []), result.url] }));
        } else {
          setUploadError(result.error || 'Upload failed');
        }
      } catch {
        setUploadError('Upload error');
      } finally {
        setUploadingDocument(false);
      }
    }
  };

  const removeDocument = (index: number) => {
    setStep2(prev => ({ ...prev, scannedDocuments: prev.scannedDocuments?.filter((_, i) => i !== index) || [] }));
  };

  const calculateDays = () => {
    if (!step1.departureDate || !step1.returnDate) return 0;
    const diff = Math.ceil(
      (new Date(step1.returnDate).getTime() - new Date(step1.departureDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, diff);
  };

  const days = calculateDays();
  const totalPrice = selectedCar ? selectedCar.priceDay * days : 0;

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        setServices(await DatabaseService.getServices());
      } catch {
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, []);

  const isStep1Valid =
    step1.carId && step1.departureDate && step1.departureTime && step1.departureAgency &&
    step1.returnDate && step1.returnTime &&
    (step1.differentReturnAgency ? !!step1.returnAgency : true);

  const isStep2Valid =
    step2.firstName && step2.lastName && step2.phone && step2.email && step2.licenseNumber && step2.wilaya;

  const resetAll = () => {
    setCurrentStep('search');
    setSelectedCar(null);
    setSearchQuery('');
    setStep1({ carId: '', departureDate: '', departureTime: '10:00', departureAgency: '', returnDate: '', returnTime: '10:00', returnAgency: '', differentReturnAgency: false });
    setStep2({ photo: '', firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', placeOfBirth: '', licenseNumber: '', licenseExpiration: '', licenseDelivery: '', licenseDeliveryPlace: '', additionalDocType: 'none', additionalDocNumber: '', additionalDocDelivery: '', additionalDocExpiration: '', additionalDocDeliveryAddress: '', wilaya: '16 - Alger', completeAddress: '', scannedDocuments: [] });
    setStep3({ additionalServices: [] });
    setStep4({ advancePercentage: 20, notes: '' });
  };

  const handleConfirmReservation = async () => {
    if (!selectedCar) return;
    setIsSubmitting(true);
    setUploadError(null);
    try {
      const clientPayload: any = {
        firstName: step2.firstName, lastName: step2.lastName, phone: step2.phone, email: step2.email,
        dateOfBirth: step2.dateOfBirth, placeOfBirth: step2.placeOfBirth,
        idCardNumber: step2.additionalDocType === 'id_card' ? (step2.additionalDocNumber || '') : '',
        licenseNumber: step2.licenseNumber, licenseExpirationDate: step2.licenseExpiration,
        licenseDeliveryDate: step2.licenseDelivery, licenseDeliveryPlace: step2.licenseDeliveryPlace,
        documentType: step2.additionalDocType, documentNumber: step2.additionalDocNumber,
        documentDeliveryDate: step2.additionalDocDelivery, documentExpirationDate: step2.additionalDocExpiration,
        documentDeliveryAddress: step2.additionalDocDeliveryAddress,
        wilaya: step2.wilaya, completeAddress: step2.completeAddress,
        profilePhoto: step2.photo, scannedDocuments: step2.scannedDocuments,
      };

      const createdClient = await DatabaseService.createClient(clientPayload);
      const totalServices = step3.additionalServices.reduce((sum, s) => sum + s.price, 0);
      const total = totalPrice + totalServices;

      const reservationRes = await ReservationsService.createReservation({
        clientId: createdClient.id, carId: selectedCar.id,
        departureDate: step1.departureDate, departureTime: step1.departureTime,
        departureAgencyId: step1.departureAgency,
        returnDate: step1.returnDate, returnTime: step1.returnTime,
        returnAgencyId: step1.differentReturnAgency ? step1.returnAgency : step1.departureAgency,
        pricePerDay: selectedCar.priceDay, priceWeek: selectedCar.priceWeek, priceMonth: selectedCar.priceMonth,
        totalDays: days, totalPrice: total, deposit: selectedCar.deposit,
        advancePayment: 0, remainingPayment: Math.max(0, total),
        notes: step4.notes, status: 'pending',
      });

      if (step3.additionalServices.length > 0) {
        await ReservationsService.updateReservationServices(reservationRes.id, step3.additionalServices);
      }
      setShowThankYou(true);
    } catch (err: any) {
      alert(lang === 'fr' ? `Erreur: ${err.message}` : `خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepIndex = ['step1', 'step2', 'step3', 'step4'].indexOf(currentStep);

  return (
    <>
      {showThankYou && (
        <ThankYouPage lang={lang} onBackHome={() => { setShowThankYou(false); resetAll(); }} />
      )}

      {!showThankYou && (
        <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8" style={{ background: C.bg }}>

          {/* Background glows */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px]" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.04), transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px]" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)', transform: 'translate(-30%, 30%)' }} />
          </div>

          <div className="relative max-w-4xl mx-auto">

            {/* ── PROGRESS STEPPER ── */}
            {currentStep !== 'search' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <div className="flex items-center justify-center gap-0 mb-6">
                  {steps.map((step, i) => {
                    const isCompleted = currentStepIndex > i;
                    const isCurrent = currentStep === step.key;
                    return (
                      <React.Fragment key={step.key}>
                        <motion.div
                          animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black transition-all duration-500"
                            style={{
                              background: isCompleted
                                ? 'linear-gradient(135deg, #22D3EE, #06B6D4)'
                                : isCurrent
                                ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(139,92,246,0.2))'
                                : 'rgba(255,255,255,0.05)',
                              border: isCompleted || isCurrent
                                ? '2px solid #22D3EE'
                                : '2px solid rgba(255,255,255,0.1)',
                              boxShadow: isCurrent ? '0 0 20px rgba(34,211,238,0.4)' : 'none',
                              color: isCompleted ? '#050B18' : isCurrent ? '#22D3EE' : '#64748B',
                            }}
                          >
                            {isCompleted ? <Check size={18} /> : step.emoji}
                          </div>
                          <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:block"
                            style={{ color: isCurrent ? '#22D3EE' : isCompleted ? '#22D3EE' : '#64748B', fontFamily: 'var(--font-display)' }}>
                            {step.label[lang]}
                          </span>
                        </motion.div>
                        {i < steps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 sm:mx-4 rounded-full transition-all duration-700"
                            style={{ background: currentStepIndex > i ? 'linear-gradient(90deg, #22D3EE, #06B6D4)' : 'rgba(255,255,255,0.06)' }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">

              {/* ══ SEARCH / CAR SELECTION ══ */}
              {currentStep === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-10"
                >
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                      style={{ border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.08)' }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.cyan }} />
                      <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: C.cyan, fontFamily: 'var(--font-display)' }}>
                        {{ fr: 'Réservation en ligne', ar: 'حجز عبر الإنترنت' }[lang]}
                      </span>
                    </div>
                    <h1 className="font-black text-4xl sm:text-5xl text-vel-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                      🚗 {{ fr: 'Créer une réservation', ar: 'إنشاء حجز' }[lang]}
                    </h1>
                    <p className="text-vel-muted text-lg">
                      {{ fr: 'Choisissez votre véhicule idéal', ar: 'اختر سيارتك المثالية' }[lang]}
                    </p>
                  </motion.div>

                  {/* Search bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    <div className="relative flex items-center">
                      <Search size={18} className="absolute left-4 text-vel-muted pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
                        onFocus={() => setShowResults(true)}
                        placeholder={lang === 'fr' ? 'Rechercher par marque, modèle, immatriculation…' : 'ابحث بالماركة أو الموديل…'}
                        className="w-full pl-12 pr-4 py-4 text-base rounded-2xl outline-none transition-all text-vel-white placeholder:text-vel-dim font-medium"
                        style={{ background: C.elevated, border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 0 0 1px transparent' }}
                        onFocus={e => { (e.target as HTMLElement).style.borderColor = '#22D3EE'; (e.target as HTMLElement).style.boxShadow = '0 0 0 1px rgba(34,211,238,0.25), 0 0 20px rgba(34,211,238,0.1)'; }}
                        onBlur={e => { setTimeout(() => setShowResults(false), 150); (e.target as HTMLElement).style.borderColor = 'rgba(34,211,238,0.2)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 1px transparent'; }}
                      />
                    </div>

                    {/* Dropdown results */}
                    <AnimatePresence>
                      {showResults && filteredCars.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 max-h-72 overflow-y-auto custom-scrollbar"
                          style={{ background: C.elevated, border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                        >
                          {filteredCars.map(car => (
                            <button
                              key={car.id}
                              onMouseDown={() => handleSelectCar(car)}
                              className="w-full text-left px-5 py-4 transition-all duration-200 flex items-center gap-4"
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,211,238,0.06)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#1A2235' }}>
                                {car.images?.[0] ? (
                                  <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg">🚗</div>
                                )}
                              </div>
                              <div>
                                <p className="font-black text-vel-white text-sm">{car.brand} {car.model}</p>
                                <p className="text-xs text-vel-muted">{car.registration} · {car.year}</p>
                              </div>
                              <p className="ml-auto font-black text-sm" style={{ color: C.cyan }}>
                                {car.priceDay.toLocaleString()} {{ fr: 'DA/j', ar: 'د.ج/ي' }[lang]}
                              </p>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* All Cars Grid */}
                  <div>
                    <motion.h2
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-black text-2xl text-vel-white mb-6"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <span style={{ color: C.cyan }}>—</span>{' '}
                      {{ fr: 'Véhicules disponibles', ar: 'السيارات المتاحة' }[lang]}
                    </motion.h2>

                    {cars.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                      >
                        <span className="text-5xl block mb-4">🚗</span>
                        <p className="text-vel-muted font-bold">
                          {{ fr: 'Aucun véhicule disponible', ar: 'لا توجد سيارات متاحة' }[lang]}
                        </p>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {cars.map((car, i) => (
                          <motion.button
                            key={car.id}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
                            whileHover={{ y: -6 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleSelectCar(car)}
                            className="text-left rounded-2xl overflow-hidden transition-all duration-400 group"
                            style={{
                              background: C.elevated,
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(34,211,238,0.35)';
                              (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(34,211,238,0.1)';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                            }}
                          >
                            {/* Image */}
                            <div className="h-44 overflow-hidden relative" style={{ background: '#0A1628' }}>
                              {car.images?.[0] ? (
                                <img
                                  src={car.images[0]}
                                  alt={car.model}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">🚗</div>
                              )}
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,30,53,0.7), transparent)' }} />
                              {/* Year chip */}
                              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-xs font-bold"
                                style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: C.cyan, fontFamily: 'var(--font-display)' }}>
                                {car.year}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-5">
                              <h3 className="font-black text-vel-white text-base mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                                {car.brand} <span style={{ color: C.cyan }}>{car.model}</span>
                              </h3>
                              <p className="text-vel-muted text-xs mb-4">{car.registration} · {car.color}</p>

                              {/* Specs row */}
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {[car.energy, car.transmission, `${car.seats}P`].map((s, j) => (
                                  <span key={j} className="text-[10px] px-2 py-0.5 rounded-full text-vel-silver"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    {s}
                                  </span>
                                ))}
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-vel-muted">{{ fr: 'À partir de', ar: 'ابتداءً من' }[lang]}</p>
                                  <p className="font-black text-xl" style={{ color: C.cyan, fontFamily: 'var(--font-display)' }}>
                                    {car.priceDay.toLocaleString()}
                                    <span className="text-xs ml-1" style={{ color: 'rgba(34,211,238,0.65)' }}>
                                      {{ fr: 'DA/j', ar: 'د.ج/ي' }[lang]}
                                    </span>
                                  </p>
                                </div>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                  style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}>
                                  <ChevronRight size={16} style={{ color: C.cyan }} />
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══ STEP 1 — DATES & AGENCIES ══ */}
              {currentStep === 'step1' && selectedCar && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Selected car card */}
                  <div className="rounded-2xl overflow-hidden flex gap-4 p-5 items-center"
                    style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#0A1628' }}>
                      {selectedCar.images?.[0]
                        ? <img src={selectedCar.images[0]} alt={selectedCar.model} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-black text-xl text-vel-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {selectedCar.brand} <span style={{ color: C.cyan }}>{selectedCar.model}</span>
                      </h2>
                      <p className="text-vel-muted text-sm">{selectedCar.registration} · {selectedCar.year}</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep('search')}
                      className="flex-shrink-0 p-2 rounded-lg text-vel-muted transition-colors"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#22D3EE'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ''; }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Departure */}
                  <SectionCard>
                    <SectionTitle>🛫 {{ fr: 'Départ', ar: 'المغادرة' }[lang]}</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>{{ fr: 'Date *', ar: 'التاريخ *' }[lang]}</FieldLabel>
                        <input type="date" name="departureDate" value={step1.departureDate}
                          onChange={handleStep1Change} className={inputClass} style={inputStyle}
                          onFocus={focusInput} onBlur={blurInput} />
                      </div>
                      <div>
                        <FieldLabel>{{ fr: 'Heure *', ar: 'الساعة *' }[lang]}</FieldLabel>
                        <input type="time" name="departureTime" value={step1.departureTime}
                          onChange={handleStep1Change} className={inputClass} style={inputStyle}
                          onFocus={focusInput} onBlur={blurInput} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>{{ fr: 'Agence de départ *', ar: 'وكالة المغادرة *' }[lang]}</FieldLabel>
                      <select name="departureAgency" value={step1.departureAgency}
                        onChange={handleStep1Change} disabled={isLoadingAgencies}
                        className={inputClass} style={{ ...inputStyle, cursor: isLoadingAgencies ? 'wait' : 'pointer' }}
                        onFocus={focusInput} onBlur={blurInput}>
                        <option value="">
                          {isLoadingAgencies ? (lang === 'fr' ? 'Chargement…' : 'جاري التحميل…') : (lang === 'fr' ? 'Sélectionner une agence…' : 'اختر وكالة…')}
                        </option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name} — {a.city}</option>)}
                      </select>
                    </div>
                  </SectionCard>

                  {/* Return */}
                  <SectionCard>
                    <SectionTitle>🛬 {{ fr: 'Retour', ar: 'الإرجاع' }[lang]}</SectionTitle>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: step1.differentReturnAgency ? C.cyan : 'transparent',
                          border: step1.differentReturnAgency ? `2px solid ${C.cyan}` : '2px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {step1.differentReturnAgency && <Check size={12} color="#050B18" strokeWidth={3} />}
                        <input type="checkbox" name="differentReturnAgency" checked={step1.differentReturnAgency}
                          onChange={handleStep1Change} className="sr-only" />
                      </div>
                      <span className="font-bold text-vel-silver text-sm">
                        {{ fr: 'Agence de retour différente', ar: 'وكالة إرجاع مختلفة' }[lang]}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>{{ fr: 'Date *', ar: 'التاريخ *' }[lang]}</FieldLabel>
                        <input type="date" name="returnDate" value={step1.returnDate}
                          onChange={handleStep1Change} className={inputClass} style={inputStyle}
                          onFocus={focusInput} onBlur={blurInput} />
                      </div>
                      <div>
                        <FieldLabel>{{ fr: 'Heure *', ar: 'الساعة *' }[lang]}</FieldLabel>
                        <input type="time" name="returnTime" value={step1.returnTime}
                          onChange={handleStep1Change} className={inputClass} style={inputStyle}
                          onFocus={focusInput} onBlur={blurInput} />
                      </div>
                    </div>

                    {step1.differentReturnAgency && (
                      <div>
                        <FieldLabel>{{ fr: 'Agence de retour *', ar: 'وكالة الإرجاع *' }[lang]}</FieldLabel>
                        <select name="returnAgency" value={step1.returnAgency}
                          onChange={handleStep1Change} disabled={isLoadingAgencies}
                          className={inputClass} style={inputStyle} onFocus={focusInput} onBlur={blurInput}>
                          <option value="">{lang === 'fr' ? 'Sélectionner…' : 'اختر…'}</option>
                          {agencies.map(a => <option key={a.id} value={a.id}>{a.name} — {a.city}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Duration preview */}
                    {days > 0 && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
                        <span className="text-xl">📅</span>
                        <span className="text-vel-silver font-bold text-sm">
                          {days} {{ fr: 'jour(s)', ar: 'يوم' }[lang]} ·{' '}
                          <span style={{ color: C.cyan }}>{totalPrice.toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}</span>
                        </span>
                      </div>
                    )}
                  </SectionCard>

                  <NavButtons
                    onBack={() => setCurrentStep('search')}
                    onNext={() => isStep1Valid && setCurrentStep('step2')}
                    nextDisabled={!isStep1Valid}
                    lang={lang}
                  />
                </motion.div>
              )}

              {/* ══ STEP 2 — PERSONAL INFO ══ */}
              {currentStep === 'step2' && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Photo */}
                  <SectionCard>
                    <SectionTitle>📸 {{ fr: 'Photo (optionnelle)', ar: 'صورة (اختياري)' }[lang]}</SectionTitle>
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                        {step2.photo
                          ? <img src={step2.photo} alt="Photo" className="w-full h-full object-cover" />
                          : <span className="text-3xl">📷</span>
                        }
                      </div>
                      <label>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingProfile} />
                        <span className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${uploadingProfile ? 'opacity-50' : ''}`}
                          style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: C.cyan, fontFamily: 'var(--font-display)' }}>
                          {uploadingProfile ? <><Loader2 size={16} className="animate-spin" /> {lang === 'fr' ? 'Envoi…' : 'جاري…'}</> : <><Upload size={16} /> {lang === 'fr' ? 'Charger' : 'تحميل'}</>}
                        </span>
                      </label>
                    </div>
                    {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
                  </SectionCard>

                  {/* Personal info */}
                  <SectionCard>
                    <SectionTitle>👤 {{ fr: 'Informations Personnelles', ar: 'معلومات شخصية' }[lang]}</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: { fr: 'Nom de famille *', ar: 'الاسم الأخير *' }, name: 'lastName', type: 'text' },
                        { label: { fr: 'Prénom *', ar: 'الاسم الأول *' }, name: 'firstName', type: 'text' },
                        { label: { fr: 'Téléphone *', ar: 'الهاتف *' }, name: 'phone', type: 'tel' },
                        { label: { fr: 'Email *', ar: 'البريد الإلكتروني *' }, name: 'email', type: 'email' },
                        { label: { fr: 'Date de naissance', ar: 'تاريخ الميلاد' }, name: 'dateOfBirth', type: 'date' },
                        { label: { fr: 'Lieu de naissance', ar: 'مكان الميلاد' }, name: 'placeOfBirth', type: 'text' },
                      ].map(f => (
                        <div key={f.name}>
                          <FieldLabel>{f.label[lang]}</FieldLabel>
                          <input type={f.type} name={f.name} value={(step2 as any)[f.name]}
                            onChange={handleStep2Change} className={inputClass} style={inputStyle}
                            onFocus={focusInput} onBlur={blurInput} />
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {/* License */}
                  <SectionCard>
                    <SectionTitle>🪪 {{ fr: 'Permis de conduire', ar: 'رخصة القيادة' }[lang]}</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: { fr: 'N° Permis *', ar: 'رقم الرخصة *' }, name: 'licenseNumber', type: 'text' },
                        { label: { fr: 'Expiration', ar: 'انتهاء الصلاحية' }, name: 'licenseExpiration', type: 'date' },
                        { label: { fr: 'Date de délivrance', ar: 'تاريخ الإصدار' }, name: 'licenseDelivery', type: 'date' },
                        { label: { fr: 'Lieu de délivrance', ar: 'مكان الإصدار' }, name: 'licenseDeliveryPlace', type: 'text' },
                      ].map(f => (
                        <div key={f.name}>
                          <FieldLabel>{f.label[lang]}</FieldLabel>
                          <input type={f.type} name={f.name} value={(step2 as any)[f.name]}
                            onChange={handleStep2Change} className={inputClass} style={inputStyle}
                            onFocus={focusInput} onBlur={blurInput} />
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Additional document */}
                  <SectionCard>
                    <SectionTitle>🎫 {{ fr: 'Document additionnel', ar: 'وثيقة إضافية' }[lang]}</SectionTitle>
                    <div>
                      <FieldLabel>{{ fr: 'Type de document', ar: 'نوع الوثيقة' }[lang]}</FieldLabel>
                      <select name="additionalDocType" value={step2.additionalDocType}
                        onChange={handleStep2Change} className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={focusInput} onBlur={blurInput}>
                        <option value="none">{{ fr: 'Aucun', ar: 'بدون' }[lang]}</option>
                        <option value="id_card">{{ fr: "Carte d'identité", ar: 'بطاقة الهوية' }[lang]}</option>
                        <option value="passport">{{ fr: 'Passeport', ar: 'جواز سفر' }[lang]}</option>
                      </select>
                    </div>
                    {step2.additionalDocType !== 'none' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: { fr: 'N° Document', ar: 'رقم الوثيقة' }, name: 'additionalDocNumber', type: 'text' },
                          { label: { fr: 'Date délivrance', ar: 'تاريخ الإصدار' }, name: 'additionalDocDelivery', type: 'date' },
                          { label: { fr: 'Expiration', ar: 'الانتهاء' }, name: 'additionalDocExpiration', type: 'date' },
                          { label: { fr: 'Adresse délivrance', ar: 'عنوان الإصدار' }, name: 'additionalDocDeliveryAddress', type: 'text' },
                        ].map(f => (
                          <div key={f.name}>
                            <FieldLabel>{f.label[lang]}</FieldLabel>
                            <input type={f.type} name={f.name} value={(step2 as any)[f.name]}
                              onChange={handleStep2Change} className={inputClass} style={inputStyle}
                              onFocus={focusInput} onBlur={blurInput} />
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  {/* Scanned docs */}
                  <SectionCard>
                    <SectionTitle>📄 {{ fr: 'Documents scannés', ar: 'الوثائق الممسوحة' }[lang]}</SectionTitle>
                    <p className="text-vel-muted text-sm -mt-2">
                      {{ fr: "Permis de conduire, carte d'identité, etc.", ar: 'رخصة القيادة، بطاقة الهوية، إلخ' }[lang]}
                    </p>
                    <label>
                      <input type="file" multiple accept="image/*,.pdf" onChange={handleDocumentUpload} className="hidden" disabled={uploadingDocument} />
                      <span className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${uploadingDocument ? 'opacity-50' : ''}`}
                        style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: C.violet, fontFamily: 'var(--font-display)' }}>
                        {uploadingDocument ? <><Loader2 size={16} className="animate-spin" /> {lang === 'fr' ? 'Envoi…' : 'جاري…'}</> : <><Upload size={16} /> {{ fr: 'Télécharger', ar: 'تحميل' }[lang]}</>}
                      </span>
                    </label>
                    {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}

                    {step2.scannedDocuments && step2.scannedDocuments.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {step2.scannedDocuments.map((docUrl, index) => (
                          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden"
                            style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
                            {docUrl.includes('data:application/pdf') ? (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(139,92,246,0.08)' }}>
                                <FileText size={28} style={{ color: C.violet }} />
                                <p className="text-xs font-bold" style={{ color: C.violet }}>PDF</p>
                              </div>
                            ) : (
                              <img src={docUrl} alt={`Doc ${index + 1}`} className="w-full h-full object-cover cursor-pointer" onClick={() => window.open(docUrl, '_blank')} />
                            )}
                            <button onClick={() => removeDocument(index)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: '#EF4444' }}>
                              <X size={12} color="white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-vel-dim">
                        <FileText size={36} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{{ fr: 'Aucun document téléchargé', ar: 'لم يتم تحميل أي وثيقة' }[lang]}</p>
                      </div>
                    )}
                  </SectionCard>

                  {/* Address */}
                  <SectionCard>
                    <SectionTitle>🏠 {{ fr: 'Adresse & Localisation', ar: 'العنوان والموقع' }[lang]}</SectionTitle>
                    <div>
                      <FieldLabel>{{ fr: 'Wilaya *', ar: 'الولاية *' }[lang]}</FieldLabel>
                      <select name="wilaya" value={step2.wilaya} onChange={handleStep2Change}
                        className={inputClass} style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={focusInput} onBlur={blurInput}>
                        {ALGERIAN_WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>{{ fr: 'Adresse complète', ar: 'العنوان الكامل' }[lang]}</FieldLabel>
                      <textarea name="completeAddress" value={step2.completeAddress} onChange={handleStep2Change}
                        rows={3} className={`${inputClass} resize-none`} style={inputStyle}
                        placeholder={lang === 'fr' ? 'Rue, N°, Quartier…' : 'الشارع، الرقم، المنطقة…'}
                        onFocus={focusInput} onBlur={blurInput} />
                    </div>
                  </SectionCard>

                  <NavButtons
                    onBack={() => setCurrentStep('step1')}
                    onNext={() => isStep2Valid && setCurrentStep('step3')}
                    nextDisabled={!isStep2Valid}
                    lang={lang}
                  />
                </motion.div>
              )}

              {/* ══ STEP 3 — SERVICES ══ */}
              {currentStep === 'step3' && selectedCar && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <SectionCard>
                    <SectionTitle>🛎️ {{ fr: 'Services supplémentaires', ar: 'الخدمات الإضافية' }[lang]}</SectionTitle>
                    <p className="text-vel-muted text-sm -mt-2">
                      {{ fr: 'Sélectionnez les services que vous souhaitez ajouter', ar: 'اختر الخدمات التي تريد إضافتها' }[lang]}
                    </p>

                    {loadingServices ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 size={28} className="animate-spin" style={{ color: C.cyan }} />
                      </div>
                    ) : services.length === 0 ? (
                      <div className="text-center py-12 text-vel-dim">
                        <p className="font-bold">{{ fr: 'Aucun service disponible', ar: 'لا توجد خدمات' }[lang]}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {services.map((service, i) => {
                          const isSelected = step3.additionalServices.some(s => s.id === service.id);
                          return (
                            <motion.div
                              key={service.id}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.06 }}
                              onClick={() => handleStep3Change({
                                id: service.id,
                                name: service.name || service.service_name,
                                price: service.price,
                                description: service.description,
                                category: service.category || 'service',
                                selected: false,
                              })}
                              className="rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden"
                              style={{
                                background: isSelected ? 'rgba(34,211,238,0.06)' : C.elevated,
                                border: isSelected ? `1px solid rgba(34,211,238,0.4)` : '1px solid rgba(255,255,255,0.06)',
                                boxShadow: isSelected ? '0 0 20px rgba(34,211,238,0.1)' : 'none',
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-vel-white text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                                    {service.name || service.service_name}
                                  </h4>
                                  {service.description && (
                                    <p className="text-vel-muted text-xs mt-1 leading-relaxed">{service.description}</p>
                                  )}
                                  <p className="font-black text-base mt-2" style={{ color: C.cyan }}>
                                    {service.price.toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}
                                  </p>
                                </div>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                                  style={{
                                    background: isSelected ? C.cyan : 'transparent',
                                    border: isSelected ? `2px solid ${C.cyan}` : '2px solid rgba(255,255,255,0.2)',
                                  }}>
                                  {isSelected && <Check size={12} color="#050B18" strokeWidth={3} />}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>

                  {/* Services summary */}
                  <AnimatePresence>
                    {step3.additionalServices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="rounded-2xl p-6 space-y-3"
                        style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}
                      >
                        <h4 className="font-black text-vel-white" style={{ fontFamily: 'var(--font-display)' }}>
                          🛒 {{ fr: 'Services sélectionnés', ar: 'الخدمات المختارة' }[lang]}
                        </h4>
                        {step3.additionalServices.map(s => (
                          <div key={s.id} className="flex justify-between items-center text-sm">
                            <span className="text-vel-silver">{s.name}</span>
                            <span className="font-bold" style={{ color: C.cyan }}>{s.price.toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}</span>
                          </div>
                        ))}
                        <div className="pt-3 flex justify-between items-center font-black text-base" style={{ borderTop: '1px solid rgba(34,211,238,0.2)' }}>
                          <span className="text-vel-white">{{ fr: 'Total services', ar: 'إجمالي الخدمات' }[lang]}</span>
                          <span style={{ color: C.cyan }}>{step3.additionalServices.reduce((s, x) => s + x.price, 0).toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <NavButtons
                    onBack={() => setCurrentStep('step2')}
                    onNext={() => setCurrentStep('step4')}
                    lang={lang}
                  />
                </motion.div>
              )}

              {/* ══ STEP 4 — FINAL PRICING ══ */}
              {currentStep === 'step4' && selectedCar && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Summary */}
                  <SectionCard>
                    <SectionTitle>📋 {{ fr: 'Résumé de la réservation', ar: 'ملخص الحجز' }[lang]}</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: '🚗', label: { fr: 'Véhicule', ar: 'المركبة' }, value: `${selectedCar.brand} ${selectedCar.model}`, sub: selectedCar.registration },
                        { icon: '📅', label: { fr: 'Période', ar: 'الفترة' }, value: `${step1.departureDate} → ${step1.returnDate}`, sub: `${days} {{ fr: 'jours', ar: 'أيام' }[lang]}` },
                        { icon: '👤', label: { fr: 'Client', ar: 'العميل' }, value: `${step2.firstName} ${step2.lastName}`, sub: step2.phone },
                        { icon: '📍', label: { fr: 'Wilaya', ar: 'الولاية' }, value: step2.wilaya, sub: '' },
                      ].map((item, i) => (
                        <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-xs text-vel-muted mb-1">{item.icon} {item.label[lang]}</p>
                          <p className="font-bold text-vel-white text-sm">{item.value}</p>
                          {item.sub && <p className="text-xs text-vel-muted mt-0.5">{item.sub}</p>}
                        </div>
                      ))}
                    </div>
                  </SectionCard>

                  {/* Pricing */}
                  <SectionCard>
                    <SectionTitle>💰 {{ fr: 'Tarification', ar: 'التسعير' }[lang]}</SectionTitle>

                    <div className="space-y-3">
                      {/* Base price */}
                      <div className="flex justify-between items-center px-4 py-3 rounded-xl text-sm"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span className="text-vel-silver">
                          {days} {{ fr: 'j ×', ar: 'يوم ×' }[lang]} {selectedCar.priceDay.toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}
                        </span>
                        <span className="font-bold text-vel-white">{totalPrice.toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}</span>
                      </div>

                      {/* Services */}
                      {step3.additionalServices.map(s => (
                        <div key={s.id} className="flex justify-between items-center px-4 py-3 rounded-xl text-sm"
                          style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                          <span className="text-vel-silver">{s.name}</span>
                          <span className="font-bold" style={{ color: C.violet }}>{s.price.toLocaleString()} {{ fr: 'DA', ar: 'د.ج' }[lang]}</span>
                        </div>
                      ))}

                      {/* Total */}
                      <div className="flex justify-between items-center px-4 py-4 rounded-2xl"
                        style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.25)' }}>
                        <span className="font-black text-vel-white" style={{ fontFamily: 'var(--font-display)' }}>
                          {{ fr: 'TOTAL', ar: 'المجموع' }[lang]}
                        </span>
                        <span className="font-black text-3xl" style={{ color: C.cyan, fontFamily: 'var(--font-display)', textShadow: '0 0 20px rgba(34,211,238,0.5)' }}>
                          {(totalPrice + step3.additionalServices.reduce((s, x) => s + x.price, 0)).toLocaleString()}
                          <span className="text-base ml-1" style={{ color: 'rgba(34,211,238,0.65)' }}>{{ fr: 'DA', ar: 'د.ج' }[lang]}</span>
                        </span>
                      </div>
                    </div>
                  </SectionCard>

                  {/* Confirm banner */}
                  <div className="rounded-2xl p-6" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)' }}>
                    <h3 className="font-black text-vel-white text-lg mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                      ✅ {{ fr: 'Prêt à confirmer ?', ar: 'جاهز للتأكيد؟' }[lang]}
                    </h3>
                    <p className="text-vel-muted text-sm">
                      {{ fr: "Cliquez sur confirmer. Nous vous appellerons bientôt pour valider la réservation.", ar: 'انقر تأكيد. سنتصل بك قريباً للتحقق.' }[lang]}
                    </p>
                  </div>

                  {/* Final nav */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep('step3')}
                      className="btn-vel-ghost flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold"
                    >
                      <ChevronLeft size={18} /> {{ fr: 'Retour', ar: 'السابق' }[lang]}
                    </button>
                    <motion.button
                      onClick={handleConfirmReservation}
                      disabled={isSubmitting || uploadingProfile || uploadingDocument}
                      whileHover={isSubmitting ? {} : { scale: 1.02 }}
                      whileTap={isSubmitting ? {} : { scale: 0.98 }}
                      className={`btn-vel-cyan flex-1 py-4 flex items-center justify-center gap-2 text-sm ${(isSubmitting || uploadingProfile || uploadingDocument) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <><Loader2 size={18} className="animate-spin" /> {lang === 'fr' ? 'En cours…' : 'جاري…'}</>
                      ) : (
                        <>✅ {{ fr: 'Confirmer la réservation', ar: 'تأكيد الحجز' }[lang]}</>
                      )}
                    </motion.button>
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

// ─── Nav Buttons shared component ────────────────────────────────────────────
function NavButtons({ onBack, onNext, nextDisabled = false, lang }: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  lang: Language;
}) {
  return (
    <div className="flex gap-4 pt-2">
      <button
        onClick={onBack}
        className="btn-vel-ghost flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold"
      >
        <ChevronLeft size={18} /> {{ fr: 'Retour', ar: 'السابق' }[lang]}
      </button>
      <motion.button
        onClick={onNext}
        disabled={nextDisabled}
        whileHover={nextDisabled ? {} : { scale: 1.02 }}
        whileTap={nextDisabled ? {} : { scale: 0.98 }}
        className={`btn-vel-cyan flex-1 py-4 flex items-center justify-center gap-2 text-sm ${nextDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {{ fr: 'Suivant', ar: 'التالي' }[lang]} <ChevronRight size={18} />
      </motion.button>
    </div>
  );
}
