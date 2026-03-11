import React, { useState, useEffect, useRef } from 'react';
import { Language, ReservationDetails, Client, Car } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, Car as CarIcon, Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, Fuel, Camera, FileText, CreditCard, DollarSign, Printer, AlertTriangle, MoreVertical } from 'lucide-react';
import { ReservationDetailsView } from './ReservationDetailsView';
import { CreateReservationForm } from './CreateReservationForm';
import { EditReservationForm } from './EditReservationForm';
import { ActivationModal, CompletionModal } from './ReservationDetailsView';
import { ReservationsService } from '../services/ReservationsService';
import { DatabaseService } from '../services/DatabaseService';
import { supabase } from '../supabase';

interface PlannerPageProps {
  lang: Language;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ lang }) => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'details' | 'edit'>('list');
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
  const [showInspectionMode, setShowInspectionMode] = useState(false);
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
      await ReservationsService.updateReservation(updatedReservation.id, updatedReservation);
      setReservations(prev => prev.map(res => res.id === updatedReservation.id ? updatedReservation : res));
      if (selectedReservation && selectedReservation.id === updatedReservation.id) {
        setSelectedReservation(updatedReservation);
      }
    } catch (err) {
      console.error('Error updating reservation:', err);
      setError('Failed to update reservation');
    }
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
        console.log('Delete reservation:', showDeleteConfirm.id);
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
      // Load agency settings first
      let agencySettings = null;
      try {
        const { data: agencyData, error: agencyError } = await supabase
          .from('website_settings')
          .select('name, logo')
          .limit(1)
          .single();

        if (!agencyError && agencyData) {
          agencySettings = agencyData;
        }
      } catch (error) {
        console.error('Error loading agency settings for print:', error);
      }

      // Check if there's a saved template for this type
      const savedTemplates = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
      const savedTemplate = savedTemplates.find((template: any) => template.type === showPrintModal.type);

      let elements, newTextElements;
      if (savedTemplate) {
        // Use saved template but regenerate text content for payment/receipt/engagement/versement
        const freshElements = getInitialElements(showPrintModal.type, showPrintModal.reservation, lang);
        elements = { ...freshElements };
        
        // Keep positions from saved template
        Object.keys(savedTemplate.elements).forEach(key => {
          if (elements[key] && savedTemplate.elements[key].x !== undefined) {
            elements[key] = {
              ...elements[key],
              x: savedTemplate.elements[key].x,
              y: savedTemplate.elements[key].y
            };
          }
        });
        newTextElements = savedTemplate.newTextElements || [];
      } else {
        // Use default template
        elements = getInitialElements(showPrintModal.type, showPrintModal.reservation, lang);
        newTextElements = [];
      }

      const printContent = generatePersonalizedContent(
        elements,
        newTextElements,
        showPrintModal.reservation,
        showPrintModal.type,
        lang,
        agencySettings
      );
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
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

  if (currentView === 'details' && selectedReservation) {
    return <ReservationDetailsView lang={lang} reservation={selectedReservation} onBack={() => setCurrentView('list')} onUpdate={updateReservation} />;
  }

  if (currentView === 'edit' && selectedReservation) {
    return <EditReservationForm 
      lang={lang} 
      reservation={selectedReservation} 
      onBack={() => setCurrentView('list')} 
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
          const paidAmount = (reservation.payments && reservation.payments.length > 0)
            ? reservation.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
            : (Number(reservation.advancePayment) || 0);
          const remainingAmount = Math.max(0, totalCost - paidAmount);

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
                      <div className="text-xl font-black text-slate-900">{totalCost.toLocaleString()} {lang === 'fr' ? 'DA' : 'د.ج'}</div>
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
                      style={{ width: `${Math.min(100, Math.round((paidAmount / (totalCost || 1)) * 100))}%` }}
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
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-saas-text-main font-bold flex items-center gap-2 transition-colors"
                        >
                          🤝 {lang === 'fr' ? 'Engagement' : 'التزام'}
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
              <div className="flex gap-3">
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
    </div>
  );
};

