import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Download, FileText, TrendingUp, Users, Car as CarIcon, DollarSign, AlertTriangle, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react';
import { Language, Car, Client, ReservationDetails, Worker, StoreExpense, VehicleExpense, MaintenanceAlert, WebsiteOrder } from '../types';
import { DatabaseService } from '../services/DatabaseService';

interface ReportsPageProps {
  lang: Language;
}

interface ReportData {
  clients: Client[];
  reservations: ReservationDetails[];
  cars: Car[];
  workers: Worker[];
  storeExpenses: StoreExpense[];
  vehicleExpenses: VehicleExpense[];
  alerts: MaintenanceAlert[];
  websiteOrders: WebsiteOrder[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ lang }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert(lang === 'fr' ? 'Veuillez sélectionner les dates de début et de fin' : 'يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setIsGenerating(true);
    setLoading(true);
    setError(null);

    try {
      // Fetch all data from Supabase
      const [clients, reservations, cars, workers, storeExpenses, vehicleExpenses, alerts, websiteOrders] = await Promise.all([
        DatabaseService.getClients(),
        DatabaseService.getReservations(),
        DatabaseService.getCars(),
        DatabaseService.getWorkers(),
        DatabaseService.getStoreExpenses(),
        DatabaseService.getVehicleExpenses(),
        DatabaseService.getMaintenanceAlerts(),
        DatabaseService.getWebsiteOrders()
      ]);

      // Filter data by date range if needed
      const start = new Date(startDate);
      const end = new Date(endDate);

      const filteredData: ReportData = {
        clients: clients.filter(client => {
          const clientDate = new Date(client.createdAt);
          return clientDate >= start && clientDate <= end;
        }),
        reservations: reservations.filter(reservation => {
          const reservationDate = new Date(reservation.createdAt);
          return reservationDate >= start && reservationDate <= end;
        }),
        cars,
        workers: workers.filter(worker => {
          const workerDate = new Date(worker.createdAt);
          return workerDate >= start && workerDate <= end;
        }),
        storeExpenses: storeExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= start && expenseDate <= end;
        }),
        vehicleExpenses: vehicleExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= start && expenseDate <= end;
        }),
        alerts: alerts.filter(alert => {
          const alertDate = new Date(alert.createdAt);
          return alertDate >= start && alertDate <= end;
        }),
        websiteOrders: websiteOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= start && orderDate <= end;
        })
      };

      setReportData(filteredData);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!reportData) return null;

    const totalRevenue = reportData.reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const totalExpenses = [
      ...reportData.storeExpenses,
      ...reportData.vehicleExpenses
    ].reduce((sum, e) => sum + e.cost, 0);

    const netProfit = totalRevenue - totalExpenses;

    const activeReservations = reportData.reservations.filter(r => r.status === 'active').length;
    const completedReservations = reportData.reservations.filter(r => r.status === 'completed').length;

    const websiteOrdersCount = reportData.websiteOrders.length;
    const pendingWebsiteOrders = reportData.websiteOrders.filter(o => o.status === 'pending').length;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      activeReservations,
      completedReservations,
      websiteOrdersCount,
      pendingWebsiteOrders
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end p-8 rounded-3xl text-white shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-5xl"
          >
            📊
          </motion.div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">
              {lang === 'fr' ? 'Rapports & Audit' : 'التقارير والتدقيق'}
            </h1>
            <p className="text-blue-100 text-lg font-medium">
              {lang === 'fr' ? 'Analyse complète de l\'activité' : 'تحليل شامل للنشاط'}
            </p>
          </div>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-blue-100">
              {lang === 'fr' ? 'Date de début' : 'تاريخ البداية'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-blue-100">
              {lang === 'fr' ? 'Date de fin' : 'تاريخ النهاية'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/50 transition-all"
            />
          </div>

          <div className="flex items-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full bg-white text-saas-primary-via font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-saas-primary-via border-t-transparent rounded-full"
                  />
                  {lang === 'fr' ? 'Génération...' : 'جاري التوليد...'}
                </>
              ) : (
                <>
                  <span className="text-xl">🚀</span>
                  {lang === 'fr' ? 'Générer l\'Audit Complet' : 'توليد التدقيق الكامل'}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-saas-primary-via border-t-transparent rounded-full"
          />
          <span className="ml-4 text-saas-text-main font-medium">
            {lang === 'fr' ? 'Génération du rapport...' : 'جاري توليد التقرير...'}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-saas-text-main mb-2">
              {lang === 'fr' ? 'Erreur de génération' : 'خطأ في التوليد'}
            </h3>
            <p className="text-saas-text-muted">{error}</p>
          </div>
        </div>
      )}

      {/* Report Content */}
      {reportData && stats && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    {lang === 'fr' ? 'Revenus Totaux' : 'إجمالي الإيرادات'}
                  </p>
                  <p className="text-2xl font-black">
                    {stats.totalRevenue.toLocaleString()} DA
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">
                    {lang === 'fr' ? 'Dépenses Totales' : 'إجمالي المصاريف'}
                  </p>
                  <p className="text-2xl font-black">
                    {stats.totalExpenses.toLocaleString()} DA
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-200" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    {lang === 'fr' ? 'Bénéfice Net' : 'صافي الربح'}
                  </p>
                  <p className="text-2xl font-black">
                    {stats.netProfit.toLocaleString()} DA
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-200" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    {lang === 'fr' ? 'Réservations' : 'الحجوزات'}
                  </p>
                  <p className="text-2xl font-black">
                    {stats.completedReservations}
                  </p>
                  <p className="text-purple-200 text-xs">
                    {stats.activeReservations} {lang === 'fr' ? 'actives' : 'نشطة'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </motion.div>
          </div>

          {/* Detailed Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Clients Report */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Rapport Clients' : 'تقرير العملاء'}
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {reportData.clients.map((client, index) => (
                  <div key={client.id} className="text-xs bg-saas-bg p-3 rounded-lg">
                    <div className="font-semibold text-saas-text-main">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-saas-text-muted">
                      📞 {client.phone} • 📧 {client.email}
                    </div>
                    <div className="text-saas-text-muted">
                      🆔 {client.idCardNumber} • 🚗 {client.licenseNumber}
                    </div>
                    <div className="text-saas-text-muted">
                      📍 {client.wilaya} • 📅 {new Date(client.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Cars Report */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <CarIcon className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Rapport Véhicules' : 'تقرير المركبات'}
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {reportData.cars.map((car) => (
                  <div key={car.id} className="text-xs bg-saas-bg p-3 rounded-lg">
                    <div className="font-semibold text-saas-text-main">
                      {car.brand} {car.model} ({car.year})
                    </div>
                    <div className="text-saas-text-muted">
                      🚗 {car.registration} • 🎨 {car.color}
                    </div>
                    <div className="text-saas-text-muted">
                      ⛽ {car.energy} • ⚙️ {car.transmission}
                    </div>
                    <div className="text-saas-text-muted">
                      💺 {car.seats} places • 🚪 {car.doors} portes
                    </div>
                    <div className="text-saas-text-muted">
                      💰 {car.priceDay.toLocaleString()} DA/jour • 📏 {car.mileage.toLocaleString()} km
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Reservations Report */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Rapport Réservations' : 'تقرير الحجوزات'}
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {reportData.reservations.map((reservation) => (
                  <div key={reservation.id} className="text-xs bg-saas-bg p-3 rounded-lg">
                    <div className="font-semibold text-saas-text-main">
                      Réservation #{reservation.id}
                    </div>
                    <div className="text-saas-text-muted">
                      📅 {reservation.startDate} → {reservation.endDate}
                    </div>
                    <div className="text-saas-text-muted">
                      💰 {reservation.totalCost.toLocaleString()} DA
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                      reservation.status === 'completed' ? 'bg-green-100 text-green-800' :
                      reservation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {reservation.status}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Workers Report */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Rapport Employés' : 'تقرير الموظفين'}
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {reportData.workers.map((worker) => (
                  <div key={worker.id} className="text-xs bg-saas-bg p-3 rounded-lg">
                    <div className="font-semibold text-saas-text-main">
                      {worker.fullName}
                    </div>
                    <div className="text-saas-text-muted">
                      👤 {worker.type} • 📞 {worker.phone}
                    </div>
                    <div className="text-saas-text-muted">
                      💰 {worker.baseSalary.toLocaleString()} DA
                    </div>
                    <div className="text-saas-text-muted">
                      📧 {worker.email}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Expenses Report */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Rapport Dépenses' : 'تقرير المصاريف'}
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <div className="text-sm font-semibold text-saas-text-main mb-3">
                  {lang === 'fr' ? 'Dépenses Magasin' : 'مصاريف المتجر'}
                </div>
                {reportData.storeExpenses.map((expense) => (
                  <div key={expense.id} className="text-xs bg-red-50 p-2 rounded">
                    <div className="font-medium text-red-800">
                      {expense.icon} {expense.name}
                    </div>
                    <div className="text-red-600">
                      💰 {expense.cost.toLocaleString()} DA • 📅 {expense.date}
                    </div>
                  </div>
                ))}
                <div className="text-sm font-semibold text-saas-text-main mt-4 mb-3">
                  {lang === 'fr' ? 'Dépenses Véhicules' : 'مصاريف المركبات'}
                </div>
                {reportData.vehicleExpenses.map((expense) => (
                  <div key={expense.id} className="text-xs bg-orange-50 p-2 rounded">
                    <div className="font-medium text-orange-800">
                      🛢️ {expense.type}
                    </div>
                    <div className="text-orange-600">
                      💰 {expense.cost.toLocaleString()} DA • 📅 {expense.date}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Alerts & Website Orders Report */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Alertes & Commandes Web' : 'التنبيهات والطلبات عبر الإنترنت'}
                </h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <div className="text-sm font-semibold text-saas-text-main mb-3">
                  {lang === 'fr' ? 'Alertes Véhicules' : 'تنبيهات المركبات'}
                </div>
                {reportData.alerts.map((alert) => (
                  <div key={alert.id} className="text-xs bg-yellow-50 p-2 rounded">
                    <div className="font-medium text-yellow-800">
                      ⚠️ {alert.title}
                    </div>
                    <div className="text-yellow-600">
                      🚗 {alert.carInfo.split(' - ')[0]}
                    </div>
                    <div className="text-yellow-600">
                      📅 {alert.dueDate} ({alert.daysUntilDue} {lang === 'fr' ? 'jours' : 'أيام'})
                    </div>
                  </div>
                ))}
                <div className="text-sm font-semibold text-saas-text-main mt-4 mb-3">
                  {lang === 'fr' ? 'Commandes Website' : 'طلبات الموقع'}
                </div>
                {reportData.websiteOrders.map((order) => (
                  <div key={order.id} className="text-xs bg-blue-50 p-2 rounded">
                    <div className="font-medium text-blue-800">
                      🛒 Commande #{order.id}
                    </div>
                    <div className="text-blue-600">
                      🚗 {order.car.brand} {order.car.model}
                    </div>
                    <div className="text-blue-600">
                      👤 {order.step2.firstName} {order.step2.lastName}
                    </div>
                    <div className="text-blue-600">
                      💰 {order.totalPrice.toLocaleString()} DA • 📅 {order.createdAt.split('T')[0]}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Export Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-saas-primary-start to-saas-primary-end text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
            >
              <Download className="w-5 h-5" />
              {lang === 'fr' ? 'Exporter le Rapport PDF' : 'تصدير التقرير PDF'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportsPage;