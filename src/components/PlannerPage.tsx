import React, { useState, useEffect, useRef } from 'react';
import { Language, ReservationDetails, Client, Car } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, Car as CarIcon, Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, Fuel, Camera, FileText, CreditCard, DollarSign, Printer, AlertTriangle, MoreVertical, Grid3x3, CalendarDays, X } from 'lucide-react';
import { ReservationDetailsView } from './ReservationDetailsView';
import { CreateReservationForm } from './CreateReservationForm';
import { EditReservationForm } from './EditReservationForm';
import { ActivationModal, CompletionModal } from './ReservationDetailsView';
import { ReservationTimelineView } from './ReservationTimelineView';
import { ConditionsPersonalizer } from './ConditionsPersonalizer';
import { SendContractModal } from './SendContractModal';
import { ReservationsService } from '../services/ReservationsService';
import { DatabaseService } from '../services/DatabaseService';
import { supabase } from '../supabase';

interface PlannerPageProps {
  lang: Language;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ lang }) => {
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'create' | 'details' | 'edit'>('list');
  const [displayMode, setDisplayMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedReservation, setSelectedReservation] = useState<ReservationDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedReservationForActivation, setSelectedReservationForActivation] = useState<ReservationDetails | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedReservationForCompletion, setSelectedReservationForCompletion] = useState<ReservationDetails | null>(null);

  // Dropdown direction for print menu per reservation
  const [menuDirections, setMenuDirections] = useState<{[id: string]: 'left' | 'right'}>({});
  const buttonRefs = useRef<{[id: string]: HTMLButtonElement | null}>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ReservationDetails | null>(null);
  const [openPrintMenu, setOpenPrintMenu] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<{reservation: ReservationDetails, type: string} | null>(null);
  const [showPersonalization, setShowPersonalization] = useState<{reservation: ReservationDetails, type: string} | null>(null);
  const [showSendContractModal, setShowSendContractModal] = useState<ReservationDetails | null>(null);
  const [showInspectionMode, setShowInspectionMode] = useState(false);
  const [showConditionsModal, setShowConditionsModal] = useState(false);
  const [showConditionsPersonalizer, setShowConditionsPersonalizer] = useState<ReservationDetails | null>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reservations from database
  const [reservations, setReservations] = useState<ReservationDetails[]>([]);

  // Load reservations and agencies from database on component mount
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setIsLoading(true);
        const data = await ReservationsService.getReservations();
        setReservations(data);
        setError(null);

        // Only restore view state if we have a valid selected reservation
        // This prevents auto-loading create/edit views on fresh navigation
        const savedViewState = localStorage.getItem('plannerViewState');
        if (savedViewState) {
          try {
            const { view, selectedId } = JSON.parse(savedViewState);
            
            if (selectedId && data.length > 0) {
              const selected = data.find(r => r.id === selectedId);
              if (selected && view && ['details', 'edit'].includes(view)) {
                // Only restore if view is details or edit (not create)
                setSelectedReservation(selected);
                setCurrentView(view);
              } else {
                // Clear invalid saved state
                localStorage.removeItem('plannerViewState');
              }
            } else {
              // Clear if no selectedId or no reservations
              localStorage.removeItem('plannerViewState');
            }
          } catch (err) {
            // Silent fail for view state restore
            localStorage.removeItem('plannerViewState');
          }
        }
      } catch (err: any) {
        console.error('Error loading reservations:', err);
        // Check if it's a table not found error
        if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
          setError('📋 Database setup required. Please run the SQL setup in Supabase.');
        } else {
          setError(`Error loading reservations: ${err?.message || 'Unknown error'}`);
        }
        setReservations([]);
      } finally {
        setIsLoading(false);
      }
    };

    const loadAgencies = async () => {
      try {
        const data = await DatabaseService.getAgencies();
        setAgencies(data);
      } catch (err) {
        console.error('Error loading agencies:', err);
      } finally {
        setIsLoadingAgencies(false);
      }
    };

    loadReservations();
    loadAgencies();
  }, []);

  const updateReservation = async (updatedReservation: ReservationDetails) => {
    try {
      // Update reservation in database
      await ReservationsService.updateReservation(updatedReservation.id, updatedReservation);

      // Refetch the latest reservation data from database to ensure accuracy
      const freshReservation = await ReservationsService.getReservationById(updatedReservation.id);

      // Update local state with fresh data
      setReservations(prev => {
        return prev.map(res => res.id === freshReservation.id ? freshReservation : res);
      });

      // Update selected reservation with fresh data
      if (selectedReservation && selectedReservation.id === freshReservation.id) {
        setSelectedReservation(freshReservation);
      }
    } catch (err) {
      console.error('❌ Error updating reservation:', err);
      setError('Failed to update reservation');
    }
  };

  // Save view state when it changes (for page refresh persistence)
  useEffect(() => {
    if (currentView !== 'list' && currentView !== 'calendar' && selectedReservation) {
      const viewState = {
        view: currentView,
        selectedId: selectedReservation.id
      };
      localStorage.setItem('plannerViewState', JSON.stringify(viewState));
    }
  }, [currentView, selectedReservation?.id]);

  // Clear view state when returning to list/calendar
  const handleReturnToList = () => {
    localStorage.removeItem('plannerViewState');
    setCurrentView(displayMode === 'calendar' ? 'calendar' : 'list');
  };

  const handleViewDetails = (reservation: ReservationDetails) => {
    setSelectedReservation(reservation);
    setCurrentView('details');
  };

  const handleEdit = (reservation: ReservationDetails) => {
    setSelectedReservation(reservation);
    setCurrentView('edit');
  };

  const handleDelete = (reservation: ReservationDetails) => {
    setShowDeleteConfirm(reservation);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      try {
        await ReservationsService.deleteReservation(showDeleteConfirm.id);
        setReservations(prev => prev.filter(res => res.id !== showDeleteConfirm.id));
        setShowDeleteConfirm(null);
      } catch (err) {
        console.error('Error deleting reservation:', err);
        setError('Failed to delete reservation');
      }
    }
  };

  const handlePrint = (reservation: ReservationDetails, type: 'quote' | 'contract' | 'invoice' | 'payment' | 'engagement' | 'versement') => {
    setOpenPrintMenu(null);
    setShowPrintModal({reservation, type});
  };

  const handlePrintChoice = async (choice: 'same' | 'personalise') => {
    if (!showPrintModal) return;

    if (choice === 'same') {
      // Print same template using the professional contract template from PersonalizationModal
      setShowPersonalization({
        reservation: showPrintModal.reservation,
        type: showPrintModal.type
      });
    } else {
      setShowPersonalization(showPrintModal);
    }
    setShowPrintModal(null);
  };

  const generatePrintContent = (reservation: ReservationDetails, type: string) => {
    const title = type === 'quote' ? (lang === 'fr' ? 'Devis' : 'عرض أسعار') :
                  type === 'contract' ? (lang === 'fr' ? 'Contrat de Location' : 'عقد التأجير') :
                  type === 'invoice' ? (lang === 'fr' ? 'Facture' : 'الفاتورة') :
                  type === 'engagement' ? (lang === 'fr' ? 'Lettre d\'Engagement' : 'رسالة التزام') :
                  (lang === 'fr' ? 'Reçu de Paiement' : 'إيصال الدفع');
    
    return `
      <!DOCTYPE html>
      <html dir="${lang === 'fr' ? 'ltr' : 'rtl'}">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .section { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
          .detail { display: flex; justify-content: space-between; margin: 5px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        
        <div class="section">
          <h3>${lang === 'fr' ? 'Informations Réservation' : 'معلومات الحجز'}</h3>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'N° Réservation:' : 'رقم الحجز:'}</span>
            <span>${reservation.id}</span>
          </div>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Date:' : 'التاريخ:'}</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>${lang === 'fr' ? 'Client' : 'العميل'}</h3>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Nom:' : 'الاسم:'}</span>
            <span>${reservation.client.firstName} ${reservation.client.lastName}</span>
          </div>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Téléphone:' : 'الهاتف:'}</span>
            <span>${reservation.client.phone}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>${lang === 'fr' ? 'Véhicule' : 'المركبة'}</h3>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Voiture:' : 'السيارة:'}</span>
            <span>${reservation.car.brand} ${reservation.car.model}</span>
          </div>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Immatriculation:' : 'رقم التسجيل:'}</span>
            <span>${reservation.car.registration}</span>
          </div>
        </div>
        
        <div class="section">
          <h3>${lang === 'fr' ? 'Détails Financiers' : 'التفاصيل المالية'}</h3>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Durée:' : 'المدة:'}</span>
            <span>${reservation.totalDays} ${lang === 'fr' ? 'jours' : 'أيام'}</span>
          </div>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Prix Total:' : 'السعر الإجمالي:'}</span>
            <span>${reservation.totalPrice.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}</span>
          </div>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Acompte:' : 'الدفعة المقدمة:'}</span>
            <span>${reservation.advancePayment.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}</span>
          </div>
          <div class="detail">
            <span class="label">${lang === 'fr' ? 'Reste à Payer:' : 'المبلغ المتبقي:'}</span>
            <span>${reservation.remainingPayment.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>${lang === 'fr' ? 'Document généré le' : 'تم إنشاء المستند في'} ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleActivate = (reservation: ReservationDetails) => {
    setSelectedReservationForActivation(reservation);
    setShowActivationModal(true);
  };

  const handleComplete = (reservation: ReservationDetails) => {
    setSelectedReservationForCompletion(reservation);
    setShowCompletionModal(true);
  };

  const filteredReservations = reservations.filter(reservation => {
    // Add safety checks for client and car
    if (!reservation.client || !reservation.car) {
      return false;
    }

    const matchesSearch = (reservation.client.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (reservation.client.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (reservation.car.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (reservation.car.model || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || reservation.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (currentView === 'create') {
    return (
      <CreateReservationForm 
        lang={lang} 
        defaultStatus="confirmed"
        onBack={async () => {
          setCurrentView('list');
          setShowInspectionMode(false);
          setSelectedReservation(null);
          // Reload reservations after creating a new one
          try {
            const data = await ReservationsService.getReservations();
            setReservations(data);
          } catch (err) {
            console.error('Error reloading reservations:', err);
          }
        }}
        inspectionMode={showInspectionMode}
        initialData={showInspectionMode && selectedReservation ? selectedReservation : undefined}
      />
    );
  }

  if (currentView === 'calendar' && displayMode === 'calendar') {
    return (
      <div className="space-y-8">
        <ReservationTimelineView 
          lang={lang} 
          reservations={reservations}
          onSelectReservation={(res) => {
            setSelectedReservation(res);
            setCurrentView('details');
          }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setCurrentView('list');
            setDisplayMode('grid');
          }}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <Grid3x3 className="w-4 h-4" />
          {lang === 'fr' ? 'Vue Liste' : 'عرض القائمة'}
        </motion.button>
      </div>
    );
  }

  if (currentView === 'details' && selectedReservation) {
    return <ReservationDetailsView 
      lang={lang} 
      reservation={selectedReservation} 
      onBack={() => {
        localStorage.removeItem('plannerViewState');
        setCurrentView(displayMode === 'calendar' ? 'calendar' : 'list');
      }} 
      onUpdate={updateReservation} 
    />;
  }

  if (currentView === 'edit' && selectedReservation) {
    return <EditReservationForm 
      lang={lang} 
      reservation={selectedReservation} 
      onBack={() => {
        localStorage.removeItem('plannerViewState');
        setCurrentView(displayMode === 'calendar' ? 'calendar' : 'list');
      }} 
      onUpdate={updateReservation}
      agencies={agencies}
      isLoadingAgencies={isLoadingAgencies}
    />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-saas-text-main uppercase tracking-tighter">
          📅 {lang === 'fr' ? 'Planificateur' : 'المخطط'}
        </h2>
        <p className="text-saas-text-muted font-bold uppercase text-[10px] tracking-widest">
          {lang === 'fr' ? 'Gestion des réservations' : 'إدارة الحجوزات'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Rechercher...' : 'البحث...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{lang === 'fr' ? 'Tous les statuts' : 'جميع الحالات'}</option>
            <option value="pending">{lang === 'fr' ? 'En attente' : 'في الانتظار'}</option>
            <option value="accepted">{lang === 'fr' ? 'Accepté' : 'مقبول'}</option>
            <option value="confirmed">{lang === 'fr' ? 'Confirmé' : 'مؤكد'}</option>
            <option value="active">{lang === 'fr' ? 'Actif' : 'نشط'}</option>
            <option value="completed">{lang === 'fr' ? 'Terminé' : 'مكتمل'}</option>
            <option value="cancelled">{lang === 'fr' ? 'Annulé' : 'ملغي'}</option>
          </select>
        </div>

        {/* View Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setDisplayMode('calendar');
            setCurrentView('calendar');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all"
          title={lang === 'fr' ? 'Voir le calendrier' : 'عرض التقويم'}
        >
          <CalendarDays className="w-4 h-4" />
          {lang === 'fr' ? 'Calendrier' : 'التقويم'}
        </motion.button>

        {/* Add New Reservation */}
        <button
          onClick={() => setCurrentView('create')}
          className="btn-saas-primary"
        >
          <Plus className="w-4 h-4" />
          {lang === 'fr' ? 'Nouvelle Réservation' : 'حجز جديد'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center gap-2"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500">{lang === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
          </div>
        </div>
      )}

      {/* Reservations Grid */}
      {!isLoading && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReservations.map((reservation) => {
          // Skip rendering if client or car data is missing
          if (!reservation.client || !reservation.car) {
            return null;
          }

          // Financial calculations: compute base vehicle price from rates and days
          const servicesTotal = (reservation.additionalServices || []).reduce((sum, s) => sum + (s.price || 0), 0);
          const days = Number(reservation.totalDays) || 0;
          const weeks = Math.floor(days / 7);
          const remainingDays = days % 7;
          const priceDay = reservation.car?.priceDay || reservation.car?.priceDay || 0;
          const priceWeek = reservation.car?.priceWeek || (priceDay * 7);
          const weeklyPrice = priceWeek * weeks;
          const remainingPrice = priceDay * remainingDays;
          const basePrice = weeklyPrice + remainingPrice;
          const subtotal = basePrice + servicesTotal;
          const totalCost = subtotal + (Number(reservation.additionalFees) || 0) + (Number((reservation as any).tvaAmount) || 0);
          
          // Use the actual totalPrice from database, not the recalculated one
          const displayTotalPrice = reservation.totalPrice || totalCost;
          
          const paidAmount = (reservation.payments && reservation.payments.length > 0)
            ? reservation.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
            : (Number(reservation.advancePayment) || 0);
          const remainingAmount = Math.max(0, displayTotalPrice - paidAmount);

          return (
          <motion.div
            key={reservation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col relative"
          >
            {/* Car Image */}
            <div className="relative h-48 overflow-hidden rounded-t-2xl">
              <img
                src={reservation.car.images?.[0] || 'https://picsum.photos/seed/car/400/300'}
                alt={`${reservation.car.brand} ${reservation.car.model}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Client Avatar - Circular with Border */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-lg bg-slate-100 flex items-center justify-center">
                {reservation.client.profilePhoto ? (
                  <img
                    src={reservation.client.profilePhoto}
                    alt={`${reservation.client.firstName} ${reservation.client.lastName}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  reservation.status === 'accepted' ? 'bg-teal-100 text-teal-800' :
                  reservation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  reservation.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {reservation.status === 'confirmed' ? '✅ Confirmé' :
                   reservation.status === 'accepted' ? '✅ Accepté' :
                   reservation.status === 'active' ? '🔄 Actif' :
                   reservation.status === 'completed' ? '🏁 Terminé' :
                   '⏳ En attente'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Client & Car Info */}
              <div className="space-y-3 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {reservation.client.firstName} {reservation.client.lastName}
                  </h3>
                  <p className="text-sm text-slate-600">
                    📱 {reservation.client.phone}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    🚗 {reservation.car.brand} {reservation.car.model}
                  </h4>
                  <p className="text-sm text-slate-600">
                    🏷️ {reservation.car.registration}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{reservation.step1.departureDate} → {reservation.step1.returnDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{reservation.totalDays} {lang === 'fr' ? 'jours' : 'أيام'}</span>
                </div>
                <div className="mt-3 p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-slate-500">{lang === 'fr' ? 'Total Réservation' : 'الإجمالي'}</div>
                      <div className="text-xl font-black text-slate-900">{displayTotalPrice.toLocaleString()} {lang === 'fr' ? 'DA' : 'د.ج'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">{lang === 'fr' ? 'Payé' : 'مدفوع'}</div>
                      <div className="text-lg font-bold text-green-700">{paidAmount.toLocaleString()} {lang === 'fr' ? 'DA' : 'د.ج'}</div>
                      <div className="text-xs text-slate-400">{lang === 'fr' ? `(${servicesTotal.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'} services)` : `(${servicesTotal.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'} خدمات)`}</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className={`h-2 rounded-full ${remainingAmount === 0 ? 'bg-green-500' : 'bg-orange-400'}`}
                      style={{ width: `${Math.min(100, Math.round((paidAmount / (displayTotalPrice || 1)) * 100))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-slate-600">{lang === 'fr' ? 'Reste à payer' : 'المتبقي'}</div>
                    <div className={`font-bold ${remainingAmount === 0 ? 'text-green-700' : 'text-red-700'}`}>{remainingAmount.toLocaleString()} {lang === 'fr' ? 'DA' : 'د.ج'}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleViewDetails(reservation)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  👁️ {lang === 'fr' ? 'Détails' : 'التفاصيل'}
                </button>
                <button
                  onClick={() => handleEdit(reservation)}
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  ✏️ {lang === 'fr' ? 'Modifier' : 'تعديل'}
                </button>
                <button
                  onClick={() => handleDelete(reservation)}
                  className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>

              {/* Special Actions Row */}
              <div className="flex gap-2 items-center flex-wrap">
                {/* Pending Status - Start Inspection */}
                {reservation.status === 'pending' && (
                  <button
                    onClick={() => {
                      // Open inspection mode for pending reservation
                      setSelectedReservation(reservation);
                      setShowInspectionMode(true);
                      setCurrentView('create');
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    📋 {lang === 'fr' ? 'Inspection' : 'الفحص'}
                  </button>
                )}

                {/* Accepted Status - Start Inspection (same as pending) */}
                {reservation.status === 'accepted' && (
                  <button
                    onClick={() => {
                      // Open inspection mode for accepted reservation in edit mode
                      setSelectedReservation({ ...reservation });
                      setShowInspectionMode(true);
                      setCurrentView('edit');
                    }}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    📋 {lang === 'fr' ? 'Inspection' : 'الفحص'}
                  </button>
                )}

                {/* Confirmed Status - Activate Button */}
                {reservation.status === 'confirmed' && (
                  <button
                    onClick={() => handleActivate(reservation)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    ✅ {lang === 'fr' ? 'Activer' : 'تفعيل'}
                  </button>
                )}

                {/* Active Status - Complete Button */}
                {reservation.status === 'active' && (
                  <button
                    onClick={() => handleComplete(reservation)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                  >
                    🏁 {lang === 'fr' ? 'Terminer' : 'إنهاء'}
                  </button>
                )}

                {/* Print Menu Button */}
                <div className="relative">
                  <button
                    ref={el => (buttonRefs.current[reservation.id] = el)}
                    onClick={() => {
                      const btn = buttonRefs.current[reservation.id];
                      if (btn) {
                        const rect = btn.getBoundingClientRect();
                        const card = btn.closest('.bg-white.rounded-2xl');
                        if (card instanceof HTMLElement) {
                          const cardRect = card.getBoundingClientRect();
                          const spaceRight = cardRect.right - rect.right;
                          const menuWidth = 200; // approximate
                          setMenuDirections(prev => ({
                            ...prev,
                            [reservation.id]: spaceRight < menuWidth ? 'left' : 'right'
                          }));
                        }
                      }
                      setOpenPrintMenu(openPrintMenu === reservation.id ? null : reservation.id);
                    }}
                    className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors flex items-center gap-1"
                    title={lang === 'fr' ? 'Plus d\'options' : 'خيارات أكثر'}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {openPrintMenu === reservation.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute bottom-12 bg-white rounded-lg shadow-2xl border border-saas-border z-50 min-w-max overflow-hidden ${menuDirections[reservation.id] === 'left' ? 'right-0' : 'left-0'}` }
                      >
                        <button
                          onClick={() => handlePrint(reservation, 'quote')}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-saas-text-main font-bold flex items-center gap-2 border-b border-saas-border transition-colors"
                        >
                          📋 {lang === 'fr' ? 'Devis' : 'عرض أسعار'}
                        </button>
                        <button
                          onClick={() => handlePrint(reservation, 'contract')}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-saas-text-main font-bold flex items-center gap-2 border-b border-saas-border transition-colors"
                        >
                          📄 {lang === 'fr' ? 'Contrat' : 'عقد'}
                        </button>
                        <button
                          onClick={() => handlePrint(reservation, 'invoice')}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-saas-text-main font-bold flex items-center gap-2 border-b border-saas-border transition-colors"
                        >
                          🧾 {lang === 'fr' ? 'Facture' : 'الفاتورة'}
                        </button>
                        <button
                          onClick={() => handlePrint(reservation, 'versement')}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-saas-text-main font-bold flex items-center gap-2 border-b border-saas-border transition-colors"
                        >
                          💳 {lang === 'fr' ? 'Reçu' : 'إيصال'}
                        </button>
                        <button
                          onClick={() => handlePrint(reservation, 'engagement')}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-saas-text-main font-bold flex items-center gap-2 border-b border-saas-border transition-colors"
                        >
                          🤝 {lang === 'fr' ? 'Engagement' : 'التزام'}
                        </button>
                        <button
                          onClick={() => {
                            setShowSendContractModal(reservation);
                            setOpenPrintMenu(null);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 text-saas-text-main font-bold flex items-center gap-2 transition-colors"
                        >
                          📧 {lang === 'fr' ? 'Envoyer par Email' : 'إرسال بالبريد الإلكتروني'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
          );
        })}
      </div>
      )}

      {filteredReservations.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">
            {lang === 'fr' ? 'Aucune réservation trouvée' : 'لم يتم العثور على حجوزات'}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-sm w-full p-6 border border-saas-border"
            >
              <h3 className="text-lg font-black text-saas-text-main mb-4">
                ⚠️ {lang === 'fr' ? 'Confirmer la Suppression' : 'تأكيد الحذف'}
              </h3>
              <p className="text-saas-text-muted mb-6">
                {lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action ne peut pas être annulée.' : 'هل أنت متأكد من حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-saas-bg hover:bg-saas-secondary-start/10 text-saas-text-muted font-bold py-2 px-4 rounded-lg border border-saas-border hover:border-saas-secondary-start/20 transition-all"
                >
                  {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 btn-saas-danger"
                >
                  🗑️ {lang === 'fr' ? 'Supprimer' : 'حذف'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Choice Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card max-w-md w-full p-6 border border-saas-border"
            >
              <h3 className="text-xl font-black text-saas-text-main mb-6">
                🖨️ {lang === 'fr' ? 'Options d\'Impression' : 'خيارات الطباعة'}
              </h3>
              <p className="text-saas-text-muted mb-6">
                {lang === 'fr' ? 'Choisissez le mode d\'impression :' : 'اختر وضع الطباعة:'}
              </p>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => handlePrintChoice('same')}
                  className="flex-1 bg-saas-primary-start hover:bg-saas-primary-end text-white font-bold py-3 px-4 rounded-lg transition-all"
                >
                  📄 {lang === 'fr' ? 'Même Modèle' : 'نفس النموذج'}
                </button>
                <button
                  onClick={() => handlePrintChoice('personalise')}
                  className="flex-1 bg-saas-secondary-start hover:bg-saas-secondary-end text-white font-bold py-3 px-4 rounded-lg transition-all"
                >
                  🎨 {lang === 'fr' ? 'Personnaliser' : 'تخصيص'}
            </button>
          </div>
          {showPrintModal?.type === 'contract' && (
            <>
              <button
                onClick={() => {
                  setShowPrintModal(null);
                  setShowConditionsPersonalizer(showPrintModal?.reservation || null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all mb-3"
              >
                📋 {lang === 'fr' ? 'Personnaliser les Conditions' : 'تخصيص الشروط'}
              </button>
              <button
                onClick={() => {
                  setShowPrintModal(null);
                  // Trigger conditions print
                  setTimeout(() => {
                    setShowConditionsPersonalizer(showPrintModal?.reservation || null);
                    // This will be handled by the conditions personalizer's print button
                  }, 100);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
              >
                🖨️ {lang === 'fr' ? 'Imprimer les Conditions' : 'طباعة الشروط'}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Personalization Modal */}
  <AnimatePresence>
        {showPersonalization && (
          <PersonalizationModal
            lang={lang}
            reservation={showPersonalization.reservation}
            type={showPersonalization.type}
            onClose={() => setShowPersonalization(null)}
            onPrint={(content) => {
              const printWindow = window.open('', '', 'height=600,width=800');
              if (printWindow) {
                printWindow.document.write(content);
                printWindow.document.close();
                printWindow.print();
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Conditions Modal */}
      <AnimatePresence>
        {showConditionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-4xl p-8 border border-saas-border rounded-xl my-4"
            >
              {/* Header */}
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-black text-saas-text-main mb-2">
                  📋 {lang === 'fr' ? 'Conditions de Location' : 'شروط الإيجار'}
                </h2>
              </div>

              {/* Conditions Content - Simplified Clean Design */}
              <div className="bg-white p-6 rounded-lg border-2 border-blue-200 mb-6 max-h-96 overflow-y-auto">
                <div className="space-y-3 text-gray-800" style={{ textAlign: 'right', direction: 'rtl' }}>
                  <ol className="space-y-2 text-sm leading-relaxed">
                    <li><strong>السن:</strong> يجب أن يكون السائق 20 عاماً على الأقل، مع رخصة قيادة منذ سنتين على الأقل.</li>
                    <li><strong>جواز السفر:</strong> إيداع جواز السفر البيومتري + تأمين ابتدائي من 30,000.00 دج.</li>
                    <li><strong>الوقود:</strong> الوقود على نفقة الزبون.</li>
                    <li><strong>الدفع:</strong> يتم الدفع نقداً عند تسليم السيارة.</li>
                    <li><strong>النظافة:</strong> السيارة تُسلم نظيفة وتُرجع بنفس الحالة، وإلا غرامة غسيل 1000 دج.</li>
                    <li><strong>مكان التسليم:</strong> موقف السيارات التابع للوكالة.</li>
                    <li><strong>المواعيد:</strong> احترام المواعيد، إشعار مسبق 48 ساعة لأي تغيير.</li>
                    <li><strong>الأضرار:</strong> الزبون يدفع جميع الأضرار بالمركبة.</li>
                    <li><strong>السرقة:</strong> تقديم تصريح للشرطة أو الدرك فوراً.</li>
                    <li><strong>التأمين:</strong> منع إعارة أو تأجير المركبة من الباطن.</li>
                    <li><strong>الصيانة:</strong> فحص مستوى الزيت والضغط والمحرك.</li>
                    <li><strong>أضرار إضافية:</strong> جميع الأضرار الناتجة عن سوء الاستخدام على الزبون.</li>
                    <li><strong>التأخير:</strong> 800 دج لكل ساعة تأخير.</li>
                    <li><strong>الأميال:</strong> حد أقصى 300 كم يومياً، غرامة 30 دج/كم زائد.</li>
                    <li><strong>الموافقة:</strong> الزبون يقر بقراءة الشروط وقبولها.</li>
                  </ol>
                </div>
              </div>

              {/* Signature Area - Simple Clean Design */}
              <div className="grid grid-cols-2 gap-8">
                {/* Client Signature */}
                <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="mb-16 h-24 border-b-2 border-gray-400"></div>
                  <p className="text-center font-bold text-gray-800 text-sm">
                    امضاء وبصمة الزبون
                  </p>
                </div>

                {/* Agency Signature */}
                <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="mb-16 h-24 border-b-2 border-gray-400"></div>
                  <p className="text-center font-bold text-gray-800 text-sm">
                    توقيع وبصمة الوكالة
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap mt-6">
                <button
                  onClick={() => {
                    const content = `
                      <!DOCTYPE html>
                      <html dir="rtl" lang="ar">
                      <head>
                        <meta charset="utf-8">
                        <style>
                          body { 
                            font-family: 'Arial', sans-serif; 
                            padding: 40px; 
                            direction: rtl; 
                            margin: 0;
                            background: white;
                          }
                          .header { 
                            text-align: center; 
                            margin-bottom: 30px; 
                          }
                          .header h1 { 
                            font-size: 20px; 
                            margin: 0 0 5px 0; 
                            color: #1a3a52;
                            font-weight: bold;
                          }
                          .conditions { 
                            background: white; 
                            padding: 20px; 
                            border-radius: 4px; 
                            border: 1px solid #ddd;
                            margin-bottom: 30px;
                          }
                          .conditions ol { 
                            margin: 0; 
                            padding-right: 20px;
                          }
                          .conditions li { 
                            margin-bottom: 8px; 
                            line-height: 1.5; 
                            font-size: 13px;
                          }
                          .conditions strong { 
                            color: #1a3a52; 
                          }
                          .signatures { 
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 30px;
                            margin-top: 40px;
                          }
                          .signature-box { 
                            border: 2px solid #999; 
                            padding: 20px; 
                            background: #f9f9f9;
                            border-radius: 4px;
                          }
                          .signature-space {
                            height: 80px;
                            border-bottom: 2px solid #333;
                            margin-bottom: 15px;
                          }
                          .signature-label { 
                            font-size: 13px; 
                            color: #333; 
                            font-weight: bold; 
                            text-align: center;
                          }
                          @media print { 
                            body { padding: 20px; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>شروط الإيجار</h1>
                        </div>
                        <div class="conditions">
                          <ol>
                            <li><strong>السن:</strong> يجب أن يكون السائق 20 عاماً على الأقل، مع رخصة قيادة منذ سنتين على الأقل.</li>
                            <li><strong>جواز السفر:</strong> إيداع جواز السفر البيومتري + تأمين ابتدائي من 30,000.00 دج.</li>
                            <li><strong>الوقود:</strong> الوقود على نفقة الزبون.</li>
                            <li><strong>الدفع:</strong> يتم الدفع نقداً عند تسليم السيارة.</li>
                            <li><strong>النظافة:</strong> السيارة تُسلم نظيفة وتُرجع بنفس الحالة، وإلا غرامة غسيل 1000 دج.</li>
                            <li><strong>مكان التسليم:</strong> موقف السيارات التابع للوكالة.</li>
                            <li><strong>المواعيد:</strong> احترام المواعيد، إشعار مسبق 48 ساعة لأي تغيير.</li>
                            <li><strong>الأضرار:</strong> الزبون يدفع جميع الأضرار بالمركبة.</li>
                            <li><strong>السرقة:</strong> تقديم تصريح للشرطة أو الدرك فوراً.</li>
                            <li><strong>التأمين:</strong> منع إعارة أو تأجير المركبة من الباطن.</li>
                            <li><strong>الصيانة:</strong> فحص مستوى الزيت والضغط والمحرك.</li>
                            <li><strong>أضرار إضافية:</strong> جميع الأضرار الناتجة عن سوء الاستخدام على الزبون.</li>
                            <li><strong>التأخير:</strong> 800 دج لكل ساعة تأخير.</li>
                            <li><strong>الأميال:</strong> حد أقصى 300 كم يومياً، غرامة 30 دج/كم زائد.</li>
                            <li><strong>الموافقة:</strong> الزبون يقر بقراءة الشروط وقبولها.</li>
                          </ol>
                        </div>
                        <div class="signatures">
                          <div class="signature-box">
                            <div class="signature-space"></div>
                            <div class="signature-label">امضاء وبصمة الزبون</div>
                          </div>
                          <div class="signature-box">
                            <div class="signature-space"></div>
                            <div class="signature-label">توقيع وبصمة الوكالة</div>
                          </div>
                        </div>
                      </body>
                      </html>
                    `;
                    const printWindow = window.open('', '', 'height=600,width=800');
                    if (printWindow) {
                      printWindow.document.write(content);
                      printWindow.document.close();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }}
                  className="flex-1 min-w-32 bg-saas-success hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  🖨️ {lang === 'fr' ? 'Imprimer' : 'طباعة'}
                </button>
                <button
                  onClick={() => setShowConditionsModal(false)}
                  className="flex-1 min-w-32 bg-saas-bg hover:bg-saas-secondary-start/10 text-saas-text-muted font-bold py-3 px-4 rounded-lg border border-saas-border transition-all"
                >
                  {lang === 'fr' ? 'Fermer' : 'إغلاق'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showActivationModal && selectedReservationForActivation && (
        <ActivationModal
          lang={lang}
          reservation={selectedReservationForActivation}
          onClose={() => setShowActivationModal(false)}
          onActivate={updateReservation}
        />
      )}
      {showCompletionModal && selectedReservationForCompletion && (
        <CompletionModal
          lang={lang}
          reservation={selectedReservationForCompletion}
          onClose={() => setShowCompletionModal(false)}
          onComplete={updateReservation}
        />
      )}
      
      {/* Conditions Personalizer */}
      <AnimatePresence>
        {showConditionsPersonalizer && (
          <ConditionsPersonalizer
            lang={lang}
            reservationId={showConditionsPersonalizer.id}
            onClose={() => setShowConditionsPersonalizer(null)}
            onSave={(conditions) => {
              // Update reservation with new conditions
              if (selectedReservation) {
                setSelectedReservation({
                  ...selectedReservation,
                  conditions: conditions
                });
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Send Contract by Email Modal */}
      <AnimatePresence>
        {showSendContractModal && (
          <SendContractModal
            lang={lang}
            reservation={showSendContractModal}
            onClose={() => setShowSendContractModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Utility function to get initial elements based on document type
const getInitialElements = (type: string, reservation: ReservationDetails, lang: Language = 'fr') => {
  const baseElements = {
    logo: { x: 50, y: 50, width: 100, height: 100 },
    signatureText1: { x: 50, y: 600, text: 'Signature et cachet de l\'Agence', fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
    signatureText2: { x: 300, y: 600, text: 'Signature de client', fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' }
  };

  if (type === 'payment' || type === 'receipt' || type === 'versement') {
    // Receipt template - calculate total paid from payments array
    const totalPaid = reservation.payments?.reduce((sum, p) => sum + p.amount, 0) || reservation.advancePayment || 0;
    const remaining = Math.max(0, reservation.totalPrice - totalPaid);
    
    // Receipt template
    return {
      ...baseElements,
      title: { x: 200, y: 50, text: lang === 'fr' ? 'payement' : 'إيصال الدفع', fontSize: 24, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },
      receiptNumber: { x: 50, y: 150, text: `N° ${reservation.id}`, fontSize: 14, fontFamily: 'Arial', color: '#333333', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      receiptDate: { x: 50, y: 180, text: `${lang === 'fr' ? 'Date:' : 'التاريخ:'} ${new Date().toLocaleDateString()}`, fontSize: 14, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientLabel: { x: 50, y: 220, text: lang === 'fr' ? 'Client:' : 'العميل:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientName: { x: 150, y: 220, text: `${reservation.client.firstName} ${reservation.client.lastName}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientPhone: { x: 50, y: 245, text: `${lang === 'fr' ? 'Téléphone:' : 'الهاتف:'} ${reservation.client.phone}`, fontSize: 12, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      carLabel: { x: 50, y: 280, text: lang === 'fr' ? 'Véhicule:' : 'المركبة:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      carInfo: { x: 50, y: 305, text: `${reservation.car.brand} ${reservation.car.model} - ${reservation.car.registration}`, fontSize: 13, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rentalPeriod: { x: 50, y: 330, text: `${lang === 'fr' ? 'Période:' : 'الفترة:'} ${reservation.step1.departureDate} ${lang === 'fr' ? 'au' : 'إلى'} ${reservation.step1.returnDate}`, fontSize: 13, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalLabel: { x: 50, y: 380, text: lang === 'fr' ? 'Total:' : 'الإجمالي:', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalAmount: { x: 200, y: 380, text: `${reservation.totalPrice.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 16, fontFamily: 'Arial', color: '#0066cc', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      paidLabel: { x: 50, y: 410, text: lang === 'fr' ? 'Montant payé:' : 'المبلغ المدفوع:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      paidAmount: { x: 200, y: 410, text: `${totalPaid.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#00aa00', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      remainingLabel: { x: 50, y: 440, text: lang === 'fr' ? 'Reste à payer:' : 'المبلغ المتبقي:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      remainingAmount: { x: 200, y: 440, text: `${remaining.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#cc0000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
    };
  } else if (type === 'invoice' || type === 'facture') {
    // Facture/Invoice - like versement with full details
    const subtotal = reservation.totalPrice;
    const tvaRate = reservation.tvaApplied ? 0.19 : 0;
    const tvaAmount = subtotal * tvaRate;
    const caution = reservation.deposit || 0;
    const totalPaid = reservation.payments?.reduce((sum, payment) => sum + payment.amount, 0) || reservation.advancePayment || 0;
    const remaining = subtotal - totalPaid;

    return {
      ...baseElements,
      title: { x: 200, y: 70, text: lang === 'fr' ? 'FACTURE' : 'الفاتورة', fontSize: 26, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },
      invoiceNumber: { x: 50, y: 165, text: `${lang === 'fr' ? 'N° Facture:' : 'رقم الفاتورة:'} ${reservation.id}`, fontSize: 13, fontFamily: 'Arial', color: '#333333', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      invoiceDate: { x: 300, y: 165, text: `${lang === 'fr' ? 'Date:' : 'التاريخ:'} ${new Date().toLocaleDateString()}`, fontSize: 13, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      clientSectionTitle: { x: 50, y: 205, text: lang === 'fr' ? '👤 INFORMATIONS CLIENT' : '👤 معلومات العميل', fontSize: 14, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      clientNameLabel: { x: 50, y: 240, text: lang === 'fr' ? 'Nom:' : 'الاسم:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientName: { x: 130, y: 240, text: `${reservation.client.firstName} ${reservation.client.lastName}`, fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientPhoneLabel: { x: 50, y: 260, text: lang === 'fr' ? 'Téléphone:' : 'الهاتف:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientPhone: { x: 130, y: 260, text: reservation.client.phone || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientAddressLabel: { x: 50, y: 280, text: lang === 'fr' ? 'Adresse:' : 'العنوان:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientAddress: { x: 130, y: 280, text: reservation.client.completeAddress || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleSectionTitle: { x: 50, y: 320, text: lang === 'fr' ? '🚗 INFORMATIONS VÉHICULE' : '🚗 معلومات المركبة', fontSize: 14, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleBrandLabel: { x: 50, y: 350, text: lang === 'fr' ? 'Marque & Modèle:' : 'العلامة والطراز:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleInfo: { x: 180, y: 350, text: `${reservation.car.brand} ${reservation.car.model}`, fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleRegLabel: { x: 50, y: 370, text: lang === 'fr' ? 'Immatriculation:' : 'رقم التسجيل:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleReg: { x: 180, y: 370, text: reservation.car.registration || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rentalPeriodLabel: { x: 50, y: 390, text: lang === 'fr' ? 'Période:' : 'الفترة:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rentalPeriod: { x: 180, y: 390, text: `${reservation.step1.departureDate} ${lang === 'fr' ? 'au' : 'إلى'} ${reservation.step1.returnDate}`, fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      tarificationSectionTitle: { x: 50, y: 430, text: lang === 'fr' ? '📋 TARIFICATION' : '📋 التسعير', fontSize: 14, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      basePriceLabel: { x: 50, y: 465, text: lang === 'fr' ? 'Prix:' : 'السعر:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      basePrice: { x: 280, y: 465, text: `${subtotal.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      cautionSectionTitle: { x: 50, y: 510, text: lang === 'fr' ? '🛡️ CAUTION' : '🛡️ الكفالة', fontSize: 14, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      cautionAmountLabel: { x: 50, y: 540, text: lang === 'fr' ? 'Montant:' : 'المبلغ:', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      cautionAmount: { x: 280, y: 540, text: `${caution.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 12, fontFamily: 'Arial', color: '#cc6600', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      paymentSectionTitle: { x: 50, y: 585, text: lang === 'fr' ? '💳 PAIEMENT' : '💳 الدفع', fontSize: 14, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      totalLabel: { x: 50, y: 620, text: lang === 'fr' ? 'Total:' : 'الإجمالي:', fontSize: 13, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalAmount: { x: 280, y: 620, text: `${subtotal.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 13, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      paidLabel: { x: 50, y: 645, text: lang === 'fr' ? 'Payé:' : 'المدفوع:', fontSize: 13, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      paidAmount: { x: 280, y: 645, text: `${totalPaid.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 13, fontFamily: 'Arial', color: '#00aa00', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      remainingLabel: { x: 50, y: 670, text: lang === 'fr' ? 'Reste:' : 'المتبقي:', fontSize: 13, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      remainingAmount: { x: 280, y: 670, text: `${remaining.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 13, fontFamily: 'Arial', color: remaining > 0 ? '#cc0000' : '#00aa00', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      footerText: { x: 150, y: 720, text: lang === 'fr' ? 'Merci' : 'شكراً', fontSize: 12, fontFamily: 'Arial', color: '#666666', fontWeight: 'italic', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },
    };
  } else if (type === 'quote' || type === 'devis') {
    // Quote/Devis template - Improved design with colors and better organization
    return {
      ...baseElements,
      title: { x: 200, y: 50, text: lang === 'fr' ? 'DEVIS' : 'عرض أسعار', fontSize: 26, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },

      // Quote header with better styling - positioned below logo
      quoteNumber: { x: 50, y: 165, text: `${lang === 'fr' ? 'N° Devis:' : 'رقم عرض السعر:'} ${reservation.id}`, fontSize: 14, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      quoteDate: { x: 300, y: 165, text: `${lang === 'fr' ? 'Date:' : 'التاريخ:'} ${new Date().toLocaleDateString()}`, fontSize: 13, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Vehicle Specifications Section - Blue theme
      vehicleSpecsTitle: { x: 50, y: 210, text: lang === 'fr' ? '🚗 SPÉCIFICATIONS DU VÉHICULE' : '🚗 مواصفات المركبة', fontSize: 13, fontFamily: 'Arial', color: '#FFFFFF', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: '#1a3a52', padding: '6px 8px' },
      
      vehicleBrandModelLabel: { x: 50, y: 240, text: lang === 'fr' ? 'Marque/Modèle:' : 'العلامة/الطراز:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleBrandModel: { x: 200, y: 240, text: `${reservation.car.brand} ${reservation.car.model}`, fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      vehicleCodeLabel: { x: 50, y: 263, text: lang === 'fr' ? 'Code Véhicule:' : 'رمز المركبة:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleCode: { x: 200, y: 263, text: `${reservation.id.substring(0, 5)}`, fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      vehicleRegistrationLabel: { x: 50, y: 286, text: lang === 'fr' ? 'Immatricule:' : 'لوحة الترخيص:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleRegistration: { x: 200, y: 286, text: reservation.car.registration || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      vehicleColorLabel: { x: 50, y: 309, text: lang === 'fr' ? 'Couleur:' : 'اللون:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleColor: { x: 200, y: 309, text: reservation.car.color || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      vehicleClassLabel: { x: 50, y: 332, text: lang === 'fr' ? 'Classe:' : 'الفئة:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleClass: { x: 200, y: 332, text: lang === 'fr' ? 'Véhicule Touristique' : 'مركبة سياحية', fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      vehicleCharacteristicsLabel: { x: 50, y: 355, text: lang === 'fr' ? 'Caractéristiques:' : 'الخصائص:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleCharacteristics: { x: 200, y: 355, text: reservation.car.energy || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      fuelTypeLabel: { x: 50, y: 378, text: lang === 'fr' ? 'Carburant:' : 'الوقود:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      fuelType: { x: 200, y: 378, text: reservation.car.energy === 'Essence' ? (lang === 'fr' ? 'Sans plomb' : 'بدون رصاص') : reservation.car.energy, fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      currentMileageLabel: { x: 50, y: 401, text: lang === 'fr' ? 'Kilométrage:' : 'الكيلومتراج:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      currentMileage: { x: 200, y: 401, text: `${reservation.car.mileage || 'N/A'} km`, fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      serialNumberLabel: { x: 50, y: 424, text: lang === 'fr' ? 'N° Série:' : 'رقم السلسلة:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      serialNumber: { x: 200, y: 424, text: reservation.car.vin || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Rental Conditions and Pricing Section - Green theme
      rentalConditionsTitle: { x: 50, y: 465, text: lang === 'fr' ? '📋 CONDITIONS DE LOCATION & TARIFICATION' : '📋 شروط التأجير والتسعير', fontSize: 13, fontFamily: 'Arial', color: '#FFFFFF', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: '#2d7a4d' },
      
      dailyPriceLabel: { x: 50, y: 495, text: lang === 'fr' ? 'Prix Journalier:' : 'السعر اليومي:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      dailyPrice: { x: 280, y: 495, text: `${reservation.car.priceDay?.toLocaleString() || '7000,00'} DA`, fontSize: 12, fontFamily: 'Arial', color: '#2d7a4d', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      
      numberOfDaysLabel: { x: 50, y: 518, text: lang === 'fr' ? 'Nombre de Jours:' : 'عدد الأيام:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      numberOfDays: { x: 280, y: 518, text: `${reservation.totalDays} ${lang === 'fr' ? 'jour(s)' : 'يوم'}`, fontSize: 12, fontFamily: 'Arial', color: '#2d7a4d', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      
      rentalPeriodLabel: { x: 50, y: 541, text: lang === 'fr' ? 'Période:' : 'الفترة:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rentalPeriod: { x: 280, y: 541, text: `${reservation.step1.departureDate} → ${reservation.step1.returnDate}`, fontSize: 11, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      
      totalHTLabel: { x: 50, y: 570, text: lang === 'fr' ? 'Sous-Total:' : 'الإجمالي الجزئي:', fontSize: 13, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalHT: { x: 280, y: 570, text: `${reservation.totalPrice.toLocaleString()} DA`, fontSize: 13, fontFamily: 'Arial', color: '#2d7a4d', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      
      totalTTCLabel: { x: 50, y: 595, text: lang === 'fr' ? 'Montant Total:' : 'المبلغ الإجمالي:', fontSize: 14, fontFamily: 'Arial', color: '#FFFFFF', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: '#2d7a4d' },
      totalTTC: { x: 280, y: 595, text: `${reservation.totalPrice.toLocaleString()} DA`, fontSize: 14, fontFamily: 'Arial', color: '#FFFFFF', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: '#2d7a4d' },
      
      numberOfVehiclesLabel: { x: 50, y: 630, text: lang === 'fr' ? 'Nombre de Véhicules:' : 'عدد المركبات:', fontSize: 12, fontFamily: 'Arial', color: '#1a3a52', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      numberOfVehicles: { x: 280, y: 630, text: '01', fontSize: 12, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },

      // Equipment and Accessories Checklist - Orange theme
      checklistTitle: { x: 50, y: 670, text: lang === 'fr' ? '✓ ÉQUIPEMENTS & ACCESSOIRES' : '✓ المعدات والملحقات', fontSize: 13, fontFamily: 'Arial', color: '#FFFFFF', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: '#cc6600' },
      checklistItems: { x: 50, y: 700, text: reservation.departureInspection?.inspectionItems?.map(item =>
        `${item.name}: ${item.checked ? '✓' : '✗'}`
      ).join('\n') || 'Roues de secours: ✓\nTriangle de signalisation: ✓\nCric: ✓\nClé de roue: ✓\nExtincteur: ✓\nCeintures de sécurité: ✓\nFeux de route: ✓\nPneus: ✓\nFreins: ✓\nClimatisation: ✓\nIntérieur propre: ✓', fontSize: 11, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Signatures
      agencySignatureText: { x: 50, y: 905, text: lang === 'fr' ? 'Signature et cachet de l\'Agence' : 'توقيع وختم الوكالة', fontSize: 11, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientSignatureText: { x: 300, y: 905, text: lang === 'fr' ? 'Signature du Client' : 'توقيع العميل', fontSize: 11, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
    };
  } else if (type === 'contract') {
    // Contract template - Load from database, fallback to default
    // Note: This returns a basic structure; the actual template from database will be loaded in the component
    return {
      logo: { x: 50, y: 50, width: 90, height: 90 },
      title: { x: 50, y: 160, text: 'Contrat de Location / عقد الإيجار', fontSize: 22, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },
      client_name: { x: 80, y: 140, text: `${reservation.client.firstName} ${reservation.client.lastName}`, fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      car_model: { x: 80, y: 180, text: `${reservation.car.brand} ${reservation.car.model}`, fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rental_dates: { x: 80, y: 220, text: `${reservation.step1.departureDate} - ${reservation.step1.returnDate}`, fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      price_total: { x: 80, y: 260, text: `${reservation.totalPrice.toLocaleString()} DA`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      signature_line: { x: 80, y: 450, text: '_________________________________', fontSize: 10, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
    };
  } else {
    // Engagement template - include logo and agency name with actual settings
    const isPassport = reservation.client.documentType === 'passport';
    const documentText = isPassport ? 'Avoir déposé mon passeport' : 'Avoir déposé ma carte d\'identité';
    const documentNumber = isPassport ? 
      (reservation.client.documentNumber || 'N/A') : 
      (reservation.client.idCardNumber || 'N/A');
    const documentDeliveryDate = isPassport ?
      (reservation.client.documentDeliveryDate || reservation.client.licenseDeliveryDate) :
      (reservation.client.licenseDeliveryDate || reservation.client.documentDeliveryDate);
    const documentDeliveryPlace = isPassport ?
      (reservation.client.documentDeliveryAddress || reservation.client.wilaya) :
      (reservation.client.licenseDeliveryPlace || reservation.client.wilaya);

    return {
      logo: { x: 50, y: 50, width: 100, height: 100 },
      agenceName: { x: 200, y: 100, text: 'LuxDrive Premium Car Rental', fontSize: 18, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      title: { x: 200, y: 50, text: 'Engagement', fontSize: 24, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      introText: { x: 50, y: 150, text: 'Je soussigne[e] Mrs/Mme:', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientName: { x: 250, y: 150, text: `${reservation.client.firstName} ${reservation.client.lastName}`, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      passportText: { x: 50, y: 200, text: documentText, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      passportNumber: { x: 50, y: 250, text: `N° ${documentNumber} Délivré le ${documentDeliveryDate ? new Date(documentDeliveryDate).toLocaleDateString('fr-FR') : 'N/A'} A ${documentDeliveryPlace || 'N/A'}`, fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      agenceText: { x: 50, y: 300, text: 'Au niveau de votre agence de location de voiture le', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      currentDate: { x: 50, y: 350, text: new Date().toLocaleDateString(), fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      contractText: { x: 50, y: 400, text: `Contrat N° ${reservation.id}`, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      cautionText: { x: 50, y: 450, text: 'Comme caution pour location du véhicule', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      carInfo: { x: 50, y: 500, text: `Marque ${reservation.car.brand} ${reservation.car.model} Immatric ${reservation.car.registration}`, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      datesText: { x: 50, y: 550, text: `Du ${reservation.step1.departureDate} Au ${reservation.step1.returnDate}`, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      signatureText1: { x: 50, y: 600, text: 'Signature et cachet de l\'Agence', fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      signatureText2: { x: 300, y: 600, text: 'Signature de client', fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' }
    };
  }
};

// Utility function to generate personalized print content
const generatePersonalizedContent = (elements: any, newTextElements: any[], reservation: ReservationDetails, type: string, lang: Language = 'fr', agencySettings?: any) => {
  const renderElement = (key: string, elementData: any) => {
    if (!elementData) return '';
    const x = elementData.x ?? 0;
    const y = elementData.y ?? 0;
    const fontSize = elementData.fontSize ?? 12;
    const fontFamily = elementData.fontFamily ?? 'Arial';
    const color = elementData.color ?? '#000000';
    const fontWeight = elementData.fontWeight ?? 'normal';
    const fontStyle = elementData.fontStyle ?? 'normal';
    const textDecoration = elementData.textDecoration ?? 'none';
    const textAlign = elementData.textAlign ?? 'left';
    const backgroundColor = elementData.backgroundColor ?? 'transparent';
    const text = elementData.text ?? '';
    const maxWidth = elementData.maxWidth ? `max-width: ${elementData.maxWidth}px; word-wrap: break-word;` : '';
    
    return `<div class="draggable" style="position: absolute; left: ${x}px; top: ${y}px; font-size: ${fontSize}px; font-family: ${fontFamily}; color: ${color}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; text-align: ${textAlign}; background-color: ${backgroundColor}; ${backgroundColor !== 'transparent' ? 'padding: 4px 8px;' : ''} ${maxWidth}">
      ${text}
    </div>`;
  };

  let bodyContent = '';
  
  // Logo and Agency Name - use actual settings for engagement, payment, invoice, facture, quote, devis, contract types, always display logo
  if (type === 'engagement' || type === 'payment' || type === 'receipt' || type === 'invoice' || type === 'facture' || type === 'quote' || type === 'devis' || type === 'contract') {
    // For engagement, payment, invoice, facture, contract and devis documents, use actual logo and agency name from settings
    if (elements.logo) {
      if (agencySettings?.logo) {
        bodyContent += `<div class="draggable logo" style="position: absolute; left: ${elements.logo.x || 50}px; top: ${elements.logo.y || 50}px; width: ${elements.logo.width || 100}px; height: ${elements.logo.height || 100}px;">
          <img src="${agencySettings.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>`;
      } else {
        // Fallback placeholder logo
        bodyContent += `<div class="draggable logo" style="position: absolute; left: ${elements.logo.x || 50}px; top: ${elements.logo.y || 50}px; width: ${elements.logo.width || 100}px; height: ${elements.logo.height || 100}px;">
          <img src="https://via.placeholder.com/100x100/007bff/ffffff?text=AGENCY" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>`;
      }
    }
    
    bodyContent += renderElement('title', elements.title);
    
    if (elements.agenceName) {
      if (agencySettings?.name) {
        // Override the text with actual agency name
        const agenceElement = { ...elements.agenceName, text: agencySettings.name };
        bodyContent += renderElement('agenceName', agenceElement);
      } else {
        bodyContent += renderElement('agenceName', elements.agenceName);
      }
    }
  } else {
    // For other types, use the standard logo and agency name
    if (elements.logo) {
      bodyContent += `<div class="draggable logo" style="position: absolute; left: ${elements.logo.x || 50}px; top: ${elements.logo.y || 50}px; width: ${elements.logo.width || 100}px; height: ${elements.logo.height || 100}px;">
        <img src="https://via.placeholder.com/100x100/007bff/ffffff?text=AGENCY" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>`;
    }
    
    bodyContent += renderElement('title', elements.title);
    bodyContent += renderElement('agenceName', elements.agenceName);
  }

  // Type-specific content
  if (type === 'payment' || type === 'receipt') {
    // Receipt content
    bodyContent += renderElement('receiptNumber', elements.receiptNumber);
    bodyContent += renderElement('receiptDate', elements.receiptDate);
    bodyContent += renderElement('clientLabel', elements.clientLabel);
    bodyContent += renderElement('clientName', elements.clientName);
    bodyContent += renderElement('clientPhone', elements.clientPhone);
    bodyContent += renderElement('carLabel', elements.carLabel);
    bodyContent += renderElement('carInfo', elements.carInfo);
    bodyContent += renderElement('rentalPeriod', elements.rentalPeriod);
    bodyContent += renderElement('totalLabel', elements.totalLabel);
    bodyContent += renderElement('totalAmount', elements.totalAmount);
    bodyContent += renderElement('paidLabel', elements.paidLabel);
    bodyContent += renderElement('paidAmount', elements.paidAmount);
    bodyContent += renderElement('remainingLabel', elements.remainingLabel);
    bodyContent += renderElement('remainingAmount', elements.remainingAmount);
  } else if (type === 'versement') {
    // Versement (payment receipt) content - same as payment/receipt
    // Add logo
    if (elements.logo) {
      const logoUrl = agencySettings?.logo || 'https://via.placeholder.com/100x100/007bff/ffffff?text=AGENCY';
      bodyContent += `<div class="draggable logo" style="position: absolute; left: ${elements.logo.x || 50}px; top: ${elements.logo.y || 50}px; width: ${elements.logo.width || 100}px; height: ${elements.logo.height || 100}px;">
        <img src="${logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>`;
    }
    
    // Add title
    bodyContent += renderElement('title', elements.title);
    
    // Add agency name
    if (elements.agenceName) {
      const agenceElement = agencySettings?.name ? { ...elements.agenceName, text: agencySettings.name } : elements.agenceName;
      bodyContent += renderElement('agenceName', agenceElement);
    }
    
    // Add a separator line
    bodyContent += `<div style="position: absolute; left: 50px; top: 180px; width: 500px; border-top: 2px solid #333333;"></div>`;
    
    // Add all receipt details
    bodyContent += renderElement('receiptNumber', elements.receiptNumber);
    bodyContent += renderElement('receiptDate', elements.receiptDate);
    bodyContent += renderElement('clientLabel', elements.clientLabel);
    bodyContent += renderElement('clientName', elements.clientName);
    bodyContent += renderElement('clientPhone', elements.clientPhone);
    bodyContent += renderElement('carLabel', elements.carLabel);
    bodyContent += renderElement('carInfo', elements.carInfo);
    bodyContent += renderElement('rentalPeriod', elements.rentalPeriod);
    
    // Add another separator before financial details
    bodyContent += `<div style="position: absolute; left: 50px; top: 365px; width: 500px; border-top: 2px solid #cccccc;"></div>`;
    
    // Add financial details with better styling
    bodyContent += renderElement('totalLabel', elements.totalLabel);
    bodyContent += renderElement('totalAmount', elements.totalAmount);
    bodyContent += renderElement('paidLabel', elements.paidLabel);
    bodyContent += renderElement('paidAmount', elements.paidAmount);
    bodyContent += renderElement('remainingLabel', elements.remainingLabel);
    bodyContent += renderElement('remainingAmount', elements.remainingAmount);
  } else if (type === 'invoice' || type === 'facture') {
    // Invoice content
    bodyContent += renderElement('invoiceNumber', elements.invoiceNumber);
    bodyContent += renderElement('invoiceDate', elements.invoiceDate);

    // Client Information
    bodyContent += renderElement('clientSectionTitle', elements.clientSectionTitle);
    bodyContent += renderElement('clientNameLabel', elements.clientNameLabel);
    bodyContent += renderElement('clientName', elements.clientName);
    bodyContent += renderElement('clientPhoneLabel', elements.clientPhoneLabel);
    bodyContent += renderElement('clientPhone', elements.clientPhone);
    bodyContent += renderElement('clientAddressLabel', elements.clientAddressLabel);
    bodyContent += renderElement('clientAddress', elements.clientAddress);

    // Vehicle Information
    bodyContent += renderElement('vehicleSectionTitle', elements.vehicleSectionTitle);
    bodyContent += renderElement('vehicleBrandLabel', elements.vehicleBrandLabel);
    bodyContent += renderElement('vehicleInfo', elements.vehicleInfo);
    bodyContent += renderElement('vehicleRegLabel', elements.vehicleRegLabel);
    bodyContent += renderElement('vehicleReg', elements.vehicleReg);
    bodyContent += renderElement('rentalPeriodLabel', elements.rentalPeriodLabel);
    bodyContent += renderElement('rentalPeriod', elements.rentalPeriod);

    // Tarification Section
    bodyContent += renderElement('tarificationSectionTitle', elements.tarificationSectionTitle);
    bodyContent += renderElement('basePriceLabel', elements.basePriceLabel);
    bodyContent += renderElement('basePrice', elements.basePrice);

    // Caution Section
    bodyContent += renderElement('cautionSectionTitle', elements.cautionSectionTitle);
    bodyContent += renderElement('cautionAmountLabel', elements.cautionAmountLabel);
    bodyContent += renderElement('cautionAmount', elements.cautionAmount);

    // Payment Information
    bodyContent += renderElement('paymentSectionTitle', elements.paymentSectionTitle);
    bodyContent += renderElement('totalLabel', elements.totalLabel);
    bodyContent += renderElement('totalAmount', elements.totalAmount);
    bodyContent += renderElement('paidLabel', elements.paidLabel);
    bodyContent += renderElement('paidAmount', elements.paidAmount);
    bodyContent += renderElement('remainingLabel', elements.remainingLabel);
    bodyContent += renderElement('remainingAmount', elements.remainingAmount);

    // Footer
    bodyContent += renderElement('footerText', elements.footerText);
  } else if (type === 'quote' || type === 'devis') {
    // Quote/Devis content
    bodyContent += renderElement('quoteNumber', elements.quoteNumber);
    bodyContent += renderElement('quoteDate', elements.quoteDate);

    // Vehicle Specifications
    bodyContent += renderElement('vehicleSpecsTitle', elements.vehicleSpecsTitle);
    bodyContent += renderElement('vehicleBrandModelLabel', elements.vehicleBrandModelLabel);
    bodyContent += renderElement('vehicleBrandModel', elements.vehicleBrandModel);
    bodyContent += renderElement('vehicleCodeLabel', elements.vehicleCodeLabel);
    bodyContent += renderElement('vehicleCode', elements.vehicleCode);
    bodyContent += renderElement('vehicleRegistrationLabel', elements.vehicleRegistrationLabel);
    bodyContent += renderElement('vehicleRegistration', elements.vehicleRegistration);
    bodyContent += renderElement('vehicleColorLabel', elements.vehicleColorLabel);
    bodyContent += renderElement('vehicleColor', elements.vehicleColor);
    bodyContent += renderElement('vehicleClassLabel', elements.vehicleClassLabel);
    bodyContent += renderElement('vehicleClass', elements.vehicleClass);
    bodyContent += renderElement('vehicleCharacteristicsLabel', elements.vehicleCharacteristicsLabel);
    bodyContent += renderElement('vehicleCharacteristics', elements.vehicleCharacteristics);
    bodyContent += renderElement('fuelTypeLabel', elements.fuelTypeLabel);
    bodyContent += renderElement('fuelType', elements.fuelType);
    bodyContent += renderElement('currentMileageLabel', elements.currentMileageLabel);
    bodyContent += renderElement('currentMileage', elements.currentMileage);
    bodyContent += renderElement('serialNumberLabel', elements.serialNumberLabel);
    bodyContent += renderElement('serialNumber', elements.serialNumber);

    // Rental Conditions and Pricing
    bodyContent += renderElement('rentalConditionsTitle', elements.rentalConditionsTitle);
    bodyContent += renderElement('dailyPriceLabel', elements.dailyPriceLabel);
    bodyContent += renderElement('dailyPrice', elements.dailyPrice);
    bodyContent += renderElement('numberOfDaysLabel', elements.numberOfDaysLabel);
    bodyContent += renderElement('numberOfDays', elements.numberOfDays);
    bodyContent += renderElement('rentalPeriodLabel', elements.rentalPeriodLabel);
    bodyContent += renderElement('rentalPeriod', elements.rentalPeriod);
    bodyContent += renderElement('totalHTLabel', elements.totalHTLabel);
    bodyContent += renderElement('totalHT', elements.totalHT);
    bodyContent += renderElement('totalTTCLabel', elements.totalTTCLabel);
    bodyContent += renderElement('totalTTC', elements.totalTTC);
    bodyContent += renderElement('numberOfVehiclesLabel', elements.numberOfVehiclesLabel);
    bodyContent += renderElement('numberOfVehicles', elements.numberOfVehicles);

    // Equipment and Accessories Checklist
    bodyContent += renderElement('checklistTitle', elements.checklistTitle);
    bodyContent += renderElement('checklistItems', elements.checklistItems);

    // Signatures
    bodyContent += renderElement('agencySignatureText', elements.agencySignatureText);
    bodyContent += renderElement('clientSignatureText', elements.clientSignatureText);
  } else if (type === 'contract') {
    // Contract content - Professional format with logo like devis
    // Add logo
    if (elements.logo && agencySettings?.logo) {
      bodyContent += `<div class="draggable logo" style="position: absolute; left: ${elements.logo.x || 50}px; top: ${elements.logo.y || 50}px; width: ${elements.logo.width || 90}px; height: ${elements.logo.height || 90}px;">
        <img src="${agencySettings.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>`;
    }
    
    // Add agency name
    if (elements.agenceName) {
      const agenceElement = agencySettings?.name ? { ...elements.agenceName, text: agencySettings.name } : elements.agenceName;
      bodyContent += renderElement('agenceName', agenceElement);
    }
    
    // Main Title
    bodyContent += renderElement('title', elements.title);
    
    // Contract Details Section
    bodyContent += renderElement('contractDetailsTitle', elements.contractDetailsTitle);
    bodyContent += renderElement('contractNumberLabel', elements.contractNumberLabel);
    bodyContent += renderElement('contractNumber', elements.contractNumber);
    bodyContent += renderElement('contractDateLabel', elements.contractDateLabel);
    bodyContent += renderElement('contractDate', elements.contractDate);
    
    // Rental Period Section
    bodyContent += renderElement('rentalPeriodTitle', elements.rentalPeriodTitle);
    bodyContent += renderElement('startDateLabel', elements.startDateLabel);
    bodyContent += renderElement('startDate', elements.startDate);
    bodyContent += renderElement('endDateLabel', elements.endDateLabel);
    bodyContent += renderElement('endDate', elements.endDate);
    bodyContent += renderElement('durationLabel', elements.durationLabel);
    bodyContent += renderElement('duration', elements.duration);
    
    // Driver Information Section
    bodyContent += renderElement('driverInfoTitle', elements.driverInfoTitle);
    bodyContent += renderElement('driverNameLabel', elements.driverNameLabel);
    bodyContent += renderElement('driverName', elements.driverName);
    bodyContent += renderElement('driverBirthDateLabel', elements.driverBirthDateLabel);
    bodyContent += renderElement('driverBirthDate', elements.driverBirthDate);
    bodyContent += renderElement('placeOfBirthLabel', elements.placeOfBirthLabel);
    bodyContent += renderElement('placeOfBirth', elements.placeOfBirth);
    bodyContent += renderElement('documentTypeLabel', elements.documentTypeLabel);
    bodyContent += renderElement('documentType', elements.documentType);
    bodyContent += renderElement('documentNumberLabel', elements.documentNumberLabel);
    bodyContent += renderElement('documentNumber', elements.documentNumber);
    bodyContent += renderElement('issueeDateLabel', elements.issueeDateLabel);
    bodyContent += renderElement('issueDate', elements.issueDate);
    bodyContent += renderElement('expirationDateLabel', elements.expirationDateLabel);
    bodyContent += renderElement('expirationDate', elements.expirationDate);
    bodyContent += renderElement('placeOfIssueLabel', elements.placeOfIssueLabel);
    bodyContent += renderElement('placeOfIssue', elements.placeOfIssue);
    
    // Vehicle Information Section
    bodyContent += renderElement('vehicleInfoTitle', elements.vehicleInfoTitle);
    bodyContent += renderElement('vehicleModelLabel', elements.vehicleModelLabel);
    bodyContent += renderElement('vehicleModel', elements.vehicleModel);
    bodyContent += renderElement('vehicleColorLabel', elements.vehicleColorLabel);
    bodyContent += renderElement('vehicleColor', elements.vehicleColor);
    bodyContent += renderElement('vehiclePlateLabel', elements.vehiclePlateLabel);
    bodyContent += renderElement('vehiclePlate', elements.vehiclePlate);
    bodyContent += renderElement('vehicleVINLabel', elements.vehicleVINLabel);
    bodyContent += renderElement('vehicleVIN', elements.vehicleVIN);
    bodyContent += renderElement('vehicleFuelLabel', elements.vehicleFuelLabel);
    bodyContent += renderElement('vehicleFuel', elements.vehicleFuel);
    bodyContent += renderElement('vehicleMileageLabel', elements.vehicleMileageLabel);
    bodyContent += renderElement('vehicleMileage', elements.vehicleMileage);
    
    // Financials Section
    bodyContent += renderElement('financialsTitle', elements.financialsTitle);
    bodyContent += renderElement('unitPriceLabel', elements.unitPriceLabel);
    bodyContent += renderElement('unitPrice', elements.unitPrice);
    bodyContent += renderElement('totalHTLabel', elements.totalHTLabel);
    bodyContent += renderElement('totalHT', elements.totalHT);
    bodyContent += renderElement('totalAmountLabel', elements.totalAmountLabel);
    bodyContent += renderElement('totalAmount', elements.totalAmount);
    
    // Equipment Checklist Section
    bodyContent += renderElement('equipmentTitle', elements.equipmentTitle);
    bodyContent += renderElement('equipment1', elements.equipment1);
    bodyContent += renderElement('equipment2', elements.equipment2);
    bodyContent += renderElement('equipment3', elements.equipment3);
    bodyContent += renderElement('equipment4', elements.equipment4);
    bodyContent += renderElement('equipment5', elements.equipment5);
    bodyContent += renderElement('equipment6', elements.equipment6);
    bodyContent += renderElement('equipment7', elements.equipment7);
    bodyContent += renderElement('equipment8', elements.equipment8);
    
    // Signatures
    bodyContent += renderElement('agencySignatureText', elements.agencySignatureText);
    bodyContent += renderElement('clientSignatureText', elements.clientSignatureText);
    bodyContent += renderElement('dateSignatureText', elements.dateSignatureText);
  } else {
    // Engagement content
    bodyContent += renderElement('introText', elements.introText);
    bodyContent += renderElement('clientName', elements.clientName);
    bodyContent += renderElement('passportText', elements.passportText);
    bodyContent += renderElement('passportNumber', elements.passportNumber);
    bodyContent += renderElement('agenceText', elements.agenceText);
    bodyContent += renderElement('currentDate', elements.currentDate);
    bodyContent += renderElement('contractText', elements.contractText);
    bodyContent += renderElement('cautionText', elements.cautionText);
    bodyContent += renderElement('carInfo', elements.carInfo);
    bodyContent += renderElement('datesText', elements.datesText);
  }

  // Signatures (common to all)
  bodyContent += renderElement('signatureText1', elements.signatureText1);
  bodyContent += renderElement('signatureText2', elements.signatureText2);

  // New text elements
  newTextElements.forEach((element) => {
    bodyContent += `<div class="draggable" style="position: absolute; left: ${element.x}px; top: ${element.y}px; font-size: ${element.fontSize}px; font-family: ${element.fontFamily}; color: ${element.color}; font-weight: ${element.fontWeight}; font-style: ${element.fontStyle}; text-decoration: ${element.textDecoration}; text-align: ${element.textAlign}; background-color: ${element.backgroundColor}; ${element.backgroundColor !== 'transparent' ? 'padding: 4px 8px;' : ''}">
      ${element.text}
    </div>`;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 30px 40px; 
          position: relative; 
          min-height: 1000px;
          background: #f5f5f5;
        }
        .page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 20px;
          margin: 0 auto 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .draggable { 
          position: absolute; 
          cursor: move;
          max-width: 600px;
          word-wrap: break-word;
        }
        .selected { border: 2px solid #007bff; }
        .logo { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
        
        /* Print specific styles */
        @media print {
          body {
            padding: 0;
            background: white;
          }
          .page {
            box-shadow: none;
            margin: 0;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${bodyContent}
      </div>
    </body>
    </html>
  `;
};

// Personalization Modal Component
const PersonalizationModal: React.FC<{
  lang: Language;
  reservation: ReservationDetails;
  type: string;
  onClose: () => void;
  onPrint: (content: string) => void;
}> = ({ lang, reservation, type, onClose, onPrint }) => {
  const [agencySettings, setAgencySettings] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'fr' | 'ar'>(lang === 'fr' ? 'fr' : 'ar');

  useEffect(() => {
    loadAgencySettings();
  }, []);

  const loadAgencySettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('website_settings')
        .select('logo, name')
        .limit(1)
        .single();
      if (settings) {
        setAgencySettings(settings);
      }
    } catch (error) {
      console.error('❌ Error loading agency settings:', error);
    }
  };

  const generateContractHTML = (templateLang: 'fr' | 'ar'): string => {
    const isFrench = templateLang === 'fr';
    const textDir = isFrench ? 'ltr' : 'rtl';
    
    const labels = {
      contractTitle: isFrench ? 'Contrat de Location' : 'عقد التأجير',
      contractDate: isFrench ? 'Date du Contrat' : 'تاريخ العقد',
      contractNumber: isFrench ? 'N° de Contrat' : 'رقم العقد',
      client: isFrench ? 'Client' : 'العميل',
      rentalPeriod: isFrench ? 'Période de Location' : 'فترة الإيجار',
      departure: isFrench ? 'Départ' : 'المغادرة',
      return: isFrench ? 'Retour' : 'العودة',
      duration: isFrench ? 'Durée' : 'المدة',
      days: isFrench ? 'jours' : 'أيام',
      driverInfo: isFrench ? 'Informations du Conducteur' : 'معلومات السائق',
      fullName: isFrench ? 'Nom Complet' : 'الاسم الكامل',
      birthDate: isFrench ? 'Date de Naissance' : 'تاريخ الميلاد',
      birthPlace: isFrench ? 'Lieu de Naissance' : 'مكان الميلاد',
      licenseNumber: isFrench ? 'Numéro de Permis' : 'رقم الرخصة',
      vehicleInfo: isFrench ? 'Informations du Véhicule' : 'معلومات المركبة',
      model: isFrench ? 'Modèle' : 'الموديل',
      registration: isFrench ? 'Immatriculation' : 'التسجيل',
      color: isFrench ? 'Couleur' : 'اللون',
      vin: isFrench ? 'VIN' : 'رقم المحرك',
      fuel: isFrench ? 'Carburant' : 'الوقود',
      mileage: isFrench ? 'Kilométrage' : 'الكيلومترات',
      pricing: isFrench ? 'Tarification' : 'التسعير',
      pricePerDay: isFrench ? 'Prix par Jour' : 'السعر في اليوم',
      numberOfDays: isFrench ? 'Nombre de Jours' : 'عدد الأيام',
      totalHT: isFrench ? 'Montant HT' : 'المبلغ غير ضريبي',
      totalTTC: isFrench ? 'TOTAL TTC' : 'الإجمالي',
      conditions: isFrench ? 'Conditions Acceptées' : 'الشروط المقبولة',
      signatures: isFrench ? 'Signatures' : 'التوقيعات',
      clientSignature: isFrench ? 'Signature du Client' : 'توقيع العميل',
      agencySignature: isFrench ? "Signature de l'Agence" : 'توقيع الوكالة',
      dateAndSignature: isFrench ? 'Date et signature' : 'التاريخ والتوقيع',
    };

    const conditionsList = isFrench 
      ? ['Permis de conduire valide', 'Assurance tous risques', 'Caution dépôt', 'Carburant plein', 'État du véhicule accepté', 'Pas de dégâts supplémentaires']
      : ['رخصة قيادة سارية', 'تأمين شامل', 'ضمان الإيداع', 'خزان ممتلئ', 'حالة المركبة مقبولة', 'لا توجد أضرار إضافية'];

    const html = `
    <!DOCTYPE html>
    <html dir="${textDir}" lang="${isFrench ? 'fr' : 'ar'}">
    <head>
      <meta charset="UTF-8">
      <title>Contrat de Location</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.45;
          color: #222;
          background: white;
          direction: ${textDir};
          font-size: 20px;
        }
        .page {
          width: 210mm;
          height: 297mm;
          padding: 5mm;
          margin: 0 auto;
          background: white;
          display: flex;
          flex-direction: column;
        }
        .header {
          border-bottom: 3px solid #1a3a8a;
          padding-bottom: 7px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          width: 55px;
          height: 55px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .header-text {
          flex: 1;
        }
        .agency-name {
          font-size: 36px;
          font-weight: bold;
          color: #1a3a8a;
          text-align: center;
          margin: 0;
        }
        .contract-title {
          font-size: 23px;
          color: #555;
          text-align: center;
          margin-top: 2px;
        }
        .header-info {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }
        .info-box {
          padding: 8px 9px;
          border-radius: 3px;
          font-size: 19px;
          line-height: 1.4;
        }
        .info-box.blue {
          background-color: #dbeafe;
          border-left: 4px solid #2563eb;
        }
        .info-box.green {
          background-color: #dcfce7;
          border-left: 4px solid #16a34a;
        }
        .info-box.amber {
          background-color: #fef3c7;
          border-left: 4px solid #d97706;
        }
        .info-label {
          font-weight: 600;
          color: #222;
          margin-bottom: 2px;
          font-size: 18px;
        }
        .info-value {
          color: #333;
          font-size: 19px;
        }
        .section {
          margin-bottom: 8px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          background-color: #f0f1f3;
          padding: 6px 7px;
          border-radius: 2px;
          margin-bottom: 6px;
          border-left: 4px solid #2563eb;
          color: #1a3a8a;
        }
        .section-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px 12px;
          font-size: 19px;
        }
        .section-content.full {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .field {
          padding: 5px 0;
          border-bottom: 0.5px solid #ddd;
        }
        .field-label {
          font-weight: 600;
          color: #1a3a8a;
          font-size: 18px;
        }
        .field-value {
          color: #444;
          margin-top: 1px;
          font-size: 19px;
        }
        .pricing-table {
          width: 100%;
          margin-bottom: 10px;
          font-size: 19px;
          border-collapse: collapse;
        }
        .pricing-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 0.5px solid #ddd;
        }
        .pricing-row.total {
          border-top: 1px solid #222;
          font-weight: 600;
          margin-top: 3px;
          padding-top: 5px;
        }
        .pricing-row.grand-total {
          font-size: 20px;
          font-weight: 700;
          color: #1a3a8a;
          border-top: 2px solid #1a3a8a;
          padding-top: 5px;
        }
        .conditions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 12px;
          font-size: 19px;
          margin-bottom: 10px;
        }
        .condition-item {
          display: flex;
          align-items: center;
          gap: 7px;
          line-height: 1.3;
        }
        .checkbox {
          width: 16px;
          height: 16px;
          border: 1px solid #999;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: auto;
          font-size: 19px;
          padding-top: 12px;
        }
        .signature-block {
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-bottom: 5px;
          height: 45px;
        }
        .signature-label {
          font-weight: 600;
          font-size: 19px;
        }
        .date-sig {
          font-size: 18px;
          color: #666;
          margin-top: 2px;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .page { margin: 0; padding: 5mm; height: auto; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header -->
        <div class="header">
          ${agencySettings?.logo ? `<img src="${agencySettings.logo}" alt="Logo" class="logo">` : ''}
          <div class="header-text">
            <h1 class="agency-name">${agencySettings?.name || 'AGENCY NAME'}</h1>
            <p class="contract-title">${labels.contractTitle}</p>
          </div>
        </div>

        <!-- Header Info Boxes -->
        <div class="header-info">
          <div class="info-box blue">
            <div class="info-label">📅 ${labels.contractDate}</div>
            <div class="info-value">${new Date().toLocaleDateString(isFrench ? 'fr-FR' : 'ar-SA')}</div>
          </div>
          <div class="info-box green">
            <div class="info-label">🔢 ${labels.contractNumber}</div>
            <div class="info-value">#${reservation?.id ? reservation.id.toString().substring(0, 8).toUpperCase() : 'N/A'}</div>
          </div>
          <div class="info-box amber">
            <div class="info-label">👤 ${labels.client}</div>
            <div class="info-value">${reservation?.client?.lastName || 'N/A'}</div>
          </div>
        </div>

        <!-- Rental Period -->
        <div class="section">
          <div class="section-title">📅 ${labels.rentalPeriod}</div>
          <div class="section-content full">
            <div class="field">
              <div class="field-label">${labels.departure}</div>
              <div class="field-value">${new Date(reservation?.step1?.departureDate).toLocaleDateString(isFrench ? 'fr-FR' : 'ar-SA')}</div>
            </div>
            <div class="field">
              <div class="field-label">${labels.return}</div>
              <div class="field-value">${new Date(reservation?.step1?.returnDate).toLocaleDateString(isFrench ? 'fr-FR' : 'ar-SA')}</div>
            </div>
            <div class="field">
              <div class="field-label">${labels.duration}</div>
              <div class="field-value">${reservation?.totalDays || 0} ${labels.days}</div>
            </div>
          </div>
        </div>

        <!-- Driver & Vehicle Info (2 columns) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <!-- Driver Info -->
          <div class="section">
            <div class="section-title">👤 ${labels.driverInfo}</div>
            <div class="section-content">
              <div class="field">
                <div class="field-label">${labels.fullName}</div>
                <div class="field-value">${reservation?.client?.firstName} ${reservation?.client?.lastName}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.licenseNumber}</div>
                <div class="field-value">${reservation?.client?.licenseNumber || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.birthDate}</div>
                <div class="field-value">${new Date(reservation?.client?.dateOfBirth).toLocaleDateString(isFrench ? 'fr-FR' : 'ar-SA')}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.birthPlace}</div>
                <div class="field-value">${reservation?.client?.placeOfBirth || 'N/A'}</div>
              </div>
            </div>
          </div>

          <!-- Vehicle Info -->
          <div class="section">
            <div class="section-title">🚗 ${labels.vehicleInfo}</div>
            <div class="section-content">
              <div class="field">
                <div class="field-label">${labels.model}</div>
                <div class="field-value">${reservation?.car?.brand} ${reservation?.car?.model}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.registration}</div>
                <div class="field-value">${reservation?.car?.registration || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.color}</div>
                <div class="field-value">${reservation?.car?.color || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.fuel}</div>
                <div class="field-value">${reservation?.car?.energy || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.vin}</div>
                <div class="field-value">${reservation?.car?.vin || 'N/A'}</div>
              </div>
              <div class="field">
                <div class="field-label">${labels.mileage}</div>
                <div class="field-value">${reservation?.departureInspection?.mileage || 'N/A'} km</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing & Conditions (2 columns) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <!-- Pricing -->
          <div class="section">
            <div class="section-title">💰 ${labels.pricing}</div>
            <div class="pricing-table">
              <div class="pricing-row">
                <span>${labels.pricePerDay}:</span>
                <span>${reservation?.car?.priceDay || 0} DH</span>
              </div>
              <div class="pricing-row">
                <span>${labels.numberOfDays}:</span>
                <span>${reservation?.totalDays || 0}</span>
              </div>
              <div class="pricing-row total">
                <span>${labels.totalHT}:</span>
                <span>${(reservation?.totalPrice || 0).toFixed(2)} DH</span>
              </div>
              <div class="pricing-row grand-total">
                <span>${labels.totalTTC}:</span>
                <span>${(reservation?.totalPrice || 0).toFixed(2)} DH</span>
              </div>
            </div>
          </div>

          <!-- Conditions -->
          <div class="section">
            <div class="section-title">✓ ${labels.conditions}</div>
            <div class="conditions-grid">
              ${conditionsList.map(condition => `
                <div class="condition-item">
                  <div class="checkbox">✓</div>
                  <span>${condition}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">${labels.clientSignature}</div>
            <div class="date-sig">${labels.dateAndSignature}</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">${labels.agencySignature}</div>
            <div class="date-sig">${labels.dateAndSignature}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    return html;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const content = generateContractHTML(selectedTemplate);
    setTimeout(() => {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        setTimeout(() => setIsPrinting(false), 100);
      }
    }, 300);
  };

  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">
                {lang === 'fr' ? 'Contrat de Location' : 'عقد التأجير'}
              </h2>
              {/* Template Selector */}
              <div className="flex gap-2 ml-8">
                <button
                  onClick={() => setSelectedTemplate('fr')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedTemplate === 'fr'
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button
                  onClick={() => setSelectedTemplate('ar')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedTemplate === 'ar'
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  🇸🇦 العربية
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Area with Preview */}
          <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white p-8">
            <div className="bg-white rounded-lg shadow-lg p-0 mx-auto" style={{ width: '210mm' }}>
              <iframe
                srcDoc={generateContractHTML(selectedTemplate)}
                style={{ 
                  width: '100%', 
                  height: '600px', 
                  border: 'none',
                  borderRadius: '0.5rem'
                }}
                title="Contract Preview"
              />
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="bg-gray-100 px-8 py-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-all"
            >
              {lang === 'fr' ? 'Fermer' : 'إغلاق'}
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Printer size={18} />
              {isPrinting ? (lang === 'fr' ? 'Impression...' : 'جاري الطباعة...') : (lang === 'fr' ? 'Imprimer' : 'طباعة')}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