// Utility function to get initial elements based on document type
const getInitialElements = (type: string, reservation: ReservationDetails, lang: Language = 'fr') => {
  const baseElements = {
    logo: { x: 50, y: 50, width: 100, height: 100 },
    agenceName: { x: 200, y: 100, text: 'LUXDRIVE PREMIUM CAR RENTAL', fontSize: 18, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
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
    // Invoice/Facture template
    const subtotal = reservation.totalPrice;
    const tvaRate = reservation.tvaApplied ? 0.19 : 0; // 19% TVA in Algeria
    const tvaAmount = subtotal * tvaRate;
    const additionalFees = reservation.additionalFees || 0;
    const totalWithTVA = subtotal + tvaAmount + additionalFees;
    const totalPaid = reservation.payments?.reduce((sum, payment) => sum + payment.amount, 0) || reservation.advancePayment;
    const remaining = totalWithTVA - totalPaid;

    return {
      ...baseElements,
      title: { x: 200, y: 50, text: lang === 'fr' ? 'FACTURE' : 'الفاتورة', fontSize: 24, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },

      // Invoice header
      invoiceNumber: { x: 50, y: 120, text: `N° ${reservation.id}`, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      invoiceDate: { x: 300, y: 120, text: `${lang === 'fr' ? 'Date:' : 'التاريخ:'} ${new Date().toLocaleDateString()}`, fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },

      // Client Information Section
      clientSectionTitle: { x: 50, y: 160, text: lang === 'fr' ? 'INFORMATIONS CLIENT' : 'معلومات العميل', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      clientNameLabel: { x: 50, y: 190, text: lang === 'fr' ? 'Nom:' : 'الاسم:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientName: { x: 120, y: 190, text: `${reservation.client.firstName} ${reservation.client.lastName}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientPhoneLabel: { x: 50, y: 215, text: lang === 'fr' ? 'Téléphone:' : 'الهاتف:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientPhone: { x: 120, y: 215, text: reservation.client.phone, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientAddressLabel: { x: 50, y: 240, text: lang === 'fr' ? 'Adresse:' : 'العنوان:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientAddress: { x: 120, y: 240, text: reservation.client.completeAddress || 'N/A', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Vehicle Information Section
      vehicleSectionTitle: { x: 350, y: 160, text: lang === 'fr' ? 'INFORMATIONS VÉHICULE' : 'معلومات المركبة', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleBrand: { x: 350, y: 190, text: `${lang === 'fr' ? 'Marque:' : 'العلامة التجارية:'} ${reservation.car.brand}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleModel: { x: 350, y: 215, text: `${lang === 'fr' ? 'Modèle:' : 'الطراز:'} ${reservation.car.model}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleRegistration: { x: 350, y: 240, text: `${lang === 'fr' ? 'Immatriculation:' : 'رقم التسجيل:'} ${reservation.car.registration}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Rental Period
      rentalPeriodTitle: { x: 50, y: 280, text: lang === 'fr' ? 'PÉRIODE DE LOCATION' : 'فترة التأجير', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      rentalPeriod: { x: 50, y: 310, text: `${lang === 'fr' ? 'Du:' : 'من:'} ${reservation.step1.departureDate} ${lang === 'fr' ? 'Au:' : 'إلى:'} ${reservation.step1.returnDate}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rentalDuration: { x: 50, y: 335, text: `${lang === 'fr' ? 'Durée:' : 'المدة:'} ${reservation.totalDays} ${lang === 'fr' ? 'jours' : 'أيام'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Services and Pricing Section
      servicesTitle: { x: 50, y: 380, text: lang === 'fr' ? 'SERVICES ET TARIFICATION' : 'الخدمات والتسعير', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      rentalService: { x: 50, y: 410, text: lang === 'fr' ? 'Location de véhicule' : 'تأجير المركبة', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rentalPrice: { x: 400, y: 410, text: `${subtotal.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },

      // Additional Services
      additionalServicesTitle: { x: 50, y: 440, text: lang === 'fr' ? 'SERVICES SUPPLÉMENTAIRES' : 'الخدمات الإضافية', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      additionalServices: { x: 50, y: 465, text: reservation.additionalServices?.length > 0 ?
        reservation.additionalServices.map(service => `${service.name}: ${service.price} DA`).join(', ') :
        (lang === 'fr' ? 'Aucun service supplémentaire' : 'لا توجد خدمات إضافية'), fontSize: 12, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Supplementary Fees
      supplementaryFeesTitle: { x: 50, y: 490, text: lang === 'fr' ? 'FRAIS SUPPLÉMENTAIRES' : 'الرسوم الإضافية', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      supplementaryFees: { x: 50, y: 515, text: additionalFees > 0 ?
        `${lang === 'fr' ? 'Frais divers:' : 'رسوم متنوعة:'} ${additionalFees.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}` :
        (lang === 'fr' ? 'Aucun frais supplémentaire' : 'لا توجد رسوم إضافية'), fontSize: 12, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Subtotal
      subtotalLabel: { x: 300, y: 550, text: lang === 'fr' ? 'Sous-total:' : 'المجموع الفرعي:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      subtotalAmount: { x: 400, y: 550, text: `${subtotal.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },

      // TVA
      tvaLabel: { x: 300, y: 575, text: `TVA (${(tvaRate * 100).toFixed(0)}%):`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      tvaAmount: { x: 400, y: 575, text: `${tvaAmount.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },

      // Total
      totalLabel: { x: 300, y: 610, text: lang === 'fr' ? 'TOTAL TTC:' : 'الإجمالي شامل الضريبة:', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalAmount: { x: 400, y: 610, text: `${totalWithTVA.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 16, fontFamily: 'Arial', color: '#0066cc', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },

      // Payment Information Section
      paymentSectionTitle: { x: 50, y: 660, text: lang === 'fr' ? 'INFORMATIONS DE PAIEMENT' : 'معلومات الدفع', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      totalPaidLabel: { x: 50, y: 690, text: lang === 'fr' ? 'Total payé:' : 'الإجمالي المدفوع:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalPaidAmount: { x: 200, y: 690, text: `${totalPaid.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#00aa00', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      remainingLabel: { x: 50, y: 720, text: lang === 'fr' ? 'Reste à payer:' : 'المبلغ المتبقي:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      remainingAmount: { x: 200, y: 720, text: `${remaining.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#cc0000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Payment History
      paymentHistoryTitle: { x: 50, y: 760, text: lang === 'fr' ? 'HISTORIQUE DES PAIEMENTS' : 'تاريخ المدفوعات', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      paymentHistory: { x: 50, y: 785, text: reservation.payments?.length > 0 ?
        reservation.payments.map(payment =>
          `${payment.date}: ${payment.amount.toLocaleString()} DA (${payment.method})`
        ).join('\n') :
        (lang === 'fr' ? 'Aucun paiement enregistré' : 'لا توجد مدفوعات مسجلة'), fontSize: 12, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
    };
  } else if (type === 'quote' || type === 'devis') {
    // Quote/Devis template
    return {
      ...baseElements,
      title: { x: 200, y: 50, text: lang === 'fr' ? 'DEVIS' : 'عرض أسعار', fontSize: 24, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },

      // Quote header
      quoteNumber: { x: 50, y: 120, text: `N° ${reservation.id}`, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      quoteDate: { x: 300, y: 120, text: `${lang === 'fr' ? 'Date:' : 'التاريخ:'} ${new Date().toLocaleDateString()}`, fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },

      // Company Information Section
      companySectionTitle: { x: 50, y: 160, text: lang === 'fr' ? 'Informations sur l\'Entreprise' : 'معلومات الشركة', fontSize: 18, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      companyName: { x: 50, y: 190, text: 'SARL OUKKAL LISAYARAT ACHAT - VENTE - LOCATION', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      companyCoordinates: { x: 50, y: 215, text: 'Coordonnées: 0550080915 / 0550647319 / 020281473', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      companyAddress: { x: 50, y: 240, text: 'Adresse: RN 24 BORDJ EL KIFFAN EN FACE ARRET TRAMWAY MOUHOUS', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      companyEmail: { x: 50, y: 265, text: 'Email: sarloukkalauto122@gmail.com', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Vehicle Specifications Section
      vehicleSpecsTitle: { x: 50, y: 310, text: lang === 'fr' ? 'Spécifications du Véhicule' : 'مواصفات المركبة', fontSize: 18, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleBrandModel: { x: 50, y: 340, text: `Marque/Modèle: ${reservation.car.brand} ${reservation.car.model}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleCode: { x: 50, y: 365, text: `Code Véhicule: ${reservation.id}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleRegistration: { x: 50, y: 390, text: `Immatricule: ${reservation.car.registration}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleColor: { x: 50, y: 415, text: `Couleur: ${reservation.car.color}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleClass: { x: 50, y: 440, text: `Classe de véhicule: ${lang === 'fr' ? 'Véhicule Touristique' : 'مركبة سياحية'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleCharacteristics: { x: 50, y: 465, text: `Caractéristiques: ${reservation.car.energy}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      fuelType: { x: 50, y: 490, text: `Type carburant: ${reservation.car.energy === 'Essence' ? 'Sans plomb' : reservation.car.energy}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      currentMileage: { x: 50, y: 515, text: `Kilométrage Actuel: ${reservation.car.mileage || 'N/A'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      serialNumber: { x: 50, y: 540, text: `N° Série de type: ${reservation.car.vin || 'N/A'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Rental Conditions and Pricing Section
      rentalConditionsTitle: { x: 50, y: 585, text: lang === 'fr' ? 'Conditions de Location et Tarification' : 'شروط التأجير والتسعير', fontSize: 18, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      dailyPrice: { x: 50, y: 615, text: `Prix (Journalier): ${reservation.car.priceDay?.toLocaleString() || '7000,00'} DA`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      numberOfDays: { x: 50, y: 640, text: `Nombre de jours: ${reservation.totalDays}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      rentalPeriod: { x: 50, y: 665, text: `Période: Du ${reservation.step1.departureDate} au ${reservation.step1.returnDate}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalHT: { x: 50, y: 690, text: `Total HT: ${reservation.totalPrice.toLocaleString()},00 DA`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      totalTTC: { x: 50, y: 715, text: `Total TTC: ${reservation.totalPrice.toLocaleString()},00 DA`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      numberOfVehicles: { x: 50, y: 740, text: 'Nombre véhicule: 01', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Equipment and Accessories Checklist
      checklistTitle: { x: 50, y: 785, text: lang === 'fr' ? 'Équipements et Accessoires (Check-list)' : 'المعدات والملحقات (قائمة التحقق)', fontSize: 18, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      checklistItems: { x: 50, y: 815, text: reservation.departureInspection?.inspectionItems?.map(item =>
        `${item.name}: ${item.checked ? '✓' : '✗'}`
      ).join('\n') || 'Roues de secours: ✓\nTriangle de signalisation: ✓\nCric: ✓\nClé de roue: ✓\nExtincteur: ✓\nCeintures de sécurité: ✓\nFeux de route: ✓\nPneus: ✓\nFreins: ✓\nClimatisation: ✓\nIntérieur propre: ✓', fontSize: 12, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },

      // Signatures
      agencySignatureText: { x: 50, y: 950, text: lang === 'fr' ? 'Signature et cachet de l\'Agence' : 'توقيع وختم الوكالة', fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientSignatureText: { x: 300, y: 950, text: lang === 'fr' ? 'Signature du Client' : 'توقيع العميل', fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
    };
  } else if (type === 'contract') {
    // Contract template - First page with details
    const departureInspection = reservation.departureInspection;
    const returnInspection = reservation.returnInspection;
    
    return {
      ...baseElements,
      title: { x: 200, y: 50, text: lang === 'fr' ? 'CONTRAT DE LOCATION' : 'عقد التأجير', fontSize: 24, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },
      
      // Contract number and date
      contractNumber: { x: 50, y: 120, text: `N° ${reservation.id}`, fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      contractDate: { x: 300, y: 120, text: `${lang === 'fr' ? 'Date:' : 'التاريخ:'} ${new Date().toLocaleDateString()}`, fontSize: 14, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
      
      // Client Information Section
      clientSectionTitle: { x: 50, y: 160, text: lang === 'fr' ? 'INFORMATIONS CLIENT' : 'معلومات العميل', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      clientNameLabel: { x: 50, y: 190, text: lang === 'fr' ? 'Nom:' : 'الاسم:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientName: { x: 120, y: 190, text: `${reservation.client.firstName} ${reservation.client.lastName}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientPhoneLabel: { x: 50, y: 215, text: lang === 'fr' ? 'Téléphone:' : 'الهاتف:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientPhone: { x: 120, y: 215, text: reservation.client.phone, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientIdLabel: { x: 50, y: 240, text: lang === 'fr' ? 'Carte d\'identité:' : 'بطاقة الهوية:', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      clientId: { x: 150, y: 240, text: reservation.client.idCardNumber || 'N/A', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      // Driver Information (if activated)
      driverSectionTitle: { x: 50, y: 270, text: lang === 'fr' ? 'INFORMATIONS CHAUFFEUR' : 'معلومات السائق', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      driverName: { x: 50, y: 300, text: `${lang === 'fr' ? 'Nom du chauffeur:' : 'اسم السائق:'} ${reservation.client.firstName} ${reservation.client.lastName}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      driverLicense: { x: 50, y: 325, text: `${lang === 'fr' ? 'Permis de conduire:' : 'رخصة القيادة:'} ${reservation.client.licenseNumber || 'N/A'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      // Vehicle Information Section
      vehicleSectionTitle: { x: 350, y: 160, text: lang === 'fr' ? 'INFORMATIONS VÉHICULE' : 'معلومات المركبة', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleBrand: { x: 350, y: 190, text: `${lang === 'fr' ? 'Marque:' : 'العلامة التجارية:'} ${reservation.car.brand}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleModel: { x: 350, y: 215, text: `${lang === 'fr' ? 'Modèle:' : 'الطراز:'} ${reservation.car.model}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleRegistration: { x: 350, y: 240, text: `${lang === 'fr' ? 'Immatriculation:' : 'رقم التسجيل:'} ${reservation.car.registration}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleYear: { x: 350, y: 265, text: `${lang === 'fr' ? 'Année:' : 'السنة:'} ${reservation.car.year}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      vehicleColor: { x: 350, y: 290, text: `${lang === 'fr' ? 'Couleur:' : 'اللون:'} ${reservation.car.color}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      // Reservation Information Section
      reservationSectionTitle: { x: 50, y: 360, text: lang === 'fr' ? 'INFORMATIONS RÉSERVATION' : 'معلومات الحجز', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      reservationPeriod: { x: 50, y: 390, text: `${lang === 'fr' ? 'Période:' : 'الفترة:'} ${reservation.step1.departureDate} ${lang === 'fr' ? 'au' : 'إلى'} ${reservation.step1.returnDate}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      reservationDuration: { x: 50, y: 415, text: `${lang === 'fr' ? 'Durée:' : 'المدة:'} ${reservation.totalDays} ${lang === 'fr' ? 'jours' : 'أيام'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      reservationPrice: { x: 50, y: 440, text: `${lang === 'fr' ? 'Prix total:' : 'السعر الإجمالي:'} ${reservation.totalPrice.toLocaleString()} ${lang === 'fr' ? 'DA' : 'د.ج'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      // Inspection Information Section
      inspectionSectionTitle: { x: 50, y: 480, text: lang === 'fr' ? 'INFORMATIONS INSPECTION' : 'معلومات الفحص', fontSize: 16, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'underline', textAlign: 'left', backgroundColor: 'transparent' },
      departureMileage: { x: 50, y: 510, text: `${lang === 'fr' ? 'Kilométrage départ:' : 'عداد المسافة عند المغادرة:'} ${departureInspection?.mileage || 'N/A'} km`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      departureFuel: { x: 50, y: 535, text: `${lang === 'fr' ? 'Carburant départ:' : 'الوقود عند المغادرة:'} ${departureInspection?.fuelLevel || 'N/A'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      returnMileage: { x: 350, y: 510, text: `${lang === 'fr' ? 'Kilométrage retour:' : 'عداد المسافة عند العودة:'} ${returnInspection?.mileage || 'N/A'} km`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      returnFuel: { x: 350, y: 535, text: `${lang === 'fr' ? 'Carburant retour:' : 'الوقود عند العودة:'} ${returnInspection?.fuelLevel || 'N/A'}`, fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      // Inspection Items
      inspectionItemsTitle: { x: 50, y: 570, text: lang === 'fr' ? 'ÉLÉMENTS D\'INSPECTION' : 'عناصر الفحص', fontSize: 14, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      inspectionItems: { x: 50, y: 590, text: departureInspection?.inspectionItems?.map(item => 
        `${item.name}: ${item.checked ? (lang === 'fr' ? '✓' : '✓') : (lang === 'fr' ? '✗' : '✗')}`
      ).join(', ') || 'N/A', fontSize: 12, fontFamily: 'Arial', color: '#666666', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', backgroundColor: 'transparent' },
      
      // Second page content
      termsTitle: { x: 200, y: 50, text: 'يمكنك قراءة شروط العقد في الأسفل ومصادقة عليها', fontSize: 18, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none', textAlign: 'center', backgroundColor: 'transparent' },
      termsContent: { x: 50, y: 100, text: `1- السن: يجب أن يكون السائق يبلغ من العمر 20 عاماً على الأقل، وأن يكون حاصلاً على رخصة قيادة منذ سنتين على الأقل.

2- جواز السفر: إيداع جواز السفر البيومتري الإلزامي، بالإضافة إلى دفع تأمين ابتدائي يبدأ من 30,000.00 دج حسب فئة المركبة، ويعد هذا بمثابة ضمان لطلبه.

3- الوقود: الوقود يكون على نفقة الزبون.

4- قانون ونظام: يتم الدفع نقداً عند تسليم السيارة.

5- النظافة: تسلم السيارة نظيفة ويجب إرجاعها في نفس الحالة، وفي حال عدم ذلك، سيتم احتساب تكلفة الغسيل بمبلغ 1000 دج.

6- مكان التسليم: يتم تسليم السيارات في موقف السيارات التابع لوكالاتنا.

7- جدول المواعيد: يجب على الزبون احترام المواعيد المحددة عند الحجز، يجب الإبلاغ مسبقاً عن أي تغيير. لا يمكن للزبون تمديد مدة الإيجار إلا بعد الحصول على إذن من وكالتنا للإيجار، وذلك بإشعار مسبق لا يقل عن 48 ساعة.

8- الأضرار والخسائر: التأمين الأساسي: يلتزم الزبون بدفع جميع الأضرار التي تلحق بالمركبة سواء كان مخطئاً أو غير مخطئ. أي ضرر يلحق بالمركبة سيؤدي إلى خصم من مبلغ الضمان.

9- عند السرقة: في حالة السرقة أو تضرر المركبة، يجب تقديم تصريح لدى مصالح الشرطة أو الدرك الوطني قبل أي تصريح، يجب على الزبون إبلاغ وكالة الكراء بشكل إلزامي.

10- تأمين: يستفيد من التأمين فقط السائقون المذكورون في عقد الكراء، يُمنع منعاً باتاً إعارة أو تأجير المركبة من الباطن، وتكون جميع الأضرار الناتجة عن مثل هذه الحالات على عاتق الزبون بالكامل.

11- عطل ميكانيكي: خلال فترة الإيجار، وبناءً على عدد الكيلومترات المقطوعة، يجب على الزبون إجراء الفحوصات اللازمة مثل مستوى الزيت، حالة المحرك، ضغط الإطارات، وغيرها في حال حدوث عطل ميكانيكي بسبب إهمال الزبون في إجراء هذه الفحوصات أو لأي سبب آخر ناتج عن مسؤولية الزبون (مثلاً: كسر حوض الزيت، العارضة السفلية، القفل أو غيرها)، فإن تكاليف الإصلاح والصيانة تكون على عاتق الزبون بالكامل.

12- خسائر إضافية: الأضرار التي تلحق بالعجلات والإطارات، القيادة بالإطارات المفرغة من الهواء، التدهور، السرقة، نهب الملحقات، أعمال التخريب، الأضرار الميكانيكية الناتجة عن سوء استخدام المركبة، الأضرار التي تحدث أسفل المركبة (الصدام الأمامي، الجوانب، حوض الزيت، العادم) والأضرار الناتجة عن الاضطرابات والشغب، كلها سيتم تحميل تكلفتها على الزبون.

13- ضريبة التأخير: مدة الإيجار تُحتسب على فترات كاملة مدتها 24 ساعة غير قابلة للتقسيم، بدءاً من وقت حجز المركبة وحتى الوقت المذكور في العقد، يجب على الزبون إعادة المركبة في نفس الوقت، وإلا سيتم احتساب تكلفة تأخير مقدارها 800 دينار لكل ساعة تأخير.

14- عدد الأميال: عدد الكيلومترات محدود لجميع مركباتنا بـ 300 كم يومياً، ويفرض غرامة قدرها 30 دج عن كل كيلومتر زائد.

15- شروط: يقر الزبون بأنه اطلع على شروط الإيجار هذه وقبلها دون أي تحفظ، ويتعهد بتوقيع هذا العقد.`, fontSize: 10, fontFamily: 'Arial', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', textAlign: 'right', backgroundColor: 'transparent' },
    };
  } else {
    // Engagement template - include logo and agency name with actual settings
    console.log('Engagement template generation - Client data:', {
      documentType: reservation.client.documentType,
      documentNumber: reservation.client.documentNumber,
      idCardNumber: reservation.client.idCardNumber,
      documentDeliveryDate: reservation.client.documentDeliveryDate,
      licenseDeliveryDate: reservation.client.licenseDeliveryDate,
      documentDeliveryAddress: reservation.client.documentDeliveryAddress,
      wilaya: reservation.client.wilaya
    });

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

    console.log('Engagement template - Resolved values:', {
      isPassport,
      documentText,
      documentNumber,
      documentDeliveryDate,
      documentDeliveryPlace
    });

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
  
  // Logo and Agency Name - use actual settings for engagement and payment types, always display logo
  if (type === 'engagement' || type === 'payment' || type === 'receipt') {
    // For engagement and payment documents, use actual logo and agency name from settings
    if (elements.logo) {
      if (agencySettings?.logo) {
        bodyContent += `<div class="draggable logo" style="position: absolute; left: ${elements.logo.x || 50}px; top: ${elements.logo.y || 50}px; width: ${elements.logo.width || 100}px; height: ${elements.logo.height || 100}px;">
          <img src="${agencySettings.logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>`;
      } else {
        // Fallback placeholder logo
        bodyContent += `<div class="draggable logo" style="position: absolute; left: ${elements.logo.x || 50}px; top: ${elements.logo.y || 50}px; width: ${elements.logo.width || 100}px; height: ${elements.logo.height || 100}px;">
          <img src="https://via.placeholder.com/100x100/007bff/ffffff?text=LUXDRIVE" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
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
        <img src="https://via.placeholder.com/100x100/007bff/ffffff?text=LUXDRIVE" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
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
      const logoUrl = agencySettings?.logo || 'https://via.placeholder.com/100x100/007bff/ffffff?text=LUXDRIVE';
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
    bodyContent += renderElement('vehicleBrand', elements.vehicleBrand);
    bodyContent += renderElement('vehicleModel', elements.vehicleModel);
    bodyContent += renderElement('vehicleRegistration', elements.vehicleRegistration);

    // Rental Period
    bodyContent += renderElement('rentalPeriodTitle', elements.rentalPeriodTitle);
    bodyContent += renderElement('rentalPeriod', elements.rentalPeriod);
    bodyContent += renderElement('rentalDuration', elements.rentalDuration);

    // Services and Pricing
    bodyContent += renderElement('servicesTitle', elements.servicesTitle);
    bodyContent += renderElement('rentalService', elements.rentalService);
    bodyContent += renderElement('rentalPrice', elements.rentalPrice);

    // Additional Services
    bodyContent += renderElement('additionalServicesTitle', elements.additionalServicesTitle);
    bodyContent += renderElement('additionalServices', elements.additionalServices);

    // Supplementary Fees
    bodyContent += renderElement('supplementaryFeesTitle', elements.supplementaryFeesTitle);
    bodyContent += renderElement('supplementaryFees', elements.supplementaryFees);

    // Subtotal, TVA, Total
    bodyContent += renderElement('subtotalLabel', elements.subtotalLabel);
    bodyContent += renderElement('subtotalAmount', elements.subtotalAmount);
    bodyContent += renderElement('tvaLabel', elements.tvaLabel);
    bodyContent += renderElement('tvaAmount', elements.tvaAmount);
    bodyContent += renderElement('totalLabel', elements.totalLabel);
    bodyContent += renderElement('totalAmount', elements.totalAmount);

    // Payment Information
    bodyContent += renderElement('paymentSectionTitle', elements.paymentSectionTitle);
    bodyContent += renderElement('totalPaidLabel', elements.totalPaidLabel);
    bodyContent += renderElement('totalPaidAmount', elements.totalPaidAmount);
    bodyContent += renderElement('remainingLabel', elements.remainingLabel);
    bodyContent += renderElement('remainingAmount', elements.remainingAmount);

    // Payment History
    bodyContent += renderElement('paymentHistoryTitle', elements.paymentHistoryTitle);
    bodyContent += renderElement('paymentHistory', elements.paymentHistory);
  } else if (type === 'quote' || type === 'devis') {
    // Quote/Devis content
    bodyContent += renderElement('quoteNumber', elements.quoteNumber);
    bodyContent += renderElement('quoteDate', elements.quoteDate);

    // Company Information
    bodyContent += renderElement('companySectionTitle', elements.companySectionTitle);
    bodyContent += renderElement('companyName', elements.companyName);
    bodyContent += renderElement('companyCoordinates', elements.companyCoordinates);
    bodyContent += renderElement('companyAddress', elements.companyAddress);
    bodyContent += renderElement('companyEmail', elements.companyEmail);

    // Vehicle Specifications
    bodyContent += renderElement('vehicleSpecsTitle', elements.vehicleSpecsTitle);
    bodyContent += renderElement('vehicleBrandModel', elements.vehicleBrandModel);
    bodyContent += renderElement('vehicleCode', elements.vehicleCode);
    bodyContent += renderElement('vehicleRegistration', elements.vehicleRegistration);
    bodyContent += renderElement('vehicleColor', elements.vehicleColor);
    bodyContent += renderElement('vehicleClass', elements.vehicleClass);
    bodyContent += renderElement('vehicleCharacteristics', elements.vehicleCharacteristics);
    bodyContent += renderElement('fuelType', elements.fuelType);
    bodyContent += renderElement('currentMileage', elements.currentMileage);
    bodyContent += renderElement('serialNumber', elements.serialNumber);

    // Rental Conditions and Pricing
    bodyContent += renderElement('rentalConditionsTitle', elements.rentalConditionsTitle);
    bodyContent += renderElement('dailyPrice', elements.dailyPrice);
    bodyContent += renderElement('numberOfDays', elements.numberOfDays);
    bodyContent += renderElement('rentalPeriod', elements.rentalPeriod);
    bodyContent += renderElement('totalHT', elements.totalHT);
    bodyContent += renderElement('totalTTC', elements.totalTTC);
    bodyContent += renderElement('numberOfVehicles', elements.numberOfVehicles);

    // Equipment and Accessories Checklist
    bodyContent += renderElement('checklistTitle', elements.checklistTitle);
    bodyContent += renderElement('checklistItems', elements.checklistItems);

    // Signatures
    bodyContent += renderElement('agencySignatureText', elements.agencySignatureText);
    bodyContent += renderElement('clientSignatureText', elements.clientSignatureText);
  } else if (type === 'contract') {
    // Contract content - First page
    bodyContent += renderElement('contractNumber', elements.contractNumber);
    bodyContent += renderElement('contractDate', elements.contractDate);
    
    // Client Information
    bodyContent += renderElement('clientSectionTitle', elements.clientSectionTitle);
    bodyContent += renderElement('clientNameLabel', elements.clientNameLabel);
    bodyContent += renderElement('clientName', elements.clientName);
    bodyContent += renderElement('clientPhoneLabel', elements.clientPhoneLabel);
    bodyContent += renderElement('clientPhone', elements.clientPhone);
    bodyContent += renderElement('clientIdLabel', elements.clientIdLabel);
    bodyContent += renderElement('clientId', elements.clientId);
    
    // Driver Information
    bodyContent += renderElement('driverSectionTitle', elements.driverSectionTitle);
    bodyContent += renderElement('driverName', elements.driverName);
    bodyContent += renderElement('driverLicense', elements.driverLicense);
    
    // Vehicle Information
    bodyContent += renderElement('vehicleSectionTitle', elements.vehicleSectionTitle);
    bodyContent += renderElement('vehicleBrand', elements.vehicleBrand);
    bodyContent += renderElement('vehicleModel', elements.vehicleModel);
    bodyContent += renderElement('vehicleRegistration', elements.vehicleRegistration);
    bodyContent += renderElement('vehicleYear', elements.vehicleYear);
    bodyContent += renderElement('vehicleColor', elements.vehicleColor);
    
    // Reservation Information
    bodyContent += renderElement('reservationSectionTitle', elements.reservationSectionTitle);
    bodyContent += renderElement('reservationPeriod', elements.reservationPeriod);
    bodyContent += renderElement('reservationDuration', elements.reservationDuration);
    bodyContent += renderElement('reservationPrice', elements.reservationPrice);
    
    // Inspection Information
    bodyContent += renderElement('inspectionSectionTitle', elements.inspectionSectionTitle);
    bodyContent += renderElement('departureMileage', elements.departureMileage);
    bodyContent += renderElement('departureFuel', elements.departureFuel);
    bodyContent += renderElement('returnMileage', elements.returnMileage);
    bodyContent += renderElement('returnFuel', elements.returnFuel);
    bodyContent += renderElement('inspectionItemsTitle', elements.inspectionItemsTitle);
    bodyContent += renderElement('inspectionItems', elements.inspectionItems);
    
    // Second page - Terms and conditions
    bodyContent += '<div style="page-break-before: always;"></div>';
    bodyContent += renderElement('termsTitle', elements.termsTitle);
    bodyContent += renderElement('termsContent', elements.termsContent);
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
        body { font-family: Arial, sans-serif; padding: 40px; position: relative; min-height: 800px; }
        .draggable { position: absolute; cursor: move; }
        .selected { border: 2px solid #007bff; }
        .logo { border: 1px solid #ddd; }
      </style>
    </head>
    <body>
      ${bodyContent}
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
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [newTextElements, setNewTextElements] = useState<any[]>([]);
  const [agencySettings, setAgencySettings] = useState<any>(null);
  
  const [elements, setElements] = useState(getInitialElements(type, reservation, lang));

  const handleMouseDown = (elementId: string, e: React.MouseEvent) => {
    setSelectedElement(elementId);
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedElement) {
      const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const newX = e.clientX - containerRect.left - dragOffset.x;
      const newY = e.clientY - containerRect.top - dragOffset.y;
      
      setElements(prev => ({
        ...prev,
        [selectedElement]: {
          ...prev[selectedElement],
          x: Math.max(0, Math.min(newX, 700)), // Constrain to container
          y: Math.max(0, Math.min(newY, 900))
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateElement = (elementId: string, updates: any) => {
    setElements(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        ...updates
      }
    }));
  };

  const addNewText = () => {
    const newId = `newText_${Date.now()}`;
    const newElement = {
      id: newId,
      x: 100,
      y: 100,
      text: lang === 'fr' ? 'Nouveau texte' : 'نص جديد',
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left',
      backgroundColor: 'transparent'
    };
    setNewTextElements(prev => [...prev, newElement]);
    setSelectedElement(newId);
  };

  const saveTemplate = () => {
    // Check if a template of this type already exists
    const existingTemplateIndex = savedTemplates.findIndex(template => template.type === type);

    if (existingTemplateIndex >= 0) {
      // Update existing template
      const existingTemplate = savedTemplates[existingTemplateIndex];
      const updatedTemplate = {
        ...existingTemplate,
        elements: { ...elements },
        newTextElements: [...newTextElements],
        createdAt: new Date().toISOString() // Update timestamp
      };

      const updatedTemplates = [...savedTemplates];
      updatedTemplates[existingTemplateIndex] = updatedTemplate;

      setSavedTemplates(updatedTemplates);
      localStorage.setItem('savedTemplates', JSON.stringify(updatedTemplates));
      alert(lang === 'fr' ? 'Modèle mis à jour!' : 'تم تحديث النموذج!');
    } else {
      // Create new template - ask for name and type
      const templateName = prompt(lang === 'fr' ? 'Nom du modèle:' : 'اسم النموذج:');
      if (!templateName) return;

      // ask for document type
      const types: Array<'engagement'|'contrat'|'versement'|'facture'|'devis'> = ['engagement','contrat','versement','facture','devis'];
      let templateType = prompt(
        (lang === 'fr'
          ? 'Type de modèle (engagement, contrat, versement, facture, devis):'
          : 'نوع النموذج (engagement, contrat, versement, facture, devis):')
      );

      if (!templateType || !types.includes(templateType as any)) {
        alert(lang === 'fr' ? 'Type invalide, opération annulée.' : 'نوع غير صالح، تم الإلغاء.');
        return;
      }

      // ensure cast
      templateType = templateType as 'engagement'|'contrat'|'versement'|'facture'|'devis';

      const template = {
        id: Date.now().toString(),
        name: templateName,
        type: templateType,
        elements: { ...elements },
        newTextElements: [...newTextElements],
        createdAt: new Date().toISOString()
      };

      const updatedTemplates = [...savedTemplates, template];
      setSavedTemplates(updatedTemplates);
      localStorage.setItem('savedTemplates', JSON.stringify(updatedTemplates));
      alert(lang === 'fr' ? 'Modèle sauvegardé!' : 'تم حفظ النموذج!');
    }
  };

  const loadTemplate = (template: any) => {
    // For engagement and payment documents, preserve positioning but update text with fresh data
    if (type === 'engagement' || type === 'payment' || type === 'receipt' || type === 'versement') {
      const freshElements = getInitialElements(type, reservation, lang);
      const mergedElements = { ...freshElements };
      
      // Keep positions from saved template but use fresh text
      Object.keys(template.elements).forEach(key => {
        if (mergedElements[key] && template.elements[key].x !== undefined) {
          mergedElements[key] = {
            ...mergedElements[key],
            x: template.elements[key].x,
            y: template.elements[key].y
          };
        }
      });
      
      setElements(mergedElements);
    } else {
      setElements(template.elements);
    }
    setNewTextElements(template.newTextElements || []);
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem('savedTemplates', JSON.stringify(updatedTemplates));
  };

  // Load saved templates on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedTemplates');
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, []);

  // Auto-load saved template when modal opens
  useEffect(() => {
    if (savedTemplates.length > 0) {
      const savedTemplate = savedTemplates.find(template => template.type === type);
      if (savedTemplate) {
        loadTemplate(savedTemplate);
      }
    }
  }, [savedTemplates, type]);

  // Load agency settings on mount
  useEffect(() => {
    const loadAgencySettings = async () => {
      try {
        const { data: agencyData, error: agencyError } = await supabase
          .from('website_settings')
          .select('name, logo')
          .limit(1)
          .single();

        if (agencyError) {
          console.error('PersonalizationModal: Error fetching website_settings:', agencyError);
        } else {
          setAgencySettings(agencyData);
          console.log('PersonalizationModal loaded website settings:', agencyData);
        }
      } catch (error) {
        console.error('PersonalizationModal: Error loading website settings:', error);
      }
    };

    loadAgencySettings();
  }, []);

  // Update engagement and payment template elements when reservation changes
  useEffect(() => {
    if (type === 'engagement' || type === 'payment' || type === 'receipt' || type === 'versement') {
      // Regenerate the template with the latest data
      const updatedElements = getInitialElements(type, reservation, lang);
      // Keep positions from current elements but update text content
      const mergedElements = { ...updatedElements };
      Object.keys(updatedElements).forEach(key => {
        if (elements[key] && elements[key].x !== undefined) {
          // Preserve position and styling, update text if it changed
          mergedElements[key] = {
            ...elements[key],
            text: updatedElements[key].text // Update text to latest
          };
        }
      });
      setElements(mergedElements);
    }
  }, [reservation, type, lang]);

  const handleDrag = (elementId: string, deltaX: number, deltaY: number) => {
    setElements(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        x: prev[elementId].x + deltaX,
        y: prev[elementId].y + deltaY
      }
    }));
  };

  const getPersonalizedContent = () => generatePersonalizedContent(elements, newTextElements, reservation, type, lang, agencySettings);

  return (
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
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-saas-border">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-saas-text-main">
              🎨 {lang === 'fr' ? 'Personnalisation' : 'التخصيص'}
            </h3>
            <button
              onClick={onClose}
              className="text-saas-text-muted hover:text-saas-text-main text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 bg-gray-50 p-6 overflow-auto">
            <div 
              className="bg-white shadow-lg rounded-lg p-8 min-h-[600px] relative cursor-move"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ width: '210mm', minHeight: '297mm' }}
            >
              {/* Logo - show actual logo for engagement, exclude for others */}
              {type === 'engagement' && agencySettings?.logo && elements.logo && (
                <div
                  className={`absolute cursor-move ${selectedElement === 'logo' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ left: elements.logo.x || 50, top: elements.logo.y || 50 }}
                  onMouseDown={(e) => handleMouseDown('logo', e)}
                >
                  <img
                    src={agencySettings.logo}
                    alt="Agency Logo"
                    style={{ height: 70 }}
                    className="object-contain border border-gray-300 rounded"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      console.error('PersonalizationModal: Logo failed to load from agency_settings:', agencySettings.logo);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('PersonalizationModal: Logo loaded successfully from agency_settings:', agencySettings.logo);
                    }}
                  />
                </div>
              )}

              {/* Title */}
              <div
                className={`absolute cursor-move ${selectedElement === 'title' ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                  left: elements.title?.x || 200,
                  top: elements.title?.y || 50,
                  fontSize: elements.title?.fontSize || 24,
                  fontFamily: elements.title?.fontFamily || 'Arial',
                  color: elements.title?.color || '#000000',
                  fontWeight: elements.title?.fontWeight || 'bold',
                  fontStyle: elements.title?.fontStyle || 'normal',
                  textDecoration: elements.title?.textDecoration || 'none',
                  textAlign: elements.title?.textAlign || 'left',
                  backgroundColor: elements.title?.backgroundColor || 'transparent',
                  padding: elements.title?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                }}
                onMouseDown={(e) => handleMouseDown('title', e)}
              >
                {elements.title?.text || ''}
              </div>

              {/* Agence Name - show actual agency name for engagement, exclude for others */}
              {type === 'engagement' && agencySettings?.name && elements.agenceName && (
                <div
                  className={`absolute cursor-move ${selectedElement === 'agenceName' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.agenceName.x || 200,
                    top: elements.agenceName.y || 100,
                    fontSize: elements.agenceName.fontSize || 18,
                    fontFamily: elements.agenceName.fontFamily || 'Arial',
                    color: elements.agenceName.color || '#333333',
                    fontWeight: elements.agenceName.fontWeight || 'normal',
                    fontStyle: elements.agenceName.fontStyle || 'normal',
                    textDecoration: elements.agenceName.textDecoration || 'none',
                    textAlign: elements.agenceName.textAlign || 'left',
                    backgroundColor: elements.agenceName.backgroundColor || 'transparent',
                    padding: elements.agenceName.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                  }}
                  onMouseDown={(e) => handleMouseDown('agenceName', e)}
                >
                  {agencySettings.name}
                </div>
              )}

              {/* Engagement-specific elements */}
              {!(type === 'payment' || type === 'receipt') && (
                <>
                  {/* Client Info */}
                  <div
                    className={`absolute cursor-move ${selectedElement === 'introText' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.introText?.x || 50,
                      top: elements.introText?.y || 150,
                      fontSize: elements.introText?.fontSize || 16,
                      fontFamily: elements.introText?.fontFamily || 'Arial',
                      color: elements.introText?.color || '#000000',
                      fontWeight: elements.introText?.fontWeight || 'normal',
                      fontStyle: elements.introText?.fontStyle || 'normal',
                      textDecoration: elements.introText?.textDecoration || 'none',
                      textAlign: elements.introText?.textAlign || 'left',
                      backgroundColor: elements.introText?.backgroundColor || 'transparent',
                      padding: elements.introText?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('introText', e)}
                  >
                    {elements.introText?.text || ''}
                  </div>

                  <div
                    className={`absolute cursor-move ${selectedElement === 'clientName' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.clientName?.x || 250,
                      top: elements.clientName?.y || 150,
                      fontSize: elements.clientName?.fontSize || 16,
                      fontFamily: elements.clientName?.fontFamily || 'Arial',
                      color: elements.clientName?.color || '#000000',
                      fontWeight: elements.clientName?.fontWeight || 'bold',
                      fontStyle: elements.clientName?.fontStyle || 'normal',
                      textDecoration: elements.clientName?.textDecoration || 'none',
                      textAlign: elements.clientName?.textAlign || 'left',
                      backgroundColor: elements.clientName?.backgroundColor || 'transparent',
                      padding: elements.clientName?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('clientName', e)}
                  >
                    {elements.clientName?.text || ''}
                  </div>

                  {/* Passport Info */}
                  <div
                    className={`absolute cursor-move ${selectedElement === 'passportText' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.passportText?.x || 50,
                      top: elements.passportText?.y || 200,
                      fontSize: elements.passportText?.fontSize || 16,
                      fontFamily: elements.passportText?.fontFamily || 'Arial',
                      color: elements.passportText?.color || '#000000',
                      fontWeight: elements.passportText?.fontWeight || 'normal',
                      fontStyle: elements.passportText?.fontStyle || 'normal',
                      textDecoration: elements.passportText?.textDecoration || 'none',
                      textAlign: elements.passportText?.textAlign || 'left',
                      backgroundColor: elements.passportText?.backgroundColor || 'transparent',
                      padding: elements.passportText?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('passportText', e)}
                  >
                    {elements.passportText?.text || ''}
                  </div>

                  <div
                    className={`absolute cursor-move ${selectedElement === 'passportNumber' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.passportNumber?.x || 50,
                      top: elements.passportNumber?.y || 250,
                      fontSize: elements.passportNumber?.fontSize || 14,
                      fontFamily: elements.passportNumber?.fontFamily || 'Arial',
                      color: elements.passportNumber?.color || '#666666',
                      fontWeight: elements.passportNumber?.fontWeight || 'normal',
                      fontStyle: elements.passportNumber?.fontStyle || 'normal',
                      textDecoration: elements.passportNumber?.textDecoration || 'none',
                      textAlign: elements.passportNumber?.textAlign || 'left',
                      backgroundColor: elements.passportNumber?.backgroundColor || 'transparent',
                      padding: elements.passportNumber?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('passportNumber', e)}
                  >
                    {elements.passportNumber?.text || ''}
                  </div>

                  {/* Contract Info */}
                  <div
                    className={`absolute cursor-move ${selectedElement === 'agenceText' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.agenceText?.x || 50,
                      top: elements.agenceText?.y || 300,
                      fontSize: elements.agenceText?.fontSize || 16,
                      fontFamily: elements.agenceText?.fontFamily || 'Arial',
                      color: elements.agenceText?.color || '#000000',
                      fontWeight: elements.agenceText?.fontWeight || 'normal',
                      fontStyle: elements.agenceText?.fontStyle || 'normal',
                      textDecoration: elements.agenceText?.textDecoration || 'none',
                      textAlign: elements.agenceText?.textAlign || 'left',
                      backgroundColor: elements.agenceText?.backgroundColor || 'transparent',
                      padding: elements.agenceText?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('agenceText', e)}
                  >
                    {elements.agenceText?.text || ''}
                  </div>

                  <div
                    className={`absolute cursor-move ${selectedElement === 'currentDate' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.currentDate?.x || 50,
                      top: elements.currentDate?.y || 350,
                      fontSize: elements.currentDate?.fontSize || 16,
                      fontFamily: elements.currentDate?.fontFamily || 'Arial',
                      color: elements.currentDate?.color || '#000000',
                      fontWeight: elements.currentDate?.fontWeight || 'normal',
                      fontStyle: elements.currentDate?.fontStyle || 'normal',
                      textDecoration: elements.currentDate?.textDecoration || 'none',
                      textAlign: elements.currentDate?.textAlign || 'left',
                      backgroundColor: elements.currentDate?.backgroundColor || 'transparent',
                      padding: elements.currentDate?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('currentDate', e)}
                  >
                    {elements.currentDate?.text || ''}
                  </div>

                  <div
                    className={`absolute cursor-move ${selectedElement === 'contractText' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.contractText?.x || 50,
                      top: elements.contractText?.y || 400,
                      fontSize: elements.contractText?.fontSize || 16,
                      fontFamily: elements.contractText?.fontFamily || 'Arial',
                      color: elements.contractText?.color || '#000000',
                      fontWeight: elements.contractText?.fontWeight || 'normal',
                      fontStyle: elements.contractText?.fontStyle || 'normal',
                      textDecoration: elements.contractText?.textDecoration || 'none',
                      textAlign: elements.contractText?.textAlign || 'left',
                      backgroundColor: elements.contractText?.backgroundColor || 'transparent',
                      padding: elements.contractText?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('contractText', e)}
                  >
                    {elements.contractText?.text || ''}
                  </div>

                  {/* Car Info */}
                  <div
                    className={`absolute cursor-move ${selectedElement === 'cautionText' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.cautionText?.x || 50,
                      top: elements.cautionText?.y || 450,
                      fontSize: elements.cautionText?.fontSize || 16,
                      fontFamily: elements.cautionText?.fontFamily || 'Arial',
                      color: elements.cautionText?.color || '#000000',
                      fontWeight: elements.cautionText?.fontWeight || 'normal',
                      fontStyle: elements.cautionText?.fontStyle || 'normal',
                      textDecoration: elements.cautionText?.textDecoration || 'none',
                      textAlign: elements.cautionText?.textAlign || 'left',
                      backgroundColor: elements.cautionText?.backgroundColor || 'transparent',
                      padding: elements.cautionText?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('cautionText', e)}
                  >
                    {elements.cautionText?.text || ''}
                  </div>

                  <div
                    className={`absolute cursor-move ${selectedElement === 'carInfo' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.carInfo?.x || 50,
                      top: elements.carInfo?.y || 500,
                      fontSize: elements.carInfo?.fontSize || 16,
                      fontFamily: elements.carInfo?.fontFamily || 'Arial',
                      color: elements.carInfo?.color || '#000000',
                      fontWeight: elements.carInfo?.fontWeight || 'normal',
                      fontStyle: elements.carInfo?.fontStyle || 'normal',
                      textDecoration: elements.carInfo?.textDecoration || 'none',
                      textAlign: elements.carInfo?.textAlign || 'left',
                      backgroundColor: elements.carInfo?.backgroundColor || 'transparent',
                      padding: elements.carInfo?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('carInfo', e)}
                  >
                    {elements.carInfo?.text || ''}
                  </div>

                  <div
                    className={`absolute cursor-move ${selectedElement === 'datesText' ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: elements.datesText?.x || 50,
                      top: elements.datesText?.y || 550,
                      fontSize: elements.datesText?.fontSize || 16,
                      fontFamily: elements.datesText?.fontFamily || 'Arial',
                      color: elements.datesText?.color || '#000000',
                      fontWeight: elements.datesText?.fontWeight || 'normal',
                      fontStyle: elements.datesText?.fontStyle || 'normal',
                      textDecoration: elements.datesText?.textDecoration || 'none',
                      textAlign: elements.datesText?.textAlign || 'left',
                      backgroundColor: elements.datesText?.backgroundColor || 'transparent',
                      padding: elements.datesText?.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                    }}
                    onMouseDown={(e) => handleMouseDown('datesText', e)}
                  >
                    {elements.datesText?.text || ''}
                  </div>
                </>
              )}

              {/* Receipt-specific elements */}
              {(type === 'payment' || type === 'receipt') && (
                <>
                  {elements.receiptNumber && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'receiptNumber' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.receiptNumber.x,
                        top: elements.receiptNumber.y,
                        fontSize: elements.receiptNumber.fontSize,
                        fontFamily: elements.receiptNumber.fontFamily,
                        color: elements.receiptNumber.color,
                        fontWeight: elements.receiptNumber.fontWeight,
                        fontStyle: elements.receiptNumber.fontStyle,
                        textDecoration: elements.receiptNumber.textDecoration,
                        textAlign: elements.receiptNumber.textAlign,
                        backgroundColor: elements.receiptNumber.backgroundColor,
                        padding: elements.receiptNumber.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('receiptNumber', e)}
                    >
                      {elements.receiptNumber.text}
                    </div>
                  )}
                  {elements.receiptDate && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'receiptDate' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.receiptDate.x,
                        top: elements.receiptDate.y,
                        fontSize: elements.receiptDate.fontSize,
                        fontFamily: elements.receiptDate.fontFamily,
                        color: elements.receiptDate.color,
                        fontWeight: elements.receiptDate.fontWeight,
                        fontStyle: elements.receiptDate.fontStyle,
                        textDecoration: elements.receiptDate.textDecoration,
                        textAlign: elements.receiptDate.textAlign,
                        backgroundColor: elements.receiptDate.backgroundColor,
                        padding: elements.receiptDate.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('receiptDate', e)}
                    >
                      {elements.receiptDate.text}
                    </div>
                  )}
                  {elements.clientLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientLabel.x,
                        top: elements.clientLabel.y,
                        fontSize: elements.clientLabel.fontSize,
                        fontFamily: elements.clientLabel.fontFamily,
                        color: elements.clientLabel.color,
                        fontWeight: elements.clientLabel.fontWeight,
                        fontStyle: elements.clientLabel.fontStyle,
                        textDecoration: elements.clientLabel.textDecoration,
                        textAlign: elements.clientLabel.textAlign,
                        backgroundColor: elements.clientLabel.backgroundColor,
                        padding: elements.clientLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientLabel', e)}
                    >
                      {elements.clientLabel.text}
                    </div>
                  )}
                  {elements.clientPhone && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientPhone' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientPhone.x,
                        top: elements.clientPhone.y,
                        fontSize: elements.clientPhone.fontSize,
                        fontFamily: elements.clientPhone.fontFamily,
                        color: elements.clientPhone.color,
                        fontWeight: elements.clientPhone.fontWeight,
                        fontStyle: elements.clientPhone.fontStyle,
                        textDecoration: elements.clientPhone.textDecoration,
                        textAlign: elements.clientPhone.textAlign,
                        backgroundColor: elements.clientPhone.backgroundColor,
                        padding: elements.clientPhone.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientPhone', e)}
                    >
                      {elements.clientPhone.text}
                    </div>
                  )}
                  {elements.carLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'carLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.carLabel.x,
                        top: elements.carLabel.y,
                        fontSize: elements.carLabel.fontSize,
                        fontFamily: elements.carLabel.fontFamily,
                        color: elements.carLabel.color,
                        fontWeight: elements.carLabel.fontWeight,
                        fontStyle: elements.carLabel.fontStyle,
                        textDecoration: elements.carLabel.textDecoration,
                        textAlign: elements.carLabel.textAlign,
                        backgroundColor: elements.carLabel.backgroundColor,
                        padding: elements.carLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('carLabel', e)}
                    >
                      {elements.carLabel.text}
                    </div>
                  )}
                  {elements.rentalPeriod && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalPeriod' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalPeriod.x,
                        top: elements.rentalPeriod.y,
                        fontSize: elements.rentalPeriod.fontSize,
                        fontFamily: elements.rentalPeriod.fontFamily,
                        color: elements.rentalPeriod.color,
                        fontWeight: elements.rentalPeriod.fontWeight,
                        fontStyle: elements.rentalPeriod.fontStyle,
                        textDecoration: elements.rentalPeriod.textDecoration,
                        textAlign: elements.rentalPeriod.textAlign,
                        backgroundColor: elements.rentalPeriod.backgroundColor,
                        padding: elements.rentalPeriod.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalPeriod', e)}
                    >
                      {elements.rentalPeriod.text}
                    </div>
                  )}
                  {elements.totalLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalLabel.x,
                        top: elements.totalLabel.y,
                        fontSize: elements.totalLabel.fontSize,
                        fontFamily: elements.totalLabel.fontFamily,
                        color: elements.totalLabel.color,
                        fontWeight: elements.totalLabel.fontWeight,
                        fontStyle: elements.totalLabel.fontStyle,
                        textDecoration: elements.totalLabel.textDecoration,
                        textAlign: elements.totalLabel.textAlign,
                        backgroundColor: elements.totalLabel.backgroundColor,
                        padding: elements.totalLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalLabel', e)}
                    >
                      {elements.totalLabel.text}
                    </div>
                  )}
                  {elements.totalAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalAmount.x,
                        top: elements.totalAmount.y,
                        fontSize: elements.totalAmount.fontSize,
                        fontFamily: elements.totalAmount.fontFamily,
                        color: elements.totalAmount.color,
                        fontWeight: elements.totalAmount.fontWeight,
                        fontStyle: elements.totalAmount.fontStyle,
                        textDecoration: elements.totalAmount.textDecoration,
                        textAlign: elements.totalAmount.textAlign,
                        backgroundColor: elements.totalAmount.backgroundColor,
                        padding: elements.totalAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalAmount', e)}
                    >
                      {elements.totalAmount.text}
                    </div>
                  )}
                  {elements.paidLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'paidLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.paidLabel.x,
                        top: elements.paidLabel.y,
                        fontSize: elements.paidLabel.fontSize,
                        fontFamily: elements.paidLabel.fontFamily,
                        color: elements.paidLabel.color,
                        fontWeight: elements.paidLabel.fontWeight,
                        fontStyle: elements.paidLabel.fontStyle,
                        textDecoration: elements.paidLabel.textDecoration,
                        textAlign: elements.paidLabel.textAlign,
                        backgroundColor: elements.paidLabel.backgroundColor,
                        padding: elements.paidLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('paidLabel', e)}
                    >
                      {elements.paidLabel.text}
                    </div>
                  )}
                  {elements.paidAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'paidAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.paidAmount.x,
                        top: elements.paidAmount.y,
                        fontSize: elements.paidAmount.fontSize,
                        fontFamily: elements.paidAmount.fontFamily,
                        color: elements.paidAmount.color,
                        fontWeight: elements.paidAmount.fontWeight,
                        fontStyle: elements.paidAmount.fontStyle,
                        textDecoration: elements.paidAmount.textDecoration,
                        textAlign: elements.paidAmount.textAlign,
                        backgroundColor: elements.paidAmount.backgroundColor,
                        padding: elements.paidAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('paidAmount', e)}
                    >
                      {elements.paidAmount.text}
                    </div>
                  )}
                  {elements.remainingLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'remainingLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.remainingLabel.x,
                        top: elements.remainingLabel.y,
                        fontSize: elements.remainingLabel.fontSize,
                        fontFamily: elements.remainingLabel.fontFamily,
                        color: elements.remainingLabel.color,
                        fontWeight: elements.remainingLabel.fontWeight,
                        fontStyle: elements.remainingLabel.fontStyle,
                        textDecoration: elements.remainingLabel.textDecoration,
                        textAlign: elements.remainingLabel.textAlign,
                        backgroundColor: elements.remainingLabel.backgroundColor,
                        padding: elements.remainingLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('remainingLabel', e)}
                    >
                      {elements.remainingLabel.text}
                    </div>
                  )}
                  {elements.remainingAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'remainingAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.remainingAmount.x,
                        top: elements.remainingAmount.y,
                        fontSize: elements.remainingAmount.fontSize,
                        fontFamily: elements.remainingAmount.fontFamily,
                        color: elements.remainingAmount.color,
                        fontWeight: elements.remainingAmount.fontWeight,
                        fontStyle: elements.remainingAmount.fontStyle,
                        textDecoration: elements.remainingAmount.textDecoration,
                        textAlign: elements.remainingAmount.textAlign,
                        backgroundColor: elements.remainingAmount.backgroundColor,
                        padding: elements.remainingAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('remainingAmount', e)}
                    >
                      {elements.remainingAmount.text}
                    </div>
                  )}
                </>
              )}

              {/* Invoice-specific elements */}
              {type === 'invoice' || type === 'facture' ? (
                <>
                  {/* Invoice header */}
                  {elements.invoiceNumber && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'invoiceNumber' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.invoiceNumber.x,
                        top: elements.invoiceNumber.y,
                        fontSize: elements.invoiceNumber.fontSize,
                        fontFamily: elements.invoiceNumber.fontFamily,
                        color: elements.invoiceNumber.color,
                        fontWeight: elements.invoiceNumber.fontWeight,
                        fontStyle: elements.invoiceNumber.fontStyle,
                        textDecoration: elements.invoiceNumber.textDecoration,
                        textAlign: elements.invoiceNumber.textAlign,
                        backgroundColor: elements.invoiceNumber.backgroundColor,
                        padding: elements.invoiceNumber.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('invoiceNumber', e)}
                    >
                      {elements.invoiceNumber.text}
                    </div>
                  )}
                  {elements.invoiceDate && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'invoiceDate' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.invoiceDate.x,
                        top: elements.invoiceDate.y,
                        fontSize: elements.invoiceDate.fontSize,
                        fontFamily: elements.invoiceDate.fontFamily,
                        color: elements.invoiceDate.color,
                        fontWeight: elements.invoiceDate.fontWeight,
                        fontStyle: elements.invoiceDate.fontStyle,
                        textDecoration: elements.invoiceDate.textDecoration,
                        textAlign: elements.invoiceDate.textAlign,
                        backgroundColor: elements.invoiceDate.backgroundColor,
                        padding: elements.invoiceDate.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('invoiceDate', e)}
                    >
                      {elements.invoiceDate.text}
                    </div>
                  )}

                  {/* Client Information */}
                  {elements.clientSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientSectionTitle.x,
                        top: elements.clientSectionTitle.y,
                        fontSize: elements.clientSectionTitle.fontSize,
                        fontFamily: elements.clientSectionTitle.fontFamily,
                        color: elements.clientSectionTitle.color,
                        fontWeight: elements.clientSectionTitle.fontWeight,
                        fontStyle: elements.clientSectionTitle.fontStyle,
                        textDecoration: elements.clientSectionTitle.textDecoration,
                        textAlign: elements.clientSectionTitle.textAlign,
                        backgroundColor: elements.clientSectionTitle.backgroundColor,
                        padding: elements.clientSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientSectionTitle', e)}
                    >
                      {elements.clientSectionTitle.text}
                    </div>
                  )}
                  {elements.clientNameLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientNameLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientNameLabel.x,
                        top: elements.clientNameLabel.y,
                        fontSize: elements.clientNameLabel.fontSize,
                        fontFamily: elements.clientNameLabel.fontFamily,
                        color: elements.clientNameLabel.color,
                        fontWeight: elements.clientNameLabel.fontWeight,
                        fontStyle: elements.clientNameLabel.fontStyle,
                        textDecoration: elements.clientNameLabel.textDecoration,
                        textAlign: elements.clientNameLabel.textAlign,
                        backgroundColor: elements.clientNameLabel.backgroundColor,
                        padding: elements.clientNameLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientNameLabel', e)}
                    >
                      {elements.clientNameLabel.text}
                    </div>
                  )}
                  {elements.clientName && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientName' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientName.x,
                        top: elements.clientName.y,
                        fontSize: elements.clientName.fontSize,
                        fontFamily: elements.clientName.fontFamily,
                        color: elements.clientName.color,
                        fontWeight: elements.clientName.fontWeight,
                        fontStyle: elements.clientName.fontStyle,
                        textDecoration: elements.clientName.textDecoration,
                        textAlign: elements.clientName.textAlign,
                        backgroundColor: elements.clientName.backgroundColor,
                        padding: elements.clientName.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientName', e)}
                    >
                      {elements.clientName.text}
                    </div>
                  )}
                  {elements.clientPhoneLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientPhoneLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientPhoneLabel.x,
                        top: elements.clientPhoneLabel.y,
                        fontSize: elements.clientPhoneLabel.fontSize,
                        fontFamily: elements.clientPhoneLabel.fontFamily,
                        color: elements.clientPhoneLabel.color,
                        fontWeight: elements.clientPhoneLabel.fontWeight,
                        fontStyle: elements.clientPhoneLabel.fontStyle,
                        textDecoration: elements.clientPhoneLabel.textDecoration,
                        textAlign: elements.clientPhoneLabel.textAlign,
                        backgroundColor: elements.clientPhoneLabel.backgroundColor,
                        padding: elements.clientPhoneLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientPhoneLabel', e)}
                    >
                      {elements.clientPhoneLabel.text}
                    </div>
                  )}
                  {elements.clientPhone && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientPhone' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientPhone.x,
                        top: elements.clientPhone.y,
                        fontSize: elements.clientPhone.fontSize,
                        fontFamily: elements.clientPhone.fontFamily,
                        color: elements.clientPhone.color,
                        fontWeight: elements.clientPhone.fontWeight,
                        fontStyle: elements.clientPhone.fontStyle,
                        textDecoration: elements.clientPhone.textDecoration,
                        textAlign: elements.clientPhone.textAlign,
                        backgroundColor: elements.clientPhone.backgroundColor,
                        padding: elements.clientPhone.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientPhone', e)}
                    >
                      {elements.clientPhone.text}
                    </div>
                  )}
                  {elements.clientAddressLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientAddressLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientAddressLabel.x,
                        top: elements.clientAddressLabel.y,
                        fontSize: elements.clientAddressLabel.fontSize,
                        fontFamily: elements.clientAddressLabel.fontFamily,
                        color: elements.clientAddressLabel.color,
                        fontWeight: elements.clientAddressLabel.fontWeight,
                        fontStyle: elements.clientAddressLabel.fontStyle,
                        textDecoration: elements.clientAddressLabel.textDecoration,
                        textAlign: elements.clientAddressLabel.textAlign,
                        backgroundColor: elements.clientAddressLabel.backgroundColor,
                        padding: elements.clientAddressLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientAddressLabel', e)}
                    >
                      {elements.clientAddressLabel.text}
                    </div>
                  )}
                  {elements.clientAddress && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientAddress' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientAddress.x,
                        top: elements.clientAddress.y,
                        fontSize: elements.clientAddress.fontSize,
                        fontFamily: elements.clientAddress.fontFamily,
                        color: elements.clientAddress.color,
                        fontWeight: elements.clientAddress.fontWeight,
                        fontStyle: elements.clientAddress.fontStyle,
                        textDecoration: elements.clientAddress.textDecoration,
                        textAlign: elements.clientAddress.textAlign,
                        backgroundColor: elements.clientAddress.backgroundColor,
                        padding: elements.clientAddress.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientAddress', e)}
                    >
                      {elements.clientAddress.text}
                    </div>
                  )}

                  {/* Vehicle Information */}
                  {elements.vehicleSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleSectionTitle.x,
                        top: elements.vehicleSectionTitle.y,
                        fontSize: elements.vehicleSectionTitle.fontSize,
                        fontFamily: elements.vehicleSectionTitle.fontFamily,
                        color: elements.vehicleSectionTitle.color,
                        fontWeight: elements.vehicleSectionTitle.fontWeight,
                        fontStyle: elements.vehicleSectionTitle.fontStyle,
                        textDecoration: elements.vehicleSectionTitle.textDecoration,
                        textAlign: elements.vehicleSectionTitle.textAlign,
                        backgroundColor: elements.vehicleSectionTitle.backgroundColor,
                        padding: elements.vehicleSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleSectionTitle', e)}
                    >
                      {elements.vehicleSectionTitle.text}
                    </div>
                  )}
                  {elements.vehicleBrand && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleBrand' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleBrand.x,
                        top: elements.vehicleBrand.y,
                        fontSize: elements.vehicleBrand.fontSize,
                        fontFamily: elements.vehicleBrand.fontFamily,
                        color: elements.vehicleBrand.color,
                        fontWeight: elements.vehicleBrand.fontWeight,
                        fontStyle: elements.vehicleBrand.fontStyle,
                        textDecoration: elements.vehicleBrand.textDecoration,
                        textAlign: elements.vehicleBrand.textAlign,
                        backgroundColor: elements.vehicleBrand.backgroundColor,
                        padding: elements.vehicleBrand.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleBrand', e)}
                    >
                      {elements.vehicleBrand.text}
                    </div>
                  )}
                  {elements.vehicleModel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleModel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleModel.x,
                        top: elements.vehicleModel.y,
                        fontSize: elements.vehicleModel.fontSize,
                        fontFamily: elements.vehicleModel.fontFamily,
                        color: elements.vehicleModel.color,
                        fontWeight: elements.vehicleModel.fontWeight,
                        fontStyle: elements.vehicleModel.fontStyle,
                        textDecoration: elements.vehicleModel.textDecoration,
                        textAlign: elements.vehicleModel.textAlign,
                        backgroundColor: elements.vehicleModel.backgroundColor,
                        padding: elements.vehicleModel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleModel', e)}
                    >
                      {elements.vehicleModel.text}
                    </div>
                  )}
                  {elements.vehicleRegistration && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleRegistration' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleRegistration.x,
                        top: elements.vehicleRegistration.y,
                        fontSize: elements.vehicleRegistration.fontSize,
                        fontFamily: elements.vehicleRegistration.fontFamily,
                        color: elements.vehicleRegistration.color,
                        fontWeight: elements.vehicleRegistration.fontWeight,
                        fontStyle: elements.vehicleRegistration.fontStyle,
                        textDecoration: elements.vehicleRegistration.textDecoration,
                        textAlign: elements.vehicleRegistration.textAlign,
                        backgroundColor: elements.vehicleRegistration.backgroundColor,
                        padding: elements.vehicleRegistration.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleRegistration', e)}
                    >
                      {elements.vehicleRegistration.text}
                    </div>
                  )}

                  {/* Rental Period */}
                  {elements.rentalPeriodTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalPeriodTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalPeriodTitle.x,
                        top: elements.rentalPeriodTitle.y,
                        fontSize: elements.rentalPeriodTitle.fontSize,
                        fontFamily: elements.rentalPeriodTitle.fontFamily,
                        color: elements.rentalPeriodTitle.color,
                        fontWeight: elements.rentalPeriodTitle.fontWeight,
                        fontStyle: elements.rentalPeriodTitle.fontStyle,
                        textDecoration: elements.rentalPeriodTitle.textDecoration,
                        textAlign: elements.rentalPeriodTitle.textAlign,
                        backgroundColor: elements.rentalPeriodTitle.backgroundColor,
                        padding: elements.rentalPeriodTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalPeriodTitle', e)}
                    >
                      {elements.rentalPeriodTitle.text}
                    </div>
                  )}
                  {elements.rentalPeriod && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalPeriod' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalPeriod.x,
                        top: elements.rentalPeriod.y,
                        fontSize: elements.rentalPeriod.fontSize,
                        fontFamily: elements.rentalPeriod.fontFamily,
                        color: elements.rentalPeriod.color,
                        fontWeight: elements.rentalPeriod.fontWeight,
                        fontStyle: elements.rentalPeriod.fontStyle,
                        textDecoration: elements.rentalPeriod.textDecoration,
                        textAlign: elements.rentalPeriod.textAlign,
                        backgroundColor: elements.rentalPeriod.backgroundColor,
                        padding: elements.rentalPeriod.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalPeriod', e)}
                    >
                      {elements.rentalPeriod.text}
                    </div>
                  )}
                  {elements.rentalDuration && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalDuration' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalDuration.x,
                        top: elements.rentalDuration.y,
                        fontSize: elements.rentalDuration.fontSize,
                        fontFamily: elements.rentalDuration.fontFamily,
                        color: elements.rentalDuration.color,
                        fontWeight: elements.rentalDuration.fontWeight,
                        fontStyle: elements.rentalDuration.fontStyle,
                        textDecoration: elements.rentalDuration.textDecoration,
                        textAlign: elements.rentalDuration.textAlign,
                        backgroundColor: elements.rentalDuration.backgroundColor,
                        padding: elements.rentalDuration.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalDuration', e)}
                    >
                      {elements.rentalDuration.text}
                    </div>
                  )}

                  {/* Services and Pricing */}
                  {elements.servicesTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'servicesTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.servicesTitle.x,
                        top: elements.servicesTitle.y,
                        fontSize: elements.servicesTitle.fontSize,
                        fontFamily: elements.servicesTitle.fontFamily,
                        color: elements.servicesTitle.color,
                        fontWeight: elements.servicesTitle.fontWeight,
                        fontStyle: elements.servicesTitle.fontStyle,
                        textDecoration: elements.servicesTitle.textDecoration,
                        textAlign: elements.servicesTitle.textAlign,
                        backgroundColor: elements.servicesTitle.backgroundColor,
                        padding: elements.servicesTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('servicesTitle', e)}
                    >
                      {elements.servicesTitle.text}
                    </div>
                  )}
                  {elements.rentalService && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalService' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalService.x,
                        top: elements.rentalService.y,
                        fontSize: elements.rentalService.fontSize,
                        fontFamily: elements.rentalService.fontFamily,
                        color: elements.rentalService.color,
                        fontWeight: elements.rentalService.fontWeight,
                        fontStyle: elements.rentalService.fontStyle,
                        textDecoration: elements.rentalService.textDecoration,
                        textAlign: elements.rentalService.textAlign,
                        backgroundColor: elements.rentalService.backgroundColor,
                        padding: elements.rentalService.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalService', e)}
                    >
                      {elements.rentalService.text}
                    </div>
                  )}
                  {elements.rentalPrice && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalPrice' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalPrice.x,
                        top: elements.rentalPrice.y,
                        fontSize: elements.rentalPrice.fontSize,
                        fontFamily: elements.rentalPrice.fontFamily,
                        color: elements.rentalPrice.color,
                        fontWeight: elements.rentalPrice.fontWeight,
                        fontStyle: elements.rentalPrice.fontStyle,
                        textDecoration: elements.rentalPrice.textDecoration,
                        textAlign: elements.rentalPrice.textAlign,
                        backgroundColor: elements.rentalPrice.backgroundColor,
                        padding: elements.rentalPrice.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalPrice', e)}
                    >
                      {elements.rentalPrice.text}
                    </div>
                  )}

                  {/* Additional Services */}
                  {elements.additionalServicesTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'additionalServicesTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.additionalServicesTitle.x,
                        top: elements.additionalServicesTitle.y,
                        fontSize: elements.additionalServicesTitle.fontSize,
                        fontFamily: elements.additionalServicesTitle.fontFamily,
                        color: elements.additionalServicesTitle.color,
                        fontWeight: elements.additionalServicesTitle.fontWeight,
                        fontStyle: elements.additionalServicesTitle.fontStyle,
                        textDecoration: elements.additionalServicesTitle.textDecoration,
                        textAlign: elements.additionalServicesTitle.textAlign,
                        backgroundColor: elements.additionalServicesTitle.backgroundColor,
                        padding: elements.additionalServicesTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('additionalServicesTitle', e)}
                    >
                      {elements.additionalServicesTitle.text}
                    </div>
                  )}
                  {elements.additionalServices && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'additionalServices' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.additionalServices.x,
                        top: elements.additionalServices.y,
                        fontSize: elements.additionalServices.fontSize,
                        fontFamily: elements.additionalServices.fontFamily,
                        color: elements.additionalServices.color,
                        fontWeight: elements.additionalServices.fontWeight,
                        fontStyle: elements.additionalServices.fontStyle,
                        textDecoration: elements.additionalServices.textDecoration,
                        textAlign: elements.additionalServices.textAlign,
                        backgroundColor: elements.additionalServices.backgroundColor,
                        padding: elements.additionalServices.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('additionalServices', e)}
                    >
                      {elements.additionalServices.text}
                    </div>
                  )}

                  {/* Supplementary Fees */}
                  {elements.supplementaryFeesTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'supplementaryFeesTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.supplementaryFeesTitle.x,
                        top: elements.supplementaryFeesTitle.y,
                        fontSize: elements.supplementaryFeesTitle.fontSize,
                        fontFamily: elements.supplementaryFeesTitle.fontFamily,
                        color: elements.supplementaryFeesTitle.color,
                        fontWeight: elements.supplementaryFeesTitle.fontWeight,
                        fontStyle: elements.supplementaryFeesTitle.fontStyle,
                        textDecoration: elements.supplementaryFeesTitle.textDecoration,
                        textAlign: elements.supplementaryFeesTitle.textAlign,
                        backgroundColor: elements.supplementaryFeesTitle.backgroundColor,
                        padding: elements.supplementaryFeesTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('supplementaryFeesTitle', e)}
                    >
                      {elements.supplementaryFeesTitle.text}
                    </div>
                  )}
                  {elements.supplementaryFees && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'supplementaryFees' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.supplementaryFees.x,
                        top: elements.supplementaryFees.y,
                        fontSize: elements.supplementaryFees.fontSize,
                        fontFamily: elements.supplementaryFees.fontFamily,
                        color: elements.supplementaryFees.color,
                        fontWeight: elements.supplementaryFees.fontWeight,
                        fontStyle: elements.supplementaryFees.fontStyle,
                        textDecoration: elements.supplementaryFees.textDecoration,
                        textAlign: elements.supplementaryFees.textAlign,
                        backgroundColor: elements.supplementaryFees.backgroundColor,
                        padding: elements.supplementaryFees.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('supplementaryFees', e)}
                    >
                      {elements.supplementaryFees.text}
                    </div>
                  )}

                  {/* Subtotal, TVA, Total */}
                  {elements.subtotalLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'subtotalLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.subtotalLabel.x,
                        top: elements.subtotalLabel.y,
                        fontSize: elements.subtotalLabel.fontSize,
                        fontFamily: elements.subtotalLabel.fontFamily,
                        color: elements.subtotalLabel.color,
                        fontWeight: elements.subtotalLabel.fontWeight,
                        fontStyle: elements.subtotalLabel.fontStyle,
                        textDecoration: elements.subtotalLabel.textDecoration,
                        textAlign: elements.subtotalLabel.textAlign,
                        backgroundColor: elements.subtotalLabel.backgroundColor,
                        padding: elements.subtotalLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('subtotalLabel', e)}
                    >
                      {elements.subtotalLabel.text}
                    </div>
                  )}
                  {elements.subtotalAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'subtotalAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.subtotalAmount.x,
                        top: elements.subtotalAmount.y,
                        fontSize: elements.subtotalAmount.fontSize,
                        fontFamily: elements.subtotalAmount.fontFamily,
                        color: elements.subtotalAmount.color,
                        fontWeight: elements.subtotalAmount.fontWeight,
                        fontStyle: elements.subtotalAmount.fontStyle,
                        textDecoration: elements.subtotalAmount.textDecoration,
                        textAlign: elements.subtotalAmount.textAlign,
                        backgroundColor: elements.subtotalAmount.backgroundColor,
                        padding: elements.subtotalAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('subtotalAmount', e)}
                    >
                      {elements.subtotalAmount.text}
                    </div>
                  )}
                  {elements.tvaLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'tvaLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.tvaLabel.x,
                        top: elements.tvaLabel.y,
                        fontSize: elements.tvaLabel.fontSize,
                        fontFamily: elements.tvaLabel.fontFamily,
                        color: elements.tvaLabel.color,
                        fontWeight: elements.tvaLabel.fontWeight,
                        fontStyle: elements.tvaLabel.fontStyle,
                        textDecoration: elements.tvaLabel.textDecoration,
                        textAlign: elements.tvaLabel.textAlign,
                        backgroundColor: elements.tvaLabel.backgroundColor,
                        padding: elements.tvaLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('tvaLabel', e)}
                    >
                      {elements.tvaLabel.text}
                    </div>
                  )}
                  {elements.tvaAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'tvaAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.tvaAmount.x,
                        top: elements.tvaAmount.y,
                        fontSize: elements.tvaAmount.fontSize,
                        fontFamily: elements.tvaAmount.fontFamily,
                        color: elements.tvaAmount.color,
                        fontWeight: elements.tvaAmount.fontWeight,
                        fontStyle: elements.tvaAmount.fontStyle,
                        textDecoration: elements.tvaAmount.textDecoration,
                        textAlign: elements.tvaAmount.textAlign,
                        backgroundColor: elements.tvaAmount.backgroundColor,
                        padding: elements.tvaAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('tvaAmount', e)}
                    >
                      {elements.tvaAmount.text}
                    </div>
                  )}
                  {elements.totalLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalLabel.x,
                        top: elements.totalLabel.y,
                        fontSize: elements.totalLabel.fontSize,
                        fontFamily: elements.totalLabel.fontFamily,
                        color: elements.totalLabel.color,
                        fontWeight: elements.totalLabel.fontWeight,
                        fontStyle: elements.totalLabel.fontStyle,
                        textDecoration: elements.totalLabel.textDecoration,
                        textAlign: elements.totalLabel.textAlign,
                        backgroundColor: elements.totalLabel.backgroundColor,
                        padding: elements.totalLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalLabel', e)}
                    >
                      {elements.totalLabel.text}
                    </div>
                  )}
                  {elements.totalAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalAmount.x,
                        top: elements.totalAmount.y,
                        fontSize: elements.totalAmount.fontSize,
                        fontFamily: elements.totalAmount.fontFamily,
                        color: elements.totalAmount.color,
                        fontWeight: elements.totalAmount.fontWeight,
                        fontStyle: elements.totalAmount.fontStyle,
                        textDecoration: elements.totalAmount.textDecoration,
                        textAlign: elements.totalAmount.textAlign,
                        backgroundColor: elements.totalAmount.backgroundColor,
                        padding: elements.totalAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalAmount', e)}
                    >
                      {elements.totalAmount.text}
                    </div>
                  )}

                  {/* Payment Information */}
                  {elements.paymentSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'paymentSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.paymentSectionTitle.x,
                        top: elements.paymentSectionTitle.y,
                        fontSize: elements.paymentSectionTitle.fontSize,
                        fontFamily: elements.paymentSectionTitle.fontFamily,
                        color: elements.paymentSectionTitle.color,
                        fontWeight: elements.paymentSectionTitle.fontWeight,
                        fontStyle: elements.paymentSectionTitle.fontStyle,
                        textDecoration: elements.paymentSectionTitle.textDecoration,
                        textAlign: elements.paymentSectionTitle.textAlign,
                        backgroundColor: elements.paymentSectionTitle.backgroundColor,
                        padding: elements.paymentSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('paymentSectionTitle', e)}
                    >
                      {elements.paymentSectionTitle.text}
                    </div>
                  )}
                  {elements.totalPaidLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalPaidLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalPaidLabel.x,
                        top: elements.totalPaidLabel.y,
                        fontSize: elements.totalPaidLabel.fontSize,
                        fontFamily: elements.totalPaidLabel.fontFamily,
                        color: elements.totalPaidLabel.color,
                        fontWeight: elements.totalPaidLabel.fontWeight,
                        fontStyle: elements.totalPaidLabel.fontStyle,
                        textDecoration: elements.totalPaidLabel.textDecoration,
                        textAlign: elements.totalPaidLabel.textAlign,
                        backgroundColor: elements.totalPaidLabel.backgroundColor,
                        padding: elements.totalPaidLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalPaidLabel', e)}
                    >
                      {elements.totalPaidLabel.text}
                    </div>
                  )}
                  {elements.totalPaidAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalPaidAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalPaidAmount.x,
                        top: elements.totalPaidAmount.y,
                        fontSize: elements.totalPaidAmount.fontSize,
                        fontFamily: elements.totalPaidAmount.fontFamily,
                        color: elements.totalPaidAmount.color,
                        fontWeight: elements.totalPaidAmount.fontWeight,
                        fontStyle: elements.totalPaidAmount.fontStyle,
                        textDecoration: elements.totalPaidAmount.textDecoration,
                        textAlign: elements.totalPaidAmount.textAlign,
                        backgroundColor: elements.totalPaidAmount.backgroundColor,
                        padding: elements.totalPaidAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalPaidAmount', e)}
                    >
                      {elements.totalPaidAmount.text}
                    </div>
                  )}
                  {elements.remainingLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'remainingLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.remainingLabel.x,
                        top: elements.remainingLabel.y,
                        fontSize: elements.remainingLabel.fontSize,
                        fontFamily: elements.remainingLabel.fontFamily,
                        color: elements.remainingLabel.color,
                        fontWeight: elements.remainingLabel.fontWeight,
                        fontStyle: elements.remainingLabel.fontStyle,
                        textDecoration: elements.remainingLabel.textDecoration,
                        textAlign: elements.remainingLabel.textAlign,
                        backgroundColor: elements.remainingLabel.backgroundColor,
                        padding: elements.remainingLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('remainingLabel', e)}
                    >
                      {elements.remainingLabel.text}
                    </div>
                  )}
                  {elements.remainingAmount && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'remainingAmount' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.remainingAmount.x,
                        top: elements.remainingAmount.y,
                        fontSize: elements.remainingAmount.fontSize,
                        fontFamily: elements.remainingAmount.fontFamily,
                        color: elements.remainingAmount.color,
                        fontWeight: elements.remainingAmount.fontWeight,
                        fontStyle: elements.remainingAmount.fontStyle,
                        textDecoration: elements.remainingAmount.textDecoration,
                        textAlign: elements.remainingAmount.textAlign,
                        backgroundColor: elements.remainingAmount.backgroundColor,
                        padding: elements.remainingAmount.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('remainingAmount', e)}
                    >
                      {elements.remainingAmount.text}
                    </div>
                  )}

                  {/* Payment History */}
                  {elements.paymentHistoryTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'paymentHistoryTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.paymentHistoryTitle.x,
                        top: elements.paymentHistoryTitle.y,
                        fontSize: elements.paymentHistoryTitle.fontSize,
                        fontFamily: elements.paymentHistoryTitle.fontFamily,
                        color: elements.paymentHistoryTitle.color,
                        fontWeight: elements.paymentHistoryTitle.fontWeight,
                        fontStyle: elements.paymentHistoryTitle.fontStyle,
                        textDecoration: elements.paymentHistoryTitle.textDecoration,
                        textAlign: elements.paymentHistoryTitle.textAlign,
                        backgroundColor: elements.paymentHistoryTitle.backgroundColor,
                        padding: elements.paymentHistoryTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('paymentHistoryTitle', e)}
                    >
                      {elements.paymentHistoryTitle.text}
                    </div>
                  )}
                  {elements.paymentHistory && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'paymentHistory' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.paymentHistory.x,
                        top: elements.paymentHistory.y,
                        fontSize: elements.paymentHistory.fontSize,
                        fontFamily: elements.paymentHistory.fontFamily,
                        color: elements.paymentHistory.color,
                        fontWeight: elements.paymentHistory.fontWeight,
                        fontStyle: elements.paymentHistory.fontStyle,
                        textDecoration: elements.paymentHistory.textDecoration,
                        textAlign: elements.paymentHistory.textAlign,
                        backgroundColor: elements.paymentHistory.backgroundColor,
                        padding: elements.paymentHistory.backgroundColor !== 'transparent' ? '4px 8px' : '0',
                        whiteSpace: 'pre-line'
                      }}
                      onMouseDown={(e) => handleMouseDown('paymentHistory', e)}
                    >
                      {elements.paymentHistory.text}
                    </div>
                  )}
                </>
              ) : null}

              {/* Quote/Devis-specific elements */}
              {type === 'quote' || type === 'devis' ? (
                <>
                  {/* Quote header */}
                  {elements.quoteNumber && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'quoteNumber' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.quoteNumber.x,
                        top: elements.quoteNumber.y,
                        fontSize: elements.quoteNumber.fontSize,
                        fontFamily: elements.quoteNumber.fontFamily,
                        color: elements.quoteNumber.color,
                        fontWeight: elements.quoteNumber.fontWeight,
                        fontStyle: elements.quoteNumber.fontStyle,
                        textDecoration: elements.quoteNumber.textDecoration,
                        textAlign: elements.quoteNumber.textAlign,
                        backgroundColor: elements.quoteNumber.backgroundColor,
                        padding: elements.quoteNumber.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('quoteNumber', e)}
                    >
                      {elements.quoteNumber.text}
                    </div>
                  )}
                  {elements.quoteDate && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'quoteDate' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.quoteDate.x,
                        top: elements.quoteDate.y,
                        fontSize: elements.quoteDate.fontSize,
                        fontFamily: elements.quoteDate.fontFamily,
                        color: elements.quoteDate.color,
                        fontWeight: elements.quoteDate.fontWeight,
                        fontStyle: elements.quoteDate.fontStyle,
                        textDecoration: elements.quoteDate.textDecoration,
                        textAlign: elements.quoteDate.textAlign,
                        backgroundColor: elements.quoteDate.backgroundColor,
                        padding: elements.quoteDate.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('quoteDate', e)}
                    >
                      {elements.quoteDate.text}
                    </div>
                  )}

                  {/* Company Information */}
                  {elements.companySectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'companySectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.companySectionTitle.x,
                        top: elements.companySectionTitle.y,
                        fontSize: elements.companySectionTitle.fontSize,
                        fontFamily: elements.companySectionTitle.fontFamily,
                        color: elements.companySectionTitle.color,
                        fontWeight: elements.companySectionTitle.fontWeight,
                        fontStyle: elements.companySectionTitle.fontStyle,
                        textDecoration: elements.companySectionTitle.textDecoration,
                        textAlign: elements.companySectionTitle.textAlign,
                        backgroundColor: elements.companySectionTitle.backgroundColor,
                        padding: elements.companySectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('companySectionTitle', e)}
                    >
                      {elements.companySectionTitle.text}
                    </div>
                  )}
                  {elements.companyName && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'companyName' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.companyName.x,
                        top: elements.companyName.y,
                        fontSize: elements.companyName.fontSize,
                        fontFamily: elements.companyName.fontFamily,
                        color: elements.companyName.color,
                        fontWeight: elements.companyName.fontWeight,
                        fontStyle: elements.companyName.fontStyle,
                        textDecoration: elements.companyName.textDecoration,
                        textAlign: elements.companyName.textAlign,
                        backgroundColor: elements.companyName.backgroundColor,
                        padding: elements.companyName.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('companyName', e)}
                    >
                      {elements.companyName.text}
                    </div>
                  )}
                  {elements.companyCoordinates && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'companyCoordinates' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.companyCoordinates.x,
                        top: elements.companyCoordinates.y,
                        fontSize: elements.companyCoordinates.fontSize,
                        fontFamily: elements.companyCoordinates.fontFamily,
                        color: elements.companyCoordinates.color,
                        fontWeight: elements.companyCoordinates.fontWeight,
                        fontStyle: elements.companyCoordinates.fontStyle,
                        textDecoration: elements.companyCoordinates.textDecoration,
                        textAlign: elements.companyCoordinates.textAlign,
                        backgroundColor: elements.companyCoordinates.backgroundColor,
                        padding: elements.companyCoordinates.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('companyCoordinates', e)}
                    >
                      {elements.companyCoordinates.text}
                    </div>
                  )}
                  {elements.companyAddress && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'companyAddress' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.companyAddress.x,
                        top: elements.companyAddress.y,
                        fontSize: elements.companyAddress.fontSize,
                        fontFamily: elements.companyAddress.fontFamily,
                        color: elements.companyAddress.color,
                        fontWeight: elements.companyAddress.fontWeight,
                        fontStyle: elements.companyAddress.fontStyle,
                        textDecoration: elements.companyAddress.textDecoration,
                        textAlign: elements.companyAddress.textAlign,
                        backgroundColor: elements.companyAddress.backgroundColor,
                        padding: elements.companyAddress.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('companyAddress', e)}
                    >
                      {elements.companyAddress.text}
                    </div>
                  )}
                  {elements.companyEmail && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'companyEmail' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.companyEmail.x,
                        top: elements.companyEmail.y,
                        fontSize: elements.companyEmail.fontSize,
                        fontFamily: elements.companyEmail.fontFamily,
                        color: elements.companyEmail.color,
                        fontWeight: elements.companyEmail.fontWeight,
                        fontStyle: elements.companyEmail.fontStyle,
                        textDecoration: elements.companyEmail.textDecoration,
                        textAlign: elements.companyEmail.textAlign,
                        backgroundColor: elements.companyEmail.backgroundColor,
                        padding: elements.companyEmail.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('companyEmail', e)}
                    >
                      {elements.companyEmail.text}
                    </div>
                  )}

                  {/* Vehicle Specifications */}
                  {elements.vehicleSpecsTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleSpecsTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleSpecsTitle.x,
                        top: elements.vehicleSpecsTitle.y,
                        fontSize: elements.vehicleSpecsTitle.fontSize,
                        fontFamily: elements.vehicleSpecsTitle.fontFamily,
                        color: elements.vehicleSpecsTitle.color,
                        fontWeight: elements.vehicleSpecsTitle.fontWeight,
                        fontStyle: elements.vehicleSpecsTitle.fontStyle,
                        textDecoration: elements.vehicleSpecsTitle.textDecoration,
                        textAlign: elements.vehicleSpecsTitle.textAlign,
                        backgroundColor: elements.vehicleSpecsTitle.backgroundColor,
                        padding: elements.vehicleSpecsTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleSpecsTitle', e)}
                    >
                      {elements.vehicleSpecsTitle.text}
                    </div>
                  )}
                  {elements.vehicleBrandModel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleBrandModel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleBrandModel.x,
                        top: elements.vehicleBrandModel.y,
                        fontSize: elements.vehicleBrandModel.fontSize,
                        fontFamily: elements.vehicleBrandModel.fontFamily,
                        color: elements.vehicleBrandModel.color,
                        fontWeight: elements.vehicleBrandModel.fontWeight,
                        fontStyle: elements.vehicleBrandModel.fontStyle,
                        textDecoration: elements.vehicleBrandModel.textDecoration,
                        textAlign: elements.vehicleBrandModel.textAlign,
                        backgroundColor: elements.vehicleBrandModel.backgroundColor,
                        padding: elements.vehicleBrandModel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleBrandModel', e)}
                    >
                      {elements.vehicleBrandModel.text}
                    </div>
                  )}
                  {elements.vehicleCode && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleCode' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleCode.x,
                        top: elements.vehicleCode.y,
                        fontSize: elements.vehicleCode.fontSize,
                        fontFamily: elements.vehicleCode.fontFamily,
                        color: elements.vehicleCode.color,
                        fontWeight: elements.vehicleCode.fontWeight,
                        fontStyle: elements.vehicleCode.fontStyle,
                        textDecoration: elements.vehicleCode.textDecoration,
                        textAlign: elements.vehicleCode.textAlign,
                        backgroundColor: elements.vehicleCode.backgroundColor,
                        padding: elements.vehicleCode.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleCode', e)}
                    >
                      {elements.vehicleCode.text}
                    </div>
                  )}
                  {elements.vehicleRegistration && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleRegistration' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleRegistration.x,
                        top: elements.vehicleRegistration.y,
                        fontSize: elements.vehicleRegistration.fontSize,
                        fontFamily: elements.vehicleRegistration.fontFamily,
                        color: elements.vehicleRegistration.color,
                        fontWeight: elements.vehicleRegistration.fontWeight,
                        fontStyle: elements.vehicleRegistration.fontStyle,
                        textDecoration: elements.vehicleRegistration.textDecoration,
                        textAlign: elements.vehicleRegistration.textAlign,
                        backgroundColor: elements.vehicleRegistration.backgroundColor,
                        padding: elements.vehicleRegistration.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleRegistration', e)}
                    >
                      {elements.vehicleRegistration.text}
                    </div>
                  )}
                  {elements.vehicleColor && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleColor' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleColor.x,
                        top: elements.vehicleColor.y,
                        fontSize: elements.vehicleColor.fontSize,
                        fontFamily: elements.vehicleColor.fontFamily,
                        color: elements.vehicleColor.color,
                        fontWeight: elements.vehicleColor.fontWeight,
                        fontStyle: elements.vehicleColor.fontStyle,
                        textDecoration: elements.vehicleColor.textDecoration,
                        textAlign: elements.vehicleColor.textAlign,
                        backgroundColor: elements.vehicleColor.backgroundColor,
                        padding: elements.vehicleColor.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleColor', e)}
                    >
                      {elements.vehicleColor.text}
                    </div>
                  )}
                  {elements.vehicleClass && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleClass' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleClass.x,
                        top: elements.vehicleClass.y,
                        fontSize: elements.vehicleClass.fontSize,
                        fontFamily: elements.vehicleClass.fontFamily,
                        color: elements.vehicleClass.color,
                        fontWeight: elements.vehicleClass.fontWeight,
                        fontStyle: elements.vehicleClass.fontStyle,
                        textDecoration: elements.vehicleClass.textDecoration,
                        textAlign: elements.vehicleClass.textAlign,
                        backgroundColor: elements.vehicleClass.backgroundColor,
                        padding: elements.vehicleClass.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleClass', e)}
                    >
                      {elements.vehicleClass.text}
                    </div>
                  )}
                  {elements.vehicleCharacteristics && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleCharacteristics' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleCharacteristics.x,
                        top: elements.vehicleCharacteristics.y,
                        fontSize: elements.vehicleCharacteristics.fontSize,
                        fontFamily: elements.vehicleCharacteristics.fontFamily,
                        color: elements.vehicleCharacteristics.color,
                        fontWeight: elements.vehicleCharacteristics.fontWeight,
                        fontStyle: elements.vehicleCharacteristics.fontStyle,
                        textDecoration: elements.vehicleCharacteristics.textDecoration,
                        textAlign: elements.vehicleCharacteristics.textAlign,
                        backgroundColor: elements.vehicleCharacteristics.backgroundColor,
                        padding: elements.vehicleCharacteristics.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleCharacteristics', e)}
                    >
                      {elements.vehicleCharacteristics.text}
                    </div>
                  )}
                  {elements.fuelType && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'fuelType' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.fuelType.x,
                        top: elements.fuelType.y,
                        fontSize: elements.fuelType.fontSize,
                        fontFamily: elements.fuelType.fontFamily,
                        color: elements.fuelType.color,
                        fontWeight: elements.fuelType.fontWeight,
                        fontStyle: elements.fuelType.fontStyle,
                        textDecoration: elements.fuelType.textDecoration,
                        textAlign: elements.fuelType.textAlign,
                        backgroundColor: elements.fuelType.backgroundColor,
                        padding: elements.fuelType.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('fuelType', e)}
                    >
                      {elements.fuelType.text}
                    </div>
                  )}
                  {elements.currentMileage && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'currentMileage' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.currentMileage.x,
                        top: elements.currentMileage.y,
                        fontSize: elements.currentMileage.fontSize,
                        fontFamily: elements.currentMileage.fontFamily,
                        color: elements.currentMileage.color,
                        fontWeight: elements.currentMileage.fontWeight,
                        fontStyle: elements.currentMileage.fontStyle,
                        textDecoration: elements.currentMileage.textDecoration,
                        textAlign: elements.currentMileage.textAlign,
                        backgroundColor: elements.currentMileage.backgroundColor,
                        padding: elements.currentMileage.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('currentMileage', e)}
                    >
                      {elements.currentMileage.text}
                    </div>
                  )}
                  {elements.serialNumber && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'serialNumber' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.serialNumber.x,
                        top: elements.serialNumber.y,
                        fontSize: elements.serialNumber.fontSize,
                        fontFamily: elements.serialNumber.fontFamily,
                        color: elements.serialNumber.color,
                        fontWeight: elements.serialNumber.fontWeight,
                        fontStyle: elements.serialNumber.fontStyle,
                        textDecoration: elements.serialNumber.textDecoration,
                        textAlign: elements.serialNumber.textAlign,
                        backgroundColor: elements.serialNumber.backgroundColor,
                        padding: elements.serialNumber.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('serialNumber', e)}
                    >
                      {elements.serialNumber.text}
                    </div>
                  )}

                  {/* Rental Conditions and Pricing */}
                  {elements.rentalConditionsTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalConditionsTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalConditionsTitle.x,
                        top: elements.rentalConditionsTitle.y,
                        fontSize: elements.rentalConditionsTitle.fontSize,
                        fontFamily: elements.rentalConditionsTitle.fontFamily,
                        color: elements.rentalConditionsTitle.color,
                        fontWeight: elements.rentalConditionsTitle.fontWeight,
                        fontStyle: elements.rentalConditionsTitle.fontStyle,
                        textDecoration: elements.rentalConditionsTitle.textDecoration,
                        textAlign: elements.rentalConditionsTitle.textAlign,
                        backgroundColor: elements.rentalConditionsTitle.backgroundColor,
                        padding: elements.rentalConditionsTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalConditionsTitle', e)}
                    >
                      {elements.rentalConditionsTitle.text}
                    </div>
                  )}
                  {elements.dailyPrice && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'dailyPrice' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.dailyPrice.x,
                        top: elements.dailyPrice.y,
                        fontSize: elements.dailyPrice.fontSize,
                        fontFamily: elements.dailyPrice.fontFamily,
                        color: elements.dailyPrice.color,
                        fontWeight: elements.dailyPrice.fontWeight,
                        fontStyle: elements.dailyPrice.fontStyle,
                        textDecoration: elements.dailyPrice.textDecoration,
                        textAlign: elements.dailyPrice.textAlign,
                        backgroundColor: elements.dailyPrice.backgroundColor,
                        padding: elements.dailyPrice.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('dailyPrice', e)}
                    >
                      {elements.dailyPrice.text}
                    </div>
                  )}
                  {elements.numberOfDays && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'numberOfDays' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.numberOfDays.x,
                        top: elements.numberOfDays.y,
                        fontSize: elements.numberOfDays.fontSize,
                        fontFamily: elements.numberOfDays.fontFamily,
                        color: elements.numberOfDays.color,
                        fontWeight: elements.numberOfDays.fontWeight,
                        fontStyle: elements.numberOfDays.fontStyle,
                        textDecoration: elements.numberOfDays.textDecoration,
                        textAlign: elements.numberOfDays.textAlign,
                        backgroundColor: elements.numberOfDays.backgroundColor,
                        padding: elements.numberOfDays.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('numberOfDays', e)}
                    >
                      {elements.numberOfDays.text}
                    </div>
                  )}
                  {elements.rentalPeriod && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'rentalPeriod' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.rentalPeriod.x,
                        top: elements.rentalPeriod.y,
                        fontSize: elements.rentalPeriod.fontSize,
                        fontFamily: elements.rentalPeriod.fontFamily,
                        color: elements.rentalPeriod.color,
                        fontWeight: elements.rentalPeriod.fontWeight,
                        fontStyle: elements.rentalPeriod.fontStyle,
                        textDecoration: elements.rentalPeriod.textDecoration,
                        textAlign: elements.rentalPeriod.textAlign,
                        backgroundColor: elements.rentalPeriod.backgroundColor,
                        padding: elements.rentalPeriod.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('rentalPeriod', e)}
                    >
                      {elements.rentalPeriod.text}
                    </div>
                  )}
                  {elements.totalHT && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalHT' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalHT.x,
                        top: elements.totalHT.y,
                        fontSize: elements.totalHT.fontSize,
                        fontFamily: elements.totalHT.fontFamily,
                        color: elements.totalHT.color,
                        fontWeight: elements.totalHT.fontWeight,
                        fontStyle: elements.totalHT.fontStyle,
                        textDecoration: elements.totalHT.textDecoration,
                        textAlign: elements.totalHT.textAlign,
                        backgroundColor: elements.totalHT.backgroundColor,
                        padding: elements.totalHT.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalHT', e)}
                    >
                      {elements.totalHT.text}
                    </div>
                  )}
                  {elements.totalTTC && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'totalTTC' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.totalTTC.x,
                        top: elements.totalTTC.y,
                        fontSize: elements.totalTTC.fontSize,
                        fontFamily: elements.totalTTC.fontFamily,
                        color: elements.totalTTC.color,
                        fontWeight: elements.totalTTC.fontWeight,
                        fontStyle: elements.totalTTC.fontStyle,
                        textDecoration: elements.totalTTC.textDecoration,
                        textAlign: elements.totalTTC.textAlign,
                        backgroundColor: elements.totalTTC.backgroundColor,
                        padding: elements.totalTTC.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('totalTTC', e)}
                    >
                      {elements.totalTTC.text}
                    </div>
                  )}
                  {elements.numberOfVehicles && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'numberOfVehicles' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.numberOfVehicles.x,
                        top: elements.numberOfVehicles.y,
                        fontSize: elements.numberOfVehicles.fontSize,
                        fontFamily: elements.numberOfVehicles.fontFamily,
                        color: elements.numberOfVehicles.color,
                        fontWeight: elements.numberOfVehicles.fontWeight,
                        fontStyle: elements.numberOfVehicles.fontStyle,
                        textDecoration: elements.numberOfVehicles.textDecoration,
                        textAlign: elements.numberOfVehicles.textAlign,
                        backgroundColor: elements.numberOfVehicles.backgroundColor,
                        padding: elements.numberOfVehicles.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('numberOfVehicles', e)}
                    >
                      {elements.numberOfVehicles.text}
                    </div>
                  )}

                  {/* Equipment and Accessories Checklist */}
                  {elements.checklistTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'checklistTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.checklistTitle.x,
                        top: elements.checklistTitle.y,
                        fontSize: elements.checklistTitle.fontSize,
                        fontFamily: elements.checklistTitle.fontFamily,
                        color: elements.checklistTitle.color,
                        fontWeight: elements.checklistTitle.fontWeight,
                        fontStyle: elements.checklistTitle.fontStyle,
                        textDecoration: elements.checklistTitle.textDecoration,
                        textAlign: elements.checklistTitle.textAlign,
                        backgroundColor: elements.checklistTitle.backgroundColor,
                        padding: elements.checklistTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('checklistTitle', e)}
                    >
                      {elements.checklistTitle.text}
                    </div>
                  )}
                  {elements.checklistItems && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'checklistItems' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.checklistItems.x,
                        top: elements.checklistItems.y,
                        fontSize: elements.checklistItems.fontSize,
                        fontFamily: elements.checklistItems.fontFamily,
                        color: elements.checklistItems.color,
                        fontWeight: elements.checklistItems.fontWeight,
                        fontStyle: elements.checklistItems.fontStyle,
                        textDecoration: elements.checklistItems.textDecoration,
                        textAlign: elements.checklistItems.textAlign,
                        backgroundColor: elements.checklistItems.backgroundColor,
                        padding: elements.checklistItems.backgroundColor !== 'transparent' ? '4px 8px' : '0',
                        whiteSpace: 'pre-line'
                      }}
                      onMouseDown={(e) => handleMouseDown('checklistItems', e)}
                    >
                      {elements.checklistItems.text}
                    </div>
                  )}

                  {/* Signatures */}
                  {elements.agencySignatureText && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'agencySignatureText' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.agencySignatureText.x,
                        top: elements.agencySignatureText.y,
                        fontSize: elements.agencySignatureText.fontSize,
                        fontFamily: elements.agencySignatureText.fontFamily,
                        color: elements.agencySignatureText.color,
                        fontWeight: elements.agencySignatureText.fontWeight,
                        fontStyle: elements.agencySignatureText.fontStyle,
                        textDecoration: elements.agencySignatureText.textDecoration,
                        textAlign: elements.agencySignatureText.textAlign,
                        backgroundColor: elements.agencySignatureText.backgroundColor,
                        padding: elements.agencySignatureText.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('agencySignatureText', e)}
                    >
                      {elements.agencySignatureText.text}
                    </div>
                  )}
                  {elements.clientSignatureText && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientSignatureText' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientSignatureText.x,
                        top: elements.clientSignatureText.y,
                        fontSize: elements.clientSignatureText.fontSize,
                        fontFamily: elements.clientSignatureText.fontFamily,
                        color: elements.clientSignatureText.color,
                        fontWeight: elements.clientSignatureText.fontWeight,
                        fontStyle: elements.clientSignatureText.fontStyle,
                        textDecoration: elements.clientSignatureText.textDecoration,
                        textAlign: elements.clientSignatureText.textAlign,
                        backgroundColor: elements.clientSignatureText.backgroundColor,
                        padding: elements.clientSignatureText.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientSignatureText', e)}
                    >
                      {elements.clientSignatureText.text}
                    </div>
                  )}
                </>
              ) : null}

              {/* Contract-specific elements */}
              {type === 'contract' && (
                <>
                  {/* Contract number and date */}
                  {elements.contractNumber && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'contractNumber' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.contractNumber.x,
                        top: elements.contractNumber.y,
                        fontSize: elements.contractNumber.fontSize,
                        fontFamily: elements.contractNumber.fontFamily,
                        color: elements.contractNumber.color,
                        fontWeight: elements.contractNumber.fontWeight,
                        fontStyle: elements.contractNumber.fontStyle,
                        textDecoration: elements.contractNumber.textDecoration,
                        textAlign: elements.contractNumber.textAlign,
                        backgroundColor: elements.contractNumber.backgroundColor,
                        padding: elements.contractNumber.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('contractNumber', e)}
                    >
                      {elements.contractNumber.text}
                    </div>
                  )}
                  {elements.contractDate && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'contractDate' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.contractDate.x,
                        top: elements.contractDate.y,
                        fontSize: elements.contractDate.fontSize,
                        fontFamily: elements.contractDate.fontFamily,
                        color: elements.contractDate.color,
                        fontWeight: elements.contractDate.fontWeight,
                        fontStyle: elements.contractDate.fontStyle,
                        textDecoration: elements.contractDate.textDecoration,
                        textAlign: elements.contractDate.textAlign,
                        backgroundColor: elements.contractDate.backgroundColor,
                        padding: elements.contractDate.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('contractDate', e)}
                    >
                      {elements.contractDate.text}
                    </div>
                  )}

                  {/* Client Information */}
                  {elements.clientSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientSectionTitle.x,
                        top: elements.clientSectionTitle.y,
                        fontSize: elements.clientSectionTitle.fontSize,
                        fontFamily: elements.clientSectionTitle.fontFamily,
                        color: elements.clientSectionTitle.color,
                        fontWeight: elements.clientSectionTitle.fontWeight,
                        fontStyle: elements.clientSectionTitle.fontStyle,
                        textDecoration: elements.clientSectionTitle.textDecoration,
                        textAlign: elements.clientSectionTitle.textAlign,
                        backgroundColor: elements.clientSectionTitle.backgroundColor,
                        padding: elements.clientSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientSectionTitle', e)}
                    >
                      {elements.clientSectionTitle.text}
                    </div>
                  )}
                  {elements.clientNameLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientNameLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientNameLabel.x,
                        top: elements.clientNameLabel.y,
                        fontSize: elements.clientNameLabel.fontSize,
                        fontFamily: elements.clientNameLabel.fontFamily,
                        color: elements.clientNameLabel.color,
                        fontWeight: elements.clientNameLabel.fontWeight,
                        fontStyle: elements.clientNameLabel.fontStyle,
                        textDecoration: elements.clientNameLabel.textDecoration,
                        textAlign: elements.clientNameLabel.textAlign,
                        backgroundColor: elements.clientNameLabel.backgroundColor,
                        padding: elements.clientNameLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientNameLabel', e)}
                    >
                      {elements.clientNameLabel.text}
                    </div>
                  )}
                  {elements.clientName && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientName' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientName.x,
                        top: elements.clientName.y,
                        fontSize: elements.clientName.fontSize,
                        fontFamily: elements.clientName.fontFamily,
                        color: elements.clientName.color,
                        fontWeight: elements.clientName.fontWeight,
                        fontStyle: elements.clientName.fontStyle,
                        textDecoration: elements.clientName.textDecoration,
                        textAlign: elements.clientName.textAlign,
                        backgroundColor: elements.clientName.backgroundColor,
                        padding: elements.clientName.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientName', e)}
                    >
                      {elements.clientName.text}
                    </div>
                  )}
                  {elements.clientPhoneLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientPhoneLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientPhoneLabel.x,
                        top: elements.clientPhoneLabel.y,
                        fontSize: elements.clientPhoneLabel.fontSize,
                        fontFamily: elements.clientPhoneLabel.fontFamily,
                        color: elements.clientPhoneLabel.color,
                        fontWeight: elements.clientPhoneLabel.fontWeight,
                        fontStyle: elements.clientPhoneLabel.fontStyle,
                        textDecoration: elements.clientPhoneLabel.textDecoration,
                        textAlign: elements.clientPhoneLabel.textAlign,
                        backgroundColor: elements.clientPhoneLabel.backgroundColor,
                        padding: elements.clientPhoneLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientPhoneLabel', e)}
                    >
                      {elements.clientPhoneLabel.text}
                    </div>
                  )}
                  {elements.clientPhone && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientPhone' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientPhone.x,
                        top: elements.clientPhone.y,
                        fontSize: elements.clientPhone.fontSize,
                        fontFamily: elements.clientPhone.fontFamily,
                        color: elements.clientPhone.color,
                        fontWeight: elements.clientPhone.fontWeight,
                        fontStyle: elements.clientPhone.fontStyle,
                        textDecoration: elements.clientPhone.textDecoration,
                        textAlign: elements.clientPhone.textAlign,
                        backgroundColor: elements.clientPhone.backgroundColor,
                        padding: elements.clientPhone.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientPhone', e)}
                    >
                      {elements.clientPhone.text}
                    </div>
                  )}
                  {elements.clientIdLabel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientIdLabel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientIdLabel.x,
                        top: elements.clientIdLabel.y,
                        fontSize: elements.clientIdLabel.fontSize,
                        fontFamily: elements.clientIdLabel.fontFamily,
                        color: elements.clientIdLabel.color,
                        fontWeight: elements.clientIdLabel.fontWeight,
                        fontStyle: elements.clientIdLabel.fontStyle,
                        textDecoration: elements.clientIdLabel.textDecoration,
                        textAlign: elements.clientIdLabel.textAlign,
                        backgroundColor: elements.clientIdLabel.backgroundColor,
                        padding: elements.clientIdLabel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientIdLabel', e)}
                    >
                      {elements.clientIdLabel.text}
                    </div>
                  )}
                  {elements.clientId && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'clientId' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.clientId.x,
                        top: elements.clientId.y,
                        fontSize: elements.clientId.fontSize,
                        fontFamily: elements.clientId.fontFamily,
                        color: elements.clientId.color,
                        fontWeight: elements.clientId.fontWeight,
                        fontStyle: elements.clientId.fontStyle,
                        textDecoration: elements.clientId.textDecoration,
                        textAlign: elements.clientId.textAlign,
                        backgroundColor: elements.clientId.backgroundColor,
                        padding: elements.clientId.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('clientId', e)}
                    >
                      {elements.clientId.text}
                    </div>
                  )}

                  {/* Driver Information */}
                  {elements.driverSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'driverSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.driverSectionTitle.x,
                        top: elements.driverSectionTitle.y,
                        fontSize: elements.driverSectionTitle.fontSize,
                        fontFamily: elements.driverSectionTitle.fontFamily,
                        color: elements.driverSectionTitle.color,
                        fontWeight: elements.driverSectionTitle.fontWeight,
                        fontStyle: elements.driverSectionTitle.fontStyle,
                        textDecoration: elements.driverSectionTitle.textDecoration,
                        textAlign: elements.driverSectionTitle.textAlign,
                        backgroundColor: elements.driverSectionTitle.backgroundColor,
                        padding: elements.driverSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('driverSectionTitle', e)}
                    >
                      {elements.driverSectionTitle.text}
                    </div>
                  )}
                  {elements.driverName && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'driverName' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.driverName.x,
                        top: elements.driverName.y,
                        fontSize: elements.driverName.fontSize,
                        fontFamily: elements.driverName.fontFamily,
                        color: elements.driverName.color,
                        fontWeight: elements.driverName.fontWeight,
                        fontStyle: elements.driverName.fontStyle,
                        textDecoration: elements.driverName.textDecoration,
                        textAlign: elements.driverName.textAlign,
                        backgroundColor: elements.driverName.backgroundColor,
                        padding: elements.driverName.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('driverName', e)}
                    >
                      {elements.driverName.text}
                    </div>
                  )}
                  {elements.driverLicense && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'driverLicense' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.driverLicense.x,
                        top: elements.driverLicense.y,
                        fontSize: elements.driverLicense.fontSize,
                        fontFamily: elements.driverLicense.fontFamily,
                        color: elements.driverLicense.color,
                        fontWeight: elements.driverLicense.fontWeight,
                        fontStyle: elements.driverLicense.fontStyle,
                        textDecoration: elements.driverLicense.textDecoration,
                        textAlign: elements.driverLicense.textAlign,
                        backgroundColor: elements.driverLicense.backgroundColor,
                        padding: elements.driverLicense.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('driverLicense', e)}
                    >
                      {elements.driverLicense.text}
                    </div>
                  )}

                  {/* Vehicle Information */}
                  {elements.vehicleSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleSectionTitle.x,
                        top: elements.vehicleSectionTitle.y,
                        fontSize: elements.vehicleSectionTitle.fontSize,
                        fontFamily: elements.vehicleSectionTitle.fontFamily,
                        color: elements.vehicleSectionTitle.color,
                        fontWeight: elements.vehicleSectionTitle.fontWeight,
                        fontStyle: elements.vehicleSectionTitle.fontStyle,
                        textDecoration: elements.vehicleSectionTitle.textDecoration,
                        textAlign: elements.vehicleSectionTitle.textAlign,
                        backgroundColor: elements.vehicleSectionTitle.backgroundColor,
                        padding: elements.vehicleSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleSectionTitle', e)}
                    >
                      {elements.vehicleSectionTitle.text}
                    </div>
                  )}
                  {elements.vehicleBrand && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleBrand' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleBrand.x,
                        top: elements.vehicleBrand.y,
                        fontSize: elements.vehicleBrand.fontSize,
                        fontFamily: elements.vehicleBrand.fontFamily,
                        color: elements.vehicleBrand.color,
                        fontWeight: elements.vehicleBrand.fontWeight,
                        fontStyle: elements.vehicleBrand.fontStyle,
                        textDecoration: elements.vehicleBrand.textDecoration,
                        textAlign: elements.vehicleBrand.textAlign,
                        backgroundColor: elements.vehicleBrand.backgroundColor,
                        padding: elements.vehicleBrand.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleBrand', e)}
                    >
                      {elements.vehicleBrand.text}
                    </div>
                  )}
                  {elements.vehicleModel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleModel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleModel.x,
                        top: elements.vehicleModel.y,
                        fontSize: elements.vehicleModel.fontSize,
                        fontFamily: elements.vehicleModel.fontFamily,
                        color: elements.vehicleModel.color,
                        fontWeight: elements.vehicleModel.fontWeight,
                        fontStyle: elements.vehicleModel.fontStyle,
                        textDecoration: elements.vehicleModel.textDecoration,
                        textAlign: elements.vehicleModel.textAlign,
                        backgroundColor: elements.vehicleModel.backgroundColor,
                        padding: elements.vehicleModel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleModel', e)}
                    >
                      {elements.vehicleModel.text}
                    </div>
                  )}
                  {elements.vehicleRegistration && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleRegistration' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleRegistration.x,
                        top: elements.vehicleRegistration.y,
                        fontSize: elements.vehicleRegistration.fontSize,
                        fontFamily: elements.vehicleRegistration.fontFamily,
                        color: elements.vehicleRegistration.color,
                        fontWeight: elements.vehicleRegistration.fontWeight,
                        fontStyle: elements.vehicleRegistration.fontStyle,
                        textDecoration: elements.vehicleRegistration.textDecoration,
                        textAlign: elements.vehicleRegistration.textAlign,
                        backgroundColor: elements.vehicleRegistration.backgroundColor,
                        padding: elements.vehicleRegistration.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleRegistration', e)}
                    >
                      {elements.vehicleRegistration.text}
                    </div>
                  )}
                  {elements.vehicleYear && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleYear' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleYear.x,
                        top: elements.vehicleYear.y,
                        fontSize: elements.vehicleYear.fontSize,
                        fontFamily: elements.vehicleYear.fontFamily,
                        color: elements.vehicleYear.color,
                        fontWeight: elements.vehicleYear.fontWeight,
                        fontStyle: elements.vehicleYear.fontStyle,
                        textDecoration: elements.vehicleYear.textDecoration,
                        textAlign: elements.vehicleYear.textAlign,
                        backgroundColor: elements.vehicleYear.backgroundColor,
                        padding: elements.vehicleYear.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleYear', e)}
                    >
                      {elements.vehicleYear.text}
                    </div>
                  )}
                  {elements.vehicleColor && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'vehicleColor' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.vehicleColor.x,
                        top: elements.vehicleColor.y,
                        fontSize: elements.vehicleColor.fontSize,
                        fontFamily: elements.vehicleColor.fontFamily,
                        color: elements.vehicleColor.color,
                        fontWeight: elements.vehicleColor.fontWeight,
                        fontStyle: elements.vehicleColor.fontStyle,
                        textDecoration: elements.vehicleColor.textDecoration,
                        textAlign: elements.vehicleColor.textAlign,
                        backgroundColor: elements.vehicleColor.backgroundColor,
                        padding: elements.vehicleColor.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('vehicleColor', e)}
                    >
                      {elements.vehicleColor.text}
                    </div>
                  )}

                  {/* Reservation Information */}
                  {elements.reservationSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'reservationSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.reservationSectionTitle.x,
                        top: elements.reservationSectionTitle.y,
                        fontSize: elements.reservationSectionTitle.fontSize,
                        fontFamily: elements.reservationSectionTitle.fontFamily,
                        color: elements.reservationSectionTitle.color,
                        fontWeight: elements.reservationSectionTitle.fontWeight,
                        fontStyle: elements.reservationSectionTitle.fontStyle,
                        textDecoration: elements.reservationSectionTitle.textDecoration,
                        textAlign: elements.reservationSectionTitle.textAlign,
                        backgroundColor: elements.reservationSectionTitle.backgroundColor,
                        padding: elements.reservationSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('reservationSectionTitle', e)}
                    >
                      {elements.reservationSectionTitle.text}
                    </div>
                  )}
                  {elements.reservationPeriod && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'reservationPeriod' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.reservationPeriod.x,
                        top: elements.reservationPeriod.y,
                        fontSize: elements.reservationPeriod.fontSize,
                        fontFamily: elements.reservationPeriod.fontFamily,
                        color: elements.reservationPeriod.color,
                        fontWeight: elements.reservationPeriod.fontWeight,
                        fontStyle: elements.reservationPeriod.fontStyle,
                        textDecoration: elements.reservationPeriod.textDecoration,
                        textAlign: elements.reservationPeriod.textAlign,
                        backgroundColor: elements.reservationPeriod.backgroundColor,
                        padding: elements.reservationPeriod.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('reservationPeriod', e)}
                    >
                      {elements.reservationPeriod.text}
                    </div>
                  )}
                  {elements.reservationDuration && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'reservationDuration' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.reservationDuration.x,
                        top: elements.reservationDuration.y,
                        fontSize: elements.reservationDuration.fontSize,
                        fontFamily: elements.reservationDuration.fontFamily,
                        color: elements.reservationDuration.color,
                        fontWeight: elements.reservationDuration.fontWeight,
                        fontStyle: elements.reservationDuration.fontStyle,
                        textDecoration: elements.reservationDuration.textDecoration,
                        textAlign: elements.reservationDuration.textAlign,
                        backgroundColor: elements.reservationDuration.backgroundColor,
                        padding: elements.reservationDuration.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('reservationDuration', e)}
                    >
                      {elements.reservationDuration.text}
                    </div>
                  )}
                  {elements.reservationPrice && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'reservationPrice' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.reservationPrice.x,
                        top: elements.reservationPrice.y,
                        fontSize: elements.reservationPrice.fontSize,
                        fontFamily: elements.reservationPrice.fontFamily,
                        color: elements.reservationPrice.color,
                        fontWeight: elements.reservationPrice.fontWeight,
                        fontStyle: elements.reservationPrice.fontStyle,
                        textDecoration: elements.reservationPrice.textDecoration,
                        textAlign: elements.reservationPrice.textAlign,
                        backgroundColor: elements.reservationPrice.backgroundColor,
                        padding: elements.reservationPrice.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('reservationPrice', e)}
                    >
                      {elements.reservationPrice.text}
                    </div>
                  )}

                  {/* Inspection Information */}
                  {elements.inspectionSectionTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'inspectionSectionTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.inspectionSectionTitle.x,
                        top: elements.inspectionSectionTitle.y,
                        fontSize: elements.inspectionSectionTitle.fontSize,
                        fontFamily: elements.inspectionSectionTitle.fontFamily,
                        color: elements.inspectionSectionTitle.color,
                        fontWeight: elements.inspectionSectionTitle.fontWeight,
                        fontStyle: elements.inspectionSectionTitle.fontStyle,
                        textDecoration: elements.inspectionSectionTitle.textDecoration,
                        textAlign: elements.inspectionSectionTitle.textAlign,
                        backgroundColor: elements.inspectionSectionTitle.backgroundColor,
                        padding: elements.inspectionSectionTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('inspectionSectionTitle', e)}
                    >
                      {elements.inspectionSectionTitle.text}
                    </div>
                  )}
                  {elements.departureMileage && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'departureMileage' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.departureMileage.x,
                        top: elements.departureMileage.y,
                        fontSize: elements.departureMileage.fontSize,
                        fontFamily: elements.departureMileage.fontFamily,
                        color: elements.departureMileage.color,
                        fontWeight: elements.departureMileage.fontWeight,
                        fontStyle: elements.departureMileage.fontStyle,
                        textDecoration: elements.departureMileage.textDecoration,
                        textAlign: elements.departureMileage.textAlign,
                        backgroundColor: elements.departureMileage.backgroundColor,
                        padding: elements.departureMileage.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('departureMileage', e)}
                    >
                      {elements.departureMileage.text}
                    </div>
                  )}
                  {elements.departureFuel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'departureFuel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.departureFuel.x,
                        top: elements.departureFuel.y,
                        fontSize: elements.departureFuel.fontSize,
                        fontFamily: elements.departureFuel.fontFamily,
                        color: elements.departureFuel.color,
                        fontWeight: elements.departureFuel.fontWeight,
                        fontStyle: elements.departureFuel.fontStyle,
                        textDecoration: elements.departureFuel.textDecoration,
                        textAlign: elements.departureFuel.textAlign,
                        backgroundColor: elements.departureFuel.backgroundColor,
                        padding: elements.departureFuel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('departureFuel', e)}
                    >
                      {elements.departureFuel.text}
                    </div>
                  )}
                  {elements.returnMileage && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'returnMileage' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.returnMileage.x,
                        top: elements.returnMileage.y,
                        fontSize: elements.returnMileage.fontSize,
                        fontFamily: elements.returnMileage.fontFamily,
                        color: elements.returnMileage.color,
                        fontWeight: elements.returnMileage.fontWeight,
                        fontStyle: elements.returnMileage.fontStyle,
                        textDecoration: elements.returnMileage.textDecoration,
                        textAlign: elements.returnMileage.textAlign,
                        backgroundColor: elements.returnMileage.backgroundColor,
                        padding: elements.returnMileage.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('returnMileage', e)}
                    >
                      {elements.returnMileage.text}
                    </div>
                  )}
                  {elements.returnFuel && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'returnFuel' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.returnFuel.x,
                        top: elements.returnFuel.y,
                        fontSize: elements.returnFuel.fontSize,
                        fontFamily: elements.returnFuel.fontFamily,
                        color: elements.returnFuel.color,
                        fontWeight: elements.returnFuel.fontWeight,
                        fontStyle: elements.returnFuel.fontStyle,
                        textDecoration: elements.returnFuel.textDecoration,
                        textAlign: elements.returnFuel.textAlign,
                        backgroundColor: elements.returnFuel.backgroundColor,
                        padding: elements.returnFuel.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('returnFuel', e)}
                    >
                      {elements.returnFuel.text}
                    </div>
                  )}
                  {elements.inspectionItemsTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'inspectionItemsTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.inspectionItemsTitle.x,
                        top: elements.inspectionItemsTitle.y,
                        fontSize: elements.inspectionItemsTitle.fontSize,
                        fontFamily: elements.inspectionItemsTitle.fontFamily,
                        color: elements.inspectionItemsTitle.color,
                        fontWeight: elements.inspectionItemsTitle.fontWeight,
                        fontStyle: elements.inspectionItemsTitle.fontStyle,
                        textDecoration: elements.inspectionItemsTitle.textDecoration,
                        textAlign: elements.inspectionItemsTitle.textAlign,
                        backgroundColor: elements.inspectionItemsTitle.backgroundColor,
                        padding: elements.inspectionItemsTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('inspectionItemsTitle', e)}
                    >
                      {elements.inspectionItemsTitle.text}
                    </div>
                  )}
                  {elements.inspectionItems && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'inspectionItems' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.inspectionItems.x,
                        top: elements.inspectionItems.y,
                        fontSize: elements.inspectionItems.fontSize,
                        fontFamily: elements.inspectionItems.fontFamily,
                        color: elements.inspectionItems.color,
                        fontWeight: elements.inspectionItems.fontWeight,
                        fontStyle: elements.inspectionItems.fontStyle,
                        textDecoration: elements.inspectionItems.textDecoration,
                        textAlign: elements.inspectionItems.textAlign,
                        backgroundColor: elements.inspectionItems.backgroundColor,
                        padding: elements.inspectionItems.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('inspectionItems', e)}
                    >
                      {elements.inspectionItems.text}
                    </div>
                  )}

                  {/* Second page - Terms */}
                  {elements.termsTitle && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'termsTitle' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.termsTitle.x,
                        top: elements.termsTitle.y,
                        fontSize: elements.termsTitle.fontSize,
                        fontFamily: elements.termsTitle.fontFamily,
                        color: elements.termsTitle.color,
                        fontWeight: elements.termsTitle.fontWeight,
                        fontStyle: elements.termsTitle.fontStyle,
                        textDecoration: elements.termsTitle.textDecoration,
                        textAlign: elements.termsTitle.textAlign,
                        backgroundColor: elements.termsTitle.backgroundColor,
                        padding: elements.termsTitle.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                      }}
                      onMouseDown={(e) => handleMouseDown('termsTitle', e)}
                    >
                      {elements.termsTitle.text}
                    </div>
                  )}
                  {elements.termsContent && (
                    <div
                      className={`absolute cursor-move ${selectedElement === 'termsContent' ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: elements.termsContent.x,
                        top: elements.termsContent.y,
                        fontSize: elements.termsContent.fontSize,
                        fontFamily: elements.termsContent.fontFamily,
                        color: elements.termsContent.color,
                        fontWeight: elements.termsContent.fontWeight,
                        fontStyle: elements.termsContent.fontStyle,
                        textDecoration: elements.termsContent.textDecoration,
                        textAlign: elements.termsContent.textAlign,
                        backgroundColor: elements.termsContent.backgroundColor,
                        padding: elements.termsContent.backgroundColor !== 'transparent' ? '4px 8px' : '0',
                        whiteSpace: 'pre-line',
                        maxWidth: '500px'
                      }}
                      onMouseDown={(e) => handleMouseDown('termsContent', e)}
                    >
                      {elements.termsContent.text}
                    </div>
                  )}
                </>
              )}

              {/* Signatures */}
              {elements.signatureText1 && (
                <div
                  className={`absolute cursor-move ${selectedElement === 'signatureText1' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.signatureText1.x || 50,
                    top: elements.signatureText1.y || 600,
                    fontSize: elements.signatureText1.fontSize || 14,
                    fontFamily: elements.signatureText1.fontFamily || 'Arial',
                    color: elements.signatureText1.color || '#666666',
                    fontWeight: elements.signatureText1.fontWeight || 'normal',
                    fontStyle: elements.signatureText1.fontStyle || 'normal',
                    textDecoration: elements.signatureText1.textDecoration || 'none',
                    textAlign: elements.signatureText1.textAlign || 'left',
                    backgroundColor: elements.signatureText1.backgroundColor || 'transparent',
                    padding: elements.signatureText1.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                  }}
                  onMouseDown={(e) => handleMouseDown('signatureText1', e)}
                >
                  {elements.signatureText1.text || 'Signature et cachet de l\'Agence'}
                </div>
              )}

              {elements.signatureText2 && (
                <div
                  className={`absolute cursor-move ${selectedElement === 'signatureText2' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.signatureText2.x || 300,
                    top: elements.signatureText2.y || 600,
                    fontSize: elements.signatureText2.fontSize || 14,
                    fontFamily: elements.signatureText2.fontFamily || 'Arial',
                    color: elements.signatureText2.color || '#666666',
                    fontWeight: elements.signatureText2.fontWeight || 'normal',
                    fontStyle: elements.signatureText2.fontStyle || 'normal',
                    textDecoration: elements.signatureText2.textDecoration || 'none',
                    textAlign: elements.signatureText2.textAlign || 'left',
                    backgroundColor: elements.signatureText2.backgroundColor || 'transparent',
                    padding: elements.signatureText2.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                  }}
                  onMouseDown={(e) => handleMouseDown('signatureText2', e)}
                >
                  {elements.signatureText2.text || 'Signature de client'}
                </div>
              )}

              {/* New Text Elements */}
              {newTextElements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: element.x,
                    top: element.y,
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    color: element.color,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    textDecoration: element.textDecoration,
                    textAlign: element.textAlign,
                    backgroundColor: element.backgroundColor,
                    padding: element.backgroundColor !== 'transparent' ? '4px 8px' : '0'
                  }}
                  onMouseDown={(e) => handleMouseDown(element.id, e)}
                >
                  {element.text}
                </div>
              ))}
            </div>
          </div>

          {/* Properties Panel */}
          <div className="w-96 bg-gradient-to-b from-gray-50 to-gray-100 p-6 border-l border-saas-border overflow-y-auto">
            <h4 className="text-lg font-bold text-saas-text-main mb-4">
              {lang === 'fr' ? 'Propriétés' : 'الخصائص'}
            </h4>

            {selectedElement && (
              <div className="space-y-4">
                {/* Text Content */}
                <div className="bg-white p-4 rounded-lg border border-saas-border">
                  <label className="block text-sm font-bold text-saas-text-main mb-2">
                    📝 {lang === 'fr' ? 'Texte' : 'النص'}
                  </label>
                  <textarea
                    value={elements[selectedElement]?.text || newTextElements.find(el => el.id === selectedElement)?.text || ''}
                    onChange={(e) => {
                      if (selectedElement.startsWith('newText_')) {
                        setNewTextElements(prev => prev.map(el =>
                          el.id === selectedElement ? { ...el, text: e.target.value } : el
                        ));
                      } else {
                        updateElement(selectedElement, { text: e.target.value });
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Font Size */}
                <div className="bg-white p-4 rounded-lg border border-saas-border">
                  <label className="block text-sm font-bold text-saas-text-main mb-2">
                    📏 {lang === 'fr' ? 'Taille (px)' : 'الحجم (بكسل)'}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      value={elements[selectedElement]?.fontSize || newTextElements.find(el => el.id === selectedElement)?.fontSize || 16}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, fontSize: value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { fontSize: value });
                        }
                      }}
                      className="flex-1"
                      min="8"
                      max="72"
                    />
                    <span className="text-sm font-bold w-12 text-right">{elements[selectedElement]?.fontSize || newTextElements.find(el => el.id === selectedElement)?.fontSize || 16}</span>
                  </div>
                </div>

                {/* Font Family */}
                <div className="bg-white p-4 rounded-lg border border-saas-border">
                  <label className="block text-sm font-bold text-saas-text-main mb-2">
                    🔤 {lang === 'fr' ? 'Police' : 'الخط'}
                  </label>
                  <select
                    value={elements[selectedElement]?.fontFamily || newTextElements.find(el => el.id === selectedElement)?.fontFamily || 'Arial'}
                    onChange={(e) => {
                      if (selectedElement.startsWith('newText_')) {
                        setNewTextElements(prev => prev.map(el =>
                          el.id === selectedElement ? { ...el, fontFamily: e.target.value } : el
                        ));
                      } else {
                        updateElement(selectedElement, { fontFamily: e.target.value });
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>

                {/* Font Weight & Style */}
                <div className="bg-white p-4 rounded-lg border border-saas-border">
                  <label className="block text-sm font-bold text-saas-text-main mb-2">
                    ✨ {lang === 'fr' ? 'Style de texte' : 'نمط النص'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Bold */}
                    <button
                      onClick={() => {
                        const currentWeight = elements[selectedElement]?.fontWeight || newTextElements.find(el => el.id === selectedElement)?.fontWeight || 'normal';
                        const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, fontWeight: newWeight } : el
                          ));
                        } else {
                          updateElement(selectedElement, { fontWeight: newWeight });
                        }
                      }}
                      className={`p-2 rounded font-bold transition-colors ${
                        (elements[selectedElement]?.fontWeight || newTextElements.find(el => el.id === selectedElement)?.fontWeight) === 'bold'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      B
                    </button>
                    {/* Italic */}
                    <button
                      onClick={() => {
                        const currentStyle = elements[selectedElement]?.fontStyle || newTextElements.find(el => el.id === selectedElement)?.fontStyle || 'normal';
                        const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, fontStyle: newStyle } : el
                          ));
                        } else {
                          updateElement(selectedElement, { fontStyle: newStyle });
                        }
                      }}
                      className={`p-2 rounded font-italic italic transition-colors ${
                        (elements[selectedElement]?.fontStyle || newTextElements.find(el => el.id === selectedElement)?.fontStyle) === 'italic'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      I
                    </button>
                  </div>
                  {/* Underline */}
                  <button
                    onClick={() => {
                      const currentDecoration = elements[selectedElement]?.textDecoration || newTextElements.find(el => el.id === selectedElement)?.textDecoration || 'none';
                      const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
                      if (selectedElement.startsWith('newText_')) {
                        setNewTextElements(prev => prev.map(el =>
                          el.id === selectedElement ? { ...el, textDecoration: newDecoration } : el
                        ));
                      } else {
                        updateElement(selectedElement, { textDecoration: newDecoration });
                      }
                    }}
                    className={`w-full mt-2 p-2 rounded font-bold underline transition-colors ${
                      (elements[selectedElement]?.textDecoration || newTextElements.find(el => el.id === selectedElement)?.textDecoration) === 'underline'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    U
                  </button>
                </div>

                {/* Text Alignment */}
                <div className="bg-white p-4 rounded-lg border border-saas-border">
                  <label className="block text-sm font-bold text-saas-text-main mb-2">
                    ➡️ {lang === 'fr' ? 'Alignement' : 'المحاذاة'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        onClick={() => {
                          if (selectedElement.startsWith('newText_')) {
                            setNewTextElements(prev => prev.map(el =>
                              el.id === selectedElement ? { ...el, textAlign: align } : el
                            ));
                          } else {
                            updateElement(selectedElement, { textAlign: align });
                          }
                        }}
                        className={`p-2 rounded transition-colors ${
                          (elements[selectedElement]?.textAlign || newTextElements.find(el => el.id === selectedElement)?.textAlign || 'left') === align
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {align === 'left' && '⬅️'}
                        {align === 'center' && '↔️'}
                        {align === 'right' && '➡️'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div className="bg-white p-4 rounded-lg border border-saas-border">
                  <label className="block text-sm font-bold text-saas-text-main mb-2">
                    🎨 {lang === 'fr' ? 'Couleur du texte' : 'لون النص'}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={elements[selectedElement]?.color || newTextElements.find(el => el.id === selectedElement)?.color || '#000000'}
                      onChange={(e) => {
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, color: e.target.value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { color: e.target.value });
                        }
                      }}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-600">
                      {elements[selectedElement]?.color || newTextElements.find(el => el.id === selectedElement)?.color || '#000000'}
                    </span>
                  </div>
                </div>

                {/* Background Color */}
                <div className="bg-white p-4 rounded-lg border border-saas-border">
                  <label className="block text-sm font-bold text-saas-text-main mb-2">
                    🎭 {lang === 'fr' ? 'Couleur de fond' : 'لون الخلفية'}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={elements[selectedElement]?.backgroundColor || newTextElements.find(el => el.id === selectedElement)?.backgroundColor || '#ffffff'}
                      onChange={(e) => {
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, backgroundColor: e.target.value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { backgroundColor: e.target.value });
                        }
                      }}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm font-mono text-gray-600">
                      {elements[selectedElement]?.backgroundColor || newTextElements.find(el => el.id === selectedElement)?.backgroundColor || '#ffffff'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!selectedElement && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-saas-text-muted text-center text-sm">
                    {lang === 'fr' ? 'Cliquez sur un élément pour le modifier' : 'انقر على عنصر لتعديله'}
                  </p>
                </div>
                <button
                  onClick={addNewText}
                  className="w-full px-4 py-3 bg-gradient-to-r from-saas-primary-start to-saas-primary-end hover:from-saas-primary-end hover:to-saas-secondary-start text-white font-bold rounded-lg transition-all"
                >
                  ➕ {lang === 'fr' ? 'Ajouter du texte' : 'إضافة نص'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-saas-border flex justify-between">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
            >
              {lang === 'fr' ? 'Annuler' : 'إلغاء'}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveTemplate}
              className="px-6 py-2 bg-saas-primary-start hover:bg-saas-primary-end text-white font-bold rounded-lg transition-colors"
            >
              💾 {lang === 'fr' ? 'Sauvegarder' : 'حفظ'}
            </button>
            <button
              onClick={() => {
                const printContent = getPersonalizedContent();
                const printWindow = window.open('', '', 'height=600,width=800');
                if (printWindow) {
                  printWindow.document.write(printContent);
                  printWindow.document.close();
                  setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                  }, 250);
                }
              }}
              className="px-6 py-2 bg-saas-success hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              🖨️ {lang === 'fr' ? 'Imprimer' : 'طباعة'}
            </button>
          </div>
        </div>

        {/* Template Info Section */}
        {(() => {
          const loadedTemplate = savedTemplates.find(template => template.type === type);
          return loadedTemplate ? (
            <div className="border-t border-saas-border bg-gray-50 p-6">
              <h4 className="font-bold text-saas-text-main mb-4">
                📄 {lang === 'fr' ? 'Modèle chargé' : 'القالب المحمل'}
              </h4>
              <div className="bg-white border border-saas-border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-saas-text-main">{loadedTemplate.name}</h5>
                    <p className="text-sm text-saas-text-muted">
                      {lang === 'fr' ? 'Type:' : 'النوع:'} {type} • {lang === 'fr' ? 'Créé le:' : 'تم الإنشاء:'} {new Date(loadedTemplate.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTemplate(loadedTemplate.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors font-bold"
                  >
                    🗑️ {lang === 'fr' ? 'Supprimer' : 'حذف'}
                  </button>
                </div>
              </div>
            </div>
          ) : null;
        })()}
      </motion.div>
    </motion.div>
  );

  return (
    <>
      {/* Personalization Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-saas-border">
            <h3 className="text-xl font-bold text-saas-text-main">
              🎨 {lang === 'fr' ? 'Personnalisation du Document' : 'تخصيص المستند'}
            </h3>
          </div>

          <div className="flex h-[70vh]">
            {/* Preview Area */}
            <div className="flex-1 bg-gray-50 p-6 border-r border-saas-border relative overflow-hidden">
              <div
                className="bg-white border border-gray-300 rounded-lg shadow-inner w-full h-full relative"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Logo */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'logo' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ left: elements.logo.x, top: elements.logo.y }}
                  onMouseDown={(e) => handleMouseDown('logo', e)}
                >
                  <img
                    src="https://via.placeholder.com/100x100/007bff/ffffff?text=LUXDRIVE"
                    alt="Logo"
                    className="w-24 h-24 object-contain border border-gray-300 rounded"
                  />
                </div>

                {/* Title */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'title' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.title.x,
                    top: elements.title.y,
                    fontSize: elements.title.fontSize,
                    fontFamily: elements.title.fontFamily,
                    color: elements.title.color,
                    fontWeight: elements.title.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('title', e)}
                >
                  {elements.title.text}
                </div>

                {/* Agence Name */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'agenceName' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.agenceName.x,
                    top: elements.agenceName.y,
                    fontSize: elements.agenceName.fontSize,
                    fontFamily: elements.agenceName.fontFamily,
                    color: elements.agenceName.color,
                    fontWeight: elements.agenceName.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('agenceName', e)}
                >
                  {elements.agenceName.text}
                </div>

                {/* Client Info */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'introText' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.introText.x,
                    top: elements.introText.y,
                    fontSize: elements.introText.fontSize,
                    fontFamily: elements.introText.fontFamily,
                    color: elements.introText.color,
                    fontWeight: elements.introText.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('introText', e)}
                >
                  {elements.introText.text}
                </div>

                <div
                  className={`absolute cursor-move ${selectedElement === 'clientName' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.clientName.x,
                    top: elements.clientName.y,
                    fontSize: elements.clientName.fontSize,
                    fontFamily: elements.clientName.fontFamily,
                    color: elements.clientName.color,
                    fontWeight: elements.clientName.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('clientName', e)}
                >
                  {elements.clientName.text}
                </div>

                {/* Passport Info */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'passportText' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.passportText.x,
                    top: elements.passportText.y,
                    fontSize: elements.passportText.fontSize,
                    fontFamily: elements.passportText.fontFamily,
                    color: elements.passportText.color,
                    fontWeight: elements.passportText.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('passportText', e)}
                >
                  {elements.passportText.text}
                </div>

                <div
                  className={`absolute cursor-move ${selectedElement === 'passportNumber' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.passportNumber.x,
                    top: elements.passportNumber.y,
                    fontSize: elements.passportNumber.fontSize,
                    fontFamily: elements.passportNumber.fontFamily,
                    color: elements.passportNumber.color,
                    fontWeight: elements.passportNumber.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('passportNumber', e)}
                >
                  {elements.passportNumber.text}
                </div>

                {/* Contract Info */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'agenceText' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.agenceText.x,
                    top: elements.agenceText.y,
                    fontSize: elements.agenceText.fontSize,
                    fontFamily: elements.agenceText.fontFamily,
                    color: elements.agenceText.color,
                    fontWeight: elements.agenceText.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('agenceText', e)}
                >
                  {elements.agenceText.text}
                </div>

                <div
                  className={`absolute cursor-move ${selectedElement === 'currentDate' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.currentDate.x,
                    top: elements.currentDate.y,
                    fontSize: elements.currentDate.fontSize,
                    fontFamily: elements.currentDate.fontFamily,
                    color: elements.currentDate.color,
                    fontWeight: elements.currentDate.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('currentDate', e)}
                >
                  {elements.currentDate.text}
                </div>

                <div
                  className={`absolute cursor-move ${selectedElement === 'contractText' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.contractText.x,
                    top: elements.contractText.y,
                    fontSize: elements.contractText.fontSize,
                    fontFamily: elements.contractText.fontFamily,
                    color: elements.contractText.color,
                    fontWeight: elements.contractText.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('contractText', e)}
                >
                  {elements.contractText.text}
                </div>

                {/* Car Info */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'cautionText' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.cautionText.x,
                    top: elements.cautionText.y,
                    fontSize: elements.cautionText.fontSize,
                    fontFamily: elements.cautionText.fontFamily,
                    color: elements.cautionText.color,
                    fontWeight: elements.cautionText.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('cautionText', e)}
                >
                  {elements.cautionText.text}
                </div>

                <div
                  className={`absolute cursor-move ${selectedElement === 'carInfo' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.carInfo.x,
                    top: elements.carInfo.y,
                    fontSize: elements.carInfo.fontSize,
                    fontFamily: elements.carInfo.fontFamily,
                    color: elements.carInfo.color,
                    fontWeight: elements.carInfo.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('carInfo', e)}
                >
                  {elements.carInfo.text}
                </div>

                <div
                  className={`absolute cursor-move ${selectedElement === 'datesText' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.datesText.x,
                    top: elements.datesText.y,
                    fontSize: elements.datesText.fontSize,
                    fontFamily: elements.datesText.fontFamily,
                    color: elements.datesText.color,
                    fontWeight: elements.datesText.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('datesText', e)}
                >
                  {elements.datesText.text}
                </div>

                {/* Signatures */}
                <div
                  className={`absolute cursor-move ${selectedElement === 'signatureText1' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.signatureText1.x,
                    top: elements.signatureText1.y,
                    fontSize: elements.signatureText1.fontSize,
                    fontFamily: elements.signatureText1.fontFamily,
                    color: elements.signatureText1.color,
                    fontWeight: elements.signatureText1.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('signatureText1', e)}
                >
                  {elements.signatureText1.text}
                </div>

                <div
                  className={`absolute cursor-move ${selectedElement === 'signatureText2' ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: elements.signatureText2.x,
                    top: elements.signatureText2.y,
                    fontSize: elements.signatureText2.fontSize,
                    fontFamily: elements.signatureText2.fontFamily,
                    color: elements.signatureText2.color,
                    fontWeight: elements.signatureText2.fontWeight
                  }}
                  onMouseDown={(e) => handleMouseDown('signatureText2', e)}
                >
                  {elements.signatureText2.text}
                </div>

                {/* New Text Elements */}
                {newTextElements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: element.x,
                      top: element.y,
                      fontSize: element.fontSize,
                      fontFamily: element.fontFamily,
                      color: element.color,
                      fontWeight: element.fontWeight
                    }}
                    onMouseDown={(e) => handleMouseDown(element.id, e)}
                  >
                    {element.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Properties Panel */}
            <div className="w-80 bg-gray-100 p-6 border-l border-saas-border">
              <h4 className="text-lg font-bold text-saas-text-main mb-4">
                {lang === 'fr' ? 'Propriétés' : 'الخصائص'}
              </h4>

              {selectedElement && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-saas-text-main mb-2">
                      {lang === 'fr' ? 'Texte' : 'النص'}
                    </label>
                    <textarea
                      value={elements[selectedElement]?.text || newTextElements.find(el => el.id === selectedElement)?.text || ''}
                      onChange={(e) => {
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, text: e.target.value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { text: e.target.value });
                        }
                      }}
                      className="w-full p-2 border border-saas-border rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-saas-text-main mb-2">
                      {lang === 'fr' ? 'Taille' : 'الحجم'}
                    </label>
                    <input
                      type="number"
                      value={elements[selectedElement]?.fontSize || newTextElements.find(el => el.id === selectedElement)?.fontSize || 16}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, fontSize: value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { fontSize: value });
                        }
                      }}
                      className="w-full p-2 border border-saas-border rounded-lg"
                      min="8"
                      max="72"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-saas-text-main mb-2">
                      {lang === 'fr' ? 'Police' : 'الخط'}
                    </label>
                    <select
                      value={elements[selectedElement]?.fontFamily || newTextElements.find(el => el.id === selectedElement)?.fontFamily || 'Arial'}
                      onChange={(e) => {
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, fontFamily: e.target.value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { fontFamily: e.target.value });
                        }
                      }}
                      className="w-full p-2 border border-saas-border rounded-lg"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-saas-text-main mb-2">
                      {lang === 'fr' ? 'Style' : 'النمط'}
                    </label>
                    <select
                      value={elements[selectedElement]?.fontWeight || newTextElements.find(el => el.id === selectedElement)?.fontWeight || 'normal'}
                      onChange={(e) => {
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, fontWeight: e.target.value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { fontWeight: e.target.value });
                        }
                      }}
                      className="w-full p-2 border border-saas-border rounded-lg"
                    >
                      <option value="normal">{lang === 'fr' ? 'Normal' : 'عادي'}</option>
                      <option value="bold">{lang === 'fr' ? 'Gras' : 'عريض'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-saas-text-main mb-2">
                      {lang === 'fr' ? 'Couleur' : 'اللون'}
                    </label>
                    <input
                      type="color"
                      value={elements[selectedElement]?.color || newTextElements.find(el => el.id === selectedElement)?.color || '#000000'}
                      onChange={(e) => {
                        if (selectedElement.startsWith('newText_')) {
                          setNewTextElements(prev => prev.map(el =>
                            el.id === selectedElement ? { ...el, color: e.target.value } : el
                          ));
                        } else {
                          updateElement(selectedElement, { color: e.target.value });
                        }
                      }}
                      className="w-full p-2 border border-saas-border rounded-lg h-10"
                    />
                  </div>
                </div>
              )}

              {!selectedElement && (
                <div className="space-y-4">
                  <p className="text-saas-text-muted text-center">
                    {lang === 'fr' ? 'Cliquez sur un élément pour le modifier' : 'انقر على عنصر لتعديله'}
                  </p>
                  <button
                    onClick={addNewText}
                    className="w-full px-4 py-2 bg-saas-primary-start hover:bg-saas-primary-end text-white font-bold rounded-lg transition-colors"
                  >
                    ➕ {lang === 'fr' ? 'Ajouter du texte' : 'إضافة نص'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-saas-border flex justify-between">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
              >
                {lang === 'fr' ? 'Annuler' : 'إلغاء'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveTemplate}
                className="px-6 py-2 bg-saas-primary-start hover:bg-saas-primary-end text-white font-bold rounded-lg transition-colors"
              >
                💾 {lang === 'fr' ? 'Sauvegarder' : 'حفظ'}
              </button>
              <button
                onClick={() => {
                  const printContent = getPersonalizedContent();
                  const printWindow = window.open('', '', 'height=600,width=800');
                  if (printWindow) {
                    printWindow.document.write(printContent);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                }}
                className="px-6 py-2 bg-saas-success hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
              >
                🖨️ {lang === 'fr' ? 'Imprimer' : 'طباعة'}
              </button>
            </div>
          </div>

          {/* Saved Templates Section */}
          {savedTemplates.length > 0 && (
            <div className="border-t border-saas-border bg-gray-50 p-6">
              <h4 className="font-bold text-saas-text-main mb-4">
                📁 {lang === 'fr' ? 'Modèles sauvegardés' : 'القوالب المحفوظة'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
                {savedTemplates.map((template) => (
                  <div key={template.id} className="bg-white border border-saas-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-bold text-saas-text-main text-sm">{template.name}</h5>
                        <p className="text-xs text-saas-text-muted">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          loadTemplate(template);
                          setSelectedElement(null);
                        }}
                        className="flex-1 px-3 py-1 bg-saas-primary-start hover:bg-saas-primary-end text-white text-xs rounded transition-colors font-bold"
                      >
                        ✏️ {lang === 'fr' ? 'Modifier' : 'تعديل'}
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors font-bold"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </>
  );
};
