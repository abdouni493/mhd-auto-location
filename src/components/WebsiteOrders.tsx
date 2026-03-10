import React, { useState, useEffect } from 'react';
import { Language, WebsiteOrder, Car, Agency } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, Car as CarIcon, Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, MapPin, Fuel, Camera, FileText, CreditCard, DollarSign, AlertTriangle, Phone, Mail, User } from 'lucide-react';

interface WebsiteOrdersProps {
  lang: Language;
}

export const WebsiteOrders: React.FC<WebsiteOrdersProps> = ({ lang }) => {
  const [orders, setOrders] = useState<WebsiteOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [selectedOrder, setSelectedOrder] = useState<WebsiteOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Mock data for website orders - in real app, this would come from API
  useEffect(() => {
    const mockOrders: WebsiteOrder[] = [
      {
        id: 'web-001',
        carId: '1',
        car: {
          id: '1',
          brand: 'Toyota',
          model: 'Prius',
          registration: 'AB-123-CD',
          year: 2021,
          color: 'Blanc',
          vin: 'VIN123456',
          energy: 'Hybride',
          transmission: 'Automatique',
          seats: 5,
          doors: 4,
          priceDay: 5000,
          priceWeek: 28000,
          priceMonth: 90000,
          deposit: 50000,
          images: ['https://images.unsplash.com/photo-1560958089-b8a63dd8aa8b?w=500&h=400&fit=crop'],
          mileage: 45000,
        },
        step1: {
          carId: '1',
          departureDate: '2026-03-15',
          departureTime: '10:00',
          departureAgency: '1',
          returnDate: '2026-03-18',
          returnTime: '10:00',
          returnAgency: '1',
          differentReturnAgency: false,
        },
        step2: {
          firstName: 'Ahmed',
          lastName: 'Boudjellal',
          phone: '+213 5 1234 5678',
          email: 'ahmed@email.com',
          licenseNumber: 'DZA12345678',
          wilaya: '16 - Alger',
          completeAddress: '123 Rue Principal, Alger',
          scannedDocuments: [
            'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop', // Driver's license
            'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop', // ID card
          ],
        },
        step3: {
          additionalServices: [
            { id: '1', name: lang === 'fr' ? 'Siège Bébé' : 'مقعد طفل', price: 500, category: 'equipment', description: lang === 'fr' ? 'Siège auto pour enfant' : 'مقعد سيارة للطفل', selected: true },
            { id: '2', name: lang === 'fr' ? 'GPS' : 'GPS', price: 300, category: 'equipment', description: lang === 'fr' ? 'Système de navigation' : 'نظام الملاحة', selected: true }
          ],
        },
        totalDays: 3,
        totalPrice: 15000,
        servicesTotal: 800,
        status: 'pending',
        createdAt: '2026-03-10T14:30:00Z',
        source: 'website',
      },
      {
        id: 'web-002',
        carId: '2',
        car: {
          id: '2',
          brand: 'Renault',
          model: 'Clio',
          registration: 'EF-456-GH',
          year: 2020,
          color: 'Rouge',
          vin: 'VIN654321',
          energy: 'Essence',
          transmission: 'Manuelle',
          seats: 5,
          doors: 4,
          priceDay: 4000,
          priceWeek: 22400,
          priceMonth: 72000,
          deposit: 40000,
          images: ['https://images.unsplash.com/photo-1549399735-cef2e2c3f638?w=500&h=400&fit=crop'],
          mileage: 32000,
        },
        step1: {
          carId: '2',
          departureDate: '2026-03-20',
          departureTime: '14:00',
          departureAgency: '1',
          returnDate: '2026-03-22',
          returnTime: '14:00',
          returnAgency: '1',
          differentReturnAgency: false,
        },
        step2: {
          firstName: 'Fatima',
          lastName: 'Zahra',
          phone: '+213 5 8765 4321',
          email: 'fatima@email.com',
          licenseNumber: 'DZA87654321',
          wilaya: '16 - Alger',
          completeAddress: '456 Rue Secondaire, Alger',
          scannedDocuments: [
            'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop', // ID card
            'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop', // Driver's license
            'https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=400&h=300&fit=crop', // Passport
          ],
        },
        step3: {
          additionalServices: [],
        },
        totalDays: 2,
        totalPrice: 8000,
        servicesTotal: 0,
        status: 'pending',
        createdAt: '2026-03-11T09:15:00Z',
        source: 'website',
      },
      {
        id: 'web-003',
        carId: '3',
        car: {
          id: '3',
          brand: 'BMW',
          model: 'X3',
          registration: 'IJ-789-KL',
          year: 2022,
          color: 'Noir',
          vin: 'VIN789012',
          energy: 'Diesel',
          transmission: 'Automatique',
          seats: 5,
          doors: 4,
          priceDay: 8000,
          priceWeek: 44800,
          priceMonth: 144000,
          deposit: 80000,
          images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&h=400&fit=crop'],
          mileage: 15000,
        },
        step1: {
          carId: '3',
          departureDate: '2026-03-25',
          departureTime: '09:00',
          departureAgency: '1',
          returnDate: '2026-03-28',
          returnTime: '18:00',
          returnAgency: '1',
          differentReturnAgency: false,
        },
        step2: {
          firstName: 'Karim',
          lastName: 'Mansouri',
          phone: '+213 5 5555 6666',
          email: 'karim@email.com',
          licenseNumber: 'DZA55556666',
          wilaya: '16 - Alger',
          completeAddress: '789 Boulevard Central, Alger',
          scannedDocuments: [
            'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop', // Driver's license
          ],
        },
        step3: {
          additionalServices: [
            { id: '3', name: lang === 'fr' ? 'Assurance Supplémentaire' : 'تأمين إضافي', price: 1000, category: 'insurance', description: lang === 'fr' ? 'Couverture étendue' : 'تغطية موسعة', selected: true },
            { id: '4', name: lang === 'fr' ? 'Conducteur Additionnel' : 'سائق إضافي', price: 800, category: 'service', description: lang === 'fr' ? 'Deuxième conducteur' : 'سائق ثاني', selected: true }
          ],
        },
        totalDays: 3,
        totalPrice: 24000,
        servicesTotal: 1800,
        status: 'confirmed',
        createdAt: '2026-03-09T16:45:00Z',
        source: 'website',
      },
    ];

    setOrders(mockOrders);
  }, [lang]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.step2.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.step2.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.car.registration.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (order: WebsiteOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleConfirmOrder = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'confirmed' as const } : order
    ));
    // In a real app, this would also add the order to the reservation system
    console.log(`Order ${orderId} confirmed and added to reservations`);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'cancelled' as const } : order
    ));
  };

  const handleDeleteOrder = (orderId: string) => {
    setShowDeleteConfirm(orderId);
  };

  const confirmDeleteOrder = () => {
    if (showDeleteConfirm) {
      setOrders(prev => prev.filter(order => order.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            🛒 {lang === 'fr' ? 'Commandes Website' : 'طلبات الموقع'}
          </h1>
          <p className="text-slate-600 mt-1">
            {lang === 'fr' ? 'Gérer les commandes reçues depuis le site web' : 'إدارة الطلبات المستلمة من الموقع'}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
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
            <option value="confirmed">{lang === 'fr' ? 'Confirmé' : 'مؤكد'}</option>
            <option value="processing">{lang === 'fr' ? 'En traitement' : 'قيد المعالجة'}</option>
            <option value="completed">{lang === 'fr' ? 'Terminé' : 'مكتمل'}</option>
            <option value="cancelled">{lang === 'fr' ? 'Annulé' : 'ملغي'}</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600 font-bold">{lang === 'fr' ? 'En attente' : 'في الانتظار'}</p>
              <p className="text-2xl font-black text-yellow-900">{orders.filter(o => o.status === 'pending').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-bold">{lang === 'fr' ? 'Confirmé' : 'مؤكد'}</p>
              <p className="text-2xl font-black text-green-900">{orders.filter(o => o.status === 'confirmed').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-bold">{lang === 'fr' ? 'Total' : 'الإجمالي'}</p>
              <p className="text-2xl font-black text-blue-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-bold">{lang === 'fr' ? 'Revenus' : 'الإيرادات'}</p>
              <p className="text-2xl font-black text-purple-900">
                {orders.filter(o => o.status === 'confirmed').reduce((sum, o) => sum + o.totalPrice + o.servicesTotal, 0).toLocaleString()} DA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col relative"
          >
            {/* Car Image */}
            <div className="relative h-48 overflow-hidden rounded-t-2xl">
              <img
                src={order.car.images[0]}
                alt={`${order.car.brand} ${order.car.model}`}
                className="w-full h-full object-cover"
              />
              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  order.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.status === 'confirmed' ? '✅ Confirmé' :
                   order.status === 'pending' ? '⏳ En attente' :
                   order.status === 'processing' ? '🔄 Traitement' :
                   order.status === 'completed' ? '🏁 Terminé' :
                   '❌ Annulé'}
                </span>
              </div>
              {/* Website Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  🌐 Website
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Client & Car Info */}
              <div className="space-y-3 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {order.step2.firstName} {order.step2.lastName}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.step2.phone}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {order.step2.email}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">
                    🚗 {order.car.brand} {order.car.model}
                  </h4>
                  <p className="text-sm text-slate-600">
                    🏷️ {order.car.registration}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{order.step1.departureDate} → {order.step1.returnDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{order.totalDays} {lang === 'fr' ? 'jours' : 'أيام'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{(order.totalPrice + order.servicesTotal).toLocaleString()} {lang === 'fr' ? 'DA' : 'د.ج'}</span>
                </div>

                {/* Services */}
                {order.step3.additionalServices.length > 0 && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-bold mb-2">{lang === 'fr' ? 'Services supplémentaires:' : 'الخدمات الإضافية:'}</p>
                    <div className="space-y-1">
                      {order.step3.additionalServices.map((service) => (
                        <div key={service.id} className="flex justify-between items-center text-xs">
                          <span>{service.name}</span>
                          <span className="font-bold text-blue-700">{service.price.toLocaleString()} DA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleViewDetails(order)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  👁️ {lang === 'fr' ? 'Détails' : 'التفاصيل'}
                </button>
                <button
                  onClick={() => handleConfirmOrder(order.id)}
                  disabled={order.status !== 'pending'}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-2 px-3 rounded-lg transition-colors ${
                    order.status === 'pending'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  ✅ {lang === 'fr' ? 'Accepter' : 'قبول'}
                </button>
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={order.status === 'cancelled'}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-2 px-3 rounded-lg transition-colors ${
                    order.status !== 'cancelled'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  ❌ {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                </button>
                <button
                  onClick={() => handleDeleteOrder(order.id)}
                  className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowOrderDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900">
                    📋 {lang === 'fr' ? 'Détails de la Commande' : 'تفاصيل الطلب'}
                  </h2>
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Info */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200">
                      <h3 className="text-lg font-black text-slate-900 mb-4">
                        📋 {lang === 'fr' ? 'Informations Commande' : 'معلومات الطلب'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'N° Commande:' : 'رقم الطلب:'}</span>
                          <span className="font-mono">{selectedOrder.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Date création:' : 'تاريخ الإنشاء:'}</span>
                          <span>{new Date(selectedOrder.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Statut:' : 'الحالة:'}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedOrder.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedOrder.status === 'pending' ? (lang === 'fr' ? 'En attente' : 'في الانتظار') :
                             selectedOrder.status === 'confirmed' ? (lang === 'fr' ? 'Confirmé' : 'مؤكد') :
                             selectedOrder.status === 'cancelled' ? (lang === 'fr' ? 'Annulé' : 'ملغي') :
                             selectedOrder.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Source:' : 'المصدر:'}</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                            🌐 {lang === 'fr' ? 'Site Web' : 'الموقع الإلكتروني'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <h3 className="text-lg font-black text-blue-900 mb-4">
                        👤 {lang === 'fr' ? 'Informations Client' : 'معلومات العميل'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Nom:' : 'الاسم:'}</span>
                          <span>{selectedOrder.step2.firstName} {selectedOrder.step2.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Téléphone:' : 'الهاتف:'}</span>
                          <span>{selectedOrder.step2.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Email:' : 'البريد:'}</span>
                          <span className="text-sm">{selectedOrder.step2.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Wilaya:' : 'الولاية:'}</span>
                          <span>{selectedOrder.step2.wilaya}</span>
                        </div>
                        {selectedOrder.step2.completeAddress && (
                          <div className="flex justify-between">
                            <span className="font-bold">{lang === 'fr' ? 'Adresse:' : 'العنوان:'}</span>
                            <span className="text-sm text-right">{selectedOrder.step2.completeAddress}</span>
                          </div>
                        )}
                        {selectedOrder.step2.licenseNumber && (
                          <div className="flex justify-between">
                            <span className="font-bold">{lang === 'fr' ? 'N° Permis:' : 'رقم الرخصة:'}</span>
                            <span>{selectedOrder.step2.licenseNumber}</span>
                          </div>
                        )}
                        {selectedOrder.step2.dateOfBirth && (
                          <div className="flex justify-between">
                            <span className="font-bold">{lang === 'fr' ? 'Date Naissance:' : 'تاريخ الميلاد:'}</span>
                            <span>{selectedOrder.step2.dateOfBirth}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documents Section */}
                    {selectedOrder.step2.scannedDocuments && selectedOrder.step2.scannedDocuments.length > 0 && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                        <h3 className="text-lg font-black text-amber-900 mb-4">
                          📄 {lang === 'fr' ? 'Documents Scannés' : 'الوثائق الممسوحة'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedOrder.step2.scannedDocuments.map((docUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={docUrl}
                                alt={`${lang === 'fr' ? 'Document' : 'وثيقة'} ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-amber-300 cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => window.open(docUrl, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Eye className="w-6 h-6 text-white" />
                                </div>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-amber-600 text-white text-xs px-2 py-1 rounded">
                                {lang === 'fr' ? `Doc ${index + 1}` : `وثيقة ${index + 1}`}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-amber-700 mt-3">
                          {lang === 'fr' 
                            ? `📎 ${selectedOrder.step2.scannedDocuments.length} document(s) téléchargé(s) par le client` 
                            : `📎 ${selectedOrder.step2.scannedDocuments.length} وثيقة تم رفعها من قبل العميل`}
                        </p>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <h3 className="text-lg font-black text-green-900 mb-4">
                        🚗 {lang === 'fr' ? 'Informations Véhicule' : 'معلومات المركبة'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Modèle:' : 'الموديل:'}</span>
                          <span>{selectedOrder.car.brand} {selectedOrder.car.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Immatriculation:' : 'رقم اللوحة:'}</span>
                          <span>{selectedOrder.car.registration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Couleur:' : 'اللون:'}</span>
                          <span>{selectedOrder.car.color}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Année:' : 'السنة:'}</span>
                          <span>{selectedOrder.car.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Énergie:' : 'الطاقة:'}</span>
                          <span>{selectedOrder.car.energy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Transmission:' : 'النقل:'}</span>
                          <span>{selectedOrder.car.transmission}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Prix/jour:' : 'السعر/يوم:'}</span>
                          <span>{selectedOrder.car.priceDay.toLocaleString()} DA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Caution:' : 'الكفالة:'}</span>
                          <span>{selectedOrder.car.deposit?.toLocaleString()} DA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Pricing */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                      <h3 className="text-lg font-black text-purple-900 mb-4">
                        📅 {lang === 'fr' ? 'Dates de Location' : 'تواريخ التأجير'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Départ:' : 'المغادرة:'}</span>
                          <span>{selectedOrder.step1.departureDate} à {selectedOrder.step1.departureTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Retour:' : 'العودة:'}</span>
                          <span>{selectedOrder.step1.returnDate} à {selectedOrder.step1.returnTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Durée:' : 'المدة:'}</span>
                          <span>{selectedOrder.totalDays} {lang === 'fr' ? 'jours' : 'أيام'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
                      <h3 className="text-lg font-black text-orange-900 mb-4">
                        💰 {lang === 'fr' ? 'Tarification' : 'التسعير'}
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="font-bold">{lang === 'fr' ? 'Prix véhicule:' : 'سعر المركبة:'}</span>
                          <span>{selectedOrder.totalPrice.toLocaleString()} DA</span>
                        </div>
                        {selectedOrder.servicesTotal > 0 && (
                          <div className="flex justify-between">
                            <span className="font-bold">{lang === 'fr' ? 'Services:' : 'الخدمات:'}</span>
                            <span>{selectedOrder.servicesTotal.toLocaleString()} DA</span>
                          </div>
                        )}
                        <div className="border-t border-orange-300 pt-2 flex justify-between font-black text-lg">
                          <span>{lang === 'fr' ? 'Total:' : 'الإجمالي:'}</span>
                          <span className="text-orange-600">{(selectedOrder.totalPrice + selectedOrder.servicesTotal).toLocaleString()} DA</span>
                        </div>
                      </div>
                    </div>

                    {/* Services */}
                    {selectedOrder.step3.additionalServices.length > 0 && (
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
                        <h3 className="text-lg font-black text-indigo-900 mb-4">
                          🛎️ {lang === 'fr' ? 'Services Supplémentaires' : 'الخدمات الإضافية'}
                        </h3>
                        <div className="space-y-2">
                          {selectedOrder.step3.additionalServices.map((service) => (
                            <div key={service.id} className="flex justify-between items-center">
                              <span className="font-bold">{service.name}</span>
                              <span className="text-indigo-700">{service.price.toLocaleString()} DA</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowOrderDetails(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    {lang === 'fr' ? 'Fermer' : 'إغلاق'}
                  </button>
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleConfirmOrder(selectedOrder.id);
                        setShowOrderDetails(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                    >
                      ✅ {lang === 'fr' ? 'Accepter' : 'قبول'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  {lang === 'fr' ? 'Confirmer la Suppression' : 'تأكيد الحذف'}
                </h3>
                <p className="text-slate-600 mb-6">
                  {lang === 'fr' 
                    ? 'Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.' 
                    : 'هل أنت متأكد من أنك تريد حذف هذا الطلب؟ هذا الإجراء لا رجعة فيه.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                  </button>
                  <button
                    onClick={confirmDeleteOrder}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-4 rounded-xl transition-all"
                  >
                    🗑️ {lang === 'fr' ? 'Supprimer' : 'حذف'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};