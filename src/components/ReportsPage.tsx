import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Download, FileText, TrendingUp, Users, Car as CarIcon, DollarSign, AlertTriangle, BarChart3, PieChart, Activity, Loader2, MapPin, Clock, Zap, ShoppingCart } from 'lucide-react';
import { Language, Car, Client, ReservationDetails, Worker, StoreExpense, VehicleExpense, MaintenanceAlert, WebsiteOrder } from '../types';
import { DatabaseService } from '../services/DatabaseService';
import { getVehicleExpenses } from '../services/expenseService';

// Helper to aggregate actions for audit log
function aggregateAuditLog(reportData: ReportData | null): Array<{ date: string, type: string, description: string }> {
  if (!reportData) return [];
  const actions: Array<{ date: string, type: string, description: string }> = [];

  // Reservations
  reportData.reservations.forEach(r => {
    actions.push({
      date: r.createdAt,
      type: 'Reservation',
      description: `Réservation ${r.status} pour ${r.car?.brand || ''} ${r.car?.model || ''} (${r.car?.registration || ''}) par ${r.client?.firstName || ''} ${r.client?.lastName || ''}`
    });
    if (r.updatedAt && r.updatedAt !== r.createdAt) {
      actions.push({
        date: r.updatedAt,
        type: 'Modification',
        description: `Modification de la réservation (${r.id})`
      });
    }
    if (r.status === 'cancelled') {
      actions.push({
        date: r.updatedAt || r.createdAt,
        type: 'Annulation',
        description: `Annulation de la réservation (${r.id})`
      });
    }
  });

  // Website Orders
  reportData.websiteOrders.forEach(o => {
    actions.push({
      date: o.createdAt,
      type: 'Commande Website',
      description: `Commande pour ${o.car.brand} ${o.car.model} (${o.car.registration}) par ${o.step2.firstName} ${o.step2.lastName} - ${o.status}`
    });
  });

  // Clients
  reportData.clients.forEach(c => {
    actions.push({
      date: c.createdAt,
      type: 'Nouveau Client',
      description: `Création du client ${c.firstName} ${c.lastName}`
    });
  });

  // Expenses
  reportData.storeExpenses.forEach(e => {
    actions.push({
      date: e.date,
      type: 'Dépense Magasin',
      description: `Dépense magasin: ${e.name} (${e.icon}) - ${e.cost} DA`
    });
  });
  reportData.vehicleExpenses.forEach(e => {
    actions.push({
      date: e.date,
      type: 'Dépense Véhicule',
      description: `Dépense véhicule: ${e.type} - ${e.cost} DA`
    });
  });

  // Alerts
  reportData.alerts.forEach(a => {
    actions.push({
      date: a.createdAt,
      type: 'Alerte',
      description: `Alerte ${a.severity}: ${a.title}`
    });
  });

  // Workers
  reportData.workers.forEach(w => {
    actions.push({
      date: w.createdAt,
      type: 'Nouveau Employé',
      description: `Ajout de l'employé ${w.firstName} ${w.lastName}`
    });
  });

  // Sort by date descending
  actions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return actions;
}

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

interface CarStats {
  carId: string;
  carName: string;
  totalReservations: number;
  totalRevenue: number;
  totalKmDriven: number;
  currentMileage: number;
  maintenanceCost: number;
  availability: number;
  lastUseDate: string;
  nextMaintenance: string;
}

interface ClientStats {
  clientId: string;
  clientName: string;
  totalReservations: number;
  totalSpent: number;
  averageRental: number;
  lastRental: string;
  location: string;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ lang }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carStats, setCarStats] = useState<CarStats[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats[]>([]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert(lang === 'fr' ? 'Veuillez sélectionner les dates de début et de fin' : 'يرجى تحديد تاريخ البداية والنهاية');
      return;
    }

    setIsGenerating(true);
    setLoading(true);
    setError(null);

    try {
      // Fetch all data from Supabase with error handling
      let clients: Client[] = [];
      let reservations: ReservationDetails[] = [];
      let cars: Car[] = [];
      let workers: Worker[] = [];
      let storeExpenses: StoreExpense[] = [];
      let vehicleExpenses: VehicleExpense[] = [];
      let alerts: MaintenanceAlert[] = [];
      let websiteOrders: WebsiteOrder[] = [];

      // Try to fetch clients
      try {
        clients = await DatabaseService.getClients();
      } catch (err) {
        console.warn('Failed to fetch clients:', err);
        clients = [];
      }

      // Try to fetch reservations
      try {
        reservations = await DatabaseService.getReservations();
      } catch (err) {
        console.warn('Failed to fetch reservations:', err);
        reservations = [];
      }

      // Try to fetch cars
      try {
        cars = await DatabaseService.getCars();
      } catch (err) {
        console.warn('Failed to fetch cars:', err);
        cars = [];
      }

      // Try to fetch workers
      try {
        workers = await DatabaseService.getWorkers();
      } catch (err) {
        console.warn('Failed to fetch workers:', err);
        workers = [];
      }

      // Try to fetch store expenses
      try {
        storeExpenses = await DatabaseService.getStoreExpenses();
      } catch (err) {
        console.warn('Failed to fetch store expenses:', err);
        storeExpenses = [];
      }

      // Try to fetch vehicle expenses
      try {
        const result = await getVehicleExpenses();
        vehicleExpenses = result.expenses || [];
      } catch (err) {
        console.warn('Failed to fetch vehicle expenses:', err);
        vehicleExpenses = [];
      }

      // Try to fetch maintenance alerts
      try {
        alerts = await DatabaseService.getMaintenanceAlerts();
      } catch (err) {
        console.warn('Failed to fetch maintenance alerts:', err);
        alerts = [];
      }

      // Try to fetch website orders
      try {
        websiteOrders = await DatabaseService.getWebsiteOrders();
      } catch (err) {
        console.warn('Failed to fetch website orders (table may not exist):', err);
        websiteOrders = [];
      }

      // Filter data by date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filteredData: ReportData = {
        clients: clients.filter(client => {
          try {
            const clientDate = new Date(client.createdAt);
            return clientDate >= start && clientDate <= end;
          } catch {
            return true;
          }
        }),
        reservations: reservations.filter(reservation => {
          try {
            const reservationDate = new Date(reservation.createdAt);
            return reservationDate >= start && reservationDate <= end;
          } catch {
            return true;
          }
        }),
        cars,
        workers: workers.filter(worker => {
          try {
            const workerDate = new Date(worker.createdAt);
            return workerDate >= start && workerDate <= end;
          } catch {
            return true;
          }
        }),
        storeExpenses: storeExpenses.filter(expense => {
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate >= start && expenseDate <= end;
          } catch {
            return true;
          }
        }),
        vehicleExpenses: vehicleExpenses.filter(expense => {
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate >= start && expenseDate <= end;
          } catch {
            return true;
          }
        }),
        alerts: alerts.filter(alert => {
          try {
            const alertDate = new Date(alert.createdAt);
            return alertDate >= start && alertDate <= end;
          } catch {
            return true;
          }
        }),
        websiteOrders: websiteOrders.filter(order => {
          try {
            const orderDate = new Date(order.createdAt);
            return orderDate >= start && orderDate <= end;
          } catch {
            return true;
          }
        })
      };

      setReportData(filteredData);

      // Calculate car statistics
      const carStatsData: CarStats[] = cars.map(car => {
        const carReservations = filteredData.reservations.filter(r => r.carId === car.id);
        const carExpenses = filteredData.vehicleExpenses.filter(e => e.carId === car.id);
        const carMaintenance = carExpenses.reduce((sum, e) => sum + e.cost, 0);
        const totalRevenue = carReservations
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + r.totalPrice, 0);
        const lastReservation = carReservations.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        return {
          carId: car.id,
          carName: `${car.brand} ${car.model} (${car.registration})`,
          totalReservations: carReservations.length,
          totalRevenue,
          totalKmDriven: carReservations.reduce((sum, r) => {
            return sum + (r.kmAtReturn && r.kmAtDeparture ? r.kmAtReturn - r.kmAtDeparture : 0);
          }, 0),
          currentMileage: car.mileage,
          maintenanceCost: carMaintenance,
          availability: carReservations.filter(r => r.status === 'active').length === 0 ? 100 : 75,
          lastUseDate: lastReservation ? lastReservation.createdAt.split('T')[0] : 'N/A',
          nextMaintenance: carExpenses.length > 0 ? carExpenses[carExpenses.length - 1].date : 'N/A',
          hasExpenses: carExpenses.length > 0
        };
      });

      setCarStats(carStatsData);

      // Filter alerts: only show alerts for cars with at least one expense
      filteredData.alerts = filteredData.alerts.filter(alert => {
        if (!alert.carId) return false;
        const carStat = carStatsData.find(c => c.carId === alert.carId);
        return carStat && carStat.hasExpenses;
      });

      // Calculate client statistics
      const clientStatsMap = new Map<string, ClientStats>();
      filteredData.reservations.forEach(reservation => {
        const client = filteredData.clients.find(c => c.id === reservation.clientId);
        if (client) {
          const key = client.id;
          if (!clientStatsMap.has(key)) {
            clientStatsMap.set(key, {
              clientId: client.id,
              clientName: `${client.firstName} ${client.lastName}`,
              totalReservations: 0,
              totalSpent: 0,
              averageRental: 0,
              lastRental: '',
              location: client.wilaya || ''
            });
          }

          const stats = clientStatsMap.get(key)!;
          stats.totalReservations++;
          stats.totalSpent += reservation.totalPrice;
          stats.lastRental = reservation.createdAt.split('T')[0];
        }
      });

      // Calculate average rental
      clientStatsMap.forEach(stats => {
        if (stats.totalReservations > 0) {
          stats.averageRental = Math.round(stats.totalSpent / stats.totalReservations);
        }
      });

      setClientStats(Array.from(clientStatsMap.values()));
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

    const completedReservations = reportData.reservations.filter(r => r.status === 'completed');
    const activeReservations = reportData.reservations.filter(r => r.status === 'active');
    const pendingReservations = reportData.reservations.filter(r => r.status === 'pending');

    const totalRevenue = completedReservations.reduce((sum, r) => sum + r.totalPrice, 0);
    const totalExpenses = [
      ...reportData.storeExpenses,
      ...reportData.vehicleExpenses
    ].reduce((sum, e) => sum + e.cost, 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0';

    const totalKmDriven = reportData.reservations.reduce((sum, r) => {
      return sum + (r.kmAtReturn && r.kmAtDeparture ? r.kmAtReturn - r.kmAtDeparture : 0);
    }, 0);

    const averageReservationPrice = completedReservations.length > 0 
      ? Math.round(totalRevenue / completedReservations.length)
      : 0;

    const websiteOrdersCount = reportData.websiteOrders.length;
    const websiteOrdersRevenue = reportData.websiteOrders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const storeExpensesTotal = reportData.storeExpenses.reduce((sum, e) => sum + e.cost, 0);
    const vehicleExpensesTotal = reportData.vehicleExpenses.reduce((sum, e) => sum + e.cost, 0);

    const criticalAlerts = reportData.alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = reportData.alerts.filter(a => a.severity === 'high').length;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      completedReservations: completedReservations.length,
      activeReservations: activeReservations.length,
      pendingReservations: pendingReservations.length,
      totalReservations: reportData.reservations.length,
      totalKmDriven,
      averageReservationPrice,
      websiteOrdersCount,
      websiteOrdersRevenue,
      storeExpensesTotal,
      vehicleExpensesTotal,
      criticalAlerts,
      highAlerts,
      totalClients: reportData.clients.length,
      totalCars: reportData.cars.length
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
          {/* Audit Log Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-saas-primary-via" />
              <h3 className="text-xl font-black text-saas-text-main">
                {lang === 'fr' ? 'Journal d’Audit Complet' : 'سجل التدقيق الكامل'}
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96 custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="bg-saas-bg border-b border-saas-border">
                  <tr>
                    <th className="text-left p-2 font-bold">{lang === 'fr' ? 'Date' : 'التاريخ'}</th>
                    <th className="text-left p-2 font-bold">{lang === 'fr' ? 'Type' : 'النوع'}</th>
                    <th className="text-left p-2 font-bold">{lang === 'fr' ? 'Description' : 'الوصف'}</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregateAuditLog(reportData).map((action, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-saas-bg/50'}>
                      <td className="p-2 text-saas-text-muted">{new Date(action.date).toLocaleString('fr-FR')}</td>
                      <td className="p-2 font-bold text-saas-primary-via">{action.type}</td>
                      <td className="p-2 text-saas-text-main">{action.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          {/* Enhanced Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100 text-xs font-semibold">
                  {lang === 'fr' ? 'Revenus' : 'الإيرادات'}
                </p>
                <DollarSign className="w-5 h-5 text-green-200" />
              </div>
              <p className="text-2xl font-black">
                {(stats.totalRevenue / 1000).toFixed(1)}K DA
              </p>
              <p className="text-green-200 text-xs mt-1">
                {stats.completedReservations} {lang === 'fr' ? 'complétées' : 'مكتملة'}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-red-100 text-xs font-semibold">
                  {lang === 'fr' ? 'Dépenses' : 'المصاريف'}
                </p>
                <TrendingUp className="w-5 h-5 text-red-200" />
              </div>
              <p className="text-2xl font-black">
                {(stats.totalExpenses / 1000).toFixed(1)}K DA
              </p>
              <p className="text-red-200 text-xs mt-1">
                {lang === 'fr' ? 'Magasin' : 'متجر'}: {stats.storeExpensesTotal} DA
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`bg-gradient-to-br p-6 rounded-2xl text-white shadow-lg ${
                stats.netProfit > 0
                  ? 'from-blue-500 to-blue-600'
                  : 'from-orange-500 to-orange-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 text-xs font-semibold">
                  {lang === 'fr' ? 'Profit Net' : 'صافي الربح'}
                </p>
                <BarChart3 className="w-5 h-5 text-blue-200" />
              </div>
              <p className="text-2xl font-black">
                {(stats.netProfit / 1000).toFixed(1)}K DA
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {stats.profitMargin}% {lang === 'fr' ? 'marge' : 'الهامش'}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100 text-xs font-semibold">
                  {lang === 'fr' ? 'Réservations' : 'الحجوزات'}
                </p>
                <Calendar className="w-5 h-5 text-purple-200" />
              </div>
              <p className="text-2xl font-black">
                {stats.totalReservations}
              </p>
              <p className="text-purple-200 text-xs mt-1">
                {stats.activeReservations} {lang === 'fr' ? 'actives' : 'نشطة'}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 rounded-2xl text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-cyan-100 text-xs font-semibold">
                  {lang === 'fr' ? 'Kilométrage' : 'المسافة'}
                </p>
                <Zap className="w-5 h-5 text-cyan-200" />
              </div>
              <p className="text-2xl font-black">
                {(stats.totalKmDriven / 1000).toFixed(0)}K km
              </p>
              <p className="text-cyan-200 text-xs mt-1">
                {lang === 'fr' ? 'Total' : 'الإجمالي'}
              </p>
            </motion.div>
          </div>

          {/* Car Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <CarIcon className="w-6 h-6 text-saas-primary-via" />
              <h3 className="text-xl font-black text-saas-text-main">
                {lang === 'fr' ? 'Rapport Détaillé des Véhicules' : 'تقرير تفصيلي للمركبات'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-saas-bg border-b border-saas-border">
                  <tr>
                    <th className="text-left p-3 font-bold">{lang === 'fr' ? 'Véhicule' : 'المركبة'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Réservations' : 'الحجوزات'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Revenus' : 'الإيرادات'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Entretien' : 'الصيانة'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'KM' : 'كم'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Dernier Usage' : 'آخر استخدام'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Dispo.' : 'التوفر'}</th>
                  </tr>
                </thead>
                <tbody>
                  {carStats.map((car, idx) => (
                    <motion.tr
                      key={car.carId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`border-b border-saas-border hover:bg-saas-bg transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-saas-bg/50'
                      }`}
                    >
                      <td className="p-3 font-semibold text-saas-text-main">{car.carName}</td>
                      <td className="p-3 text-center text-saas-text-muted">{car.totalReservations}</td>
                      <td className="p-3 text-center font-bold text-green-600">{car.totalRevenue.toLocaleString()} DA</td>
                      <td className="p-3 text-center font-bold text-orange-600">{car.maintenanceCost.toLocaleString()} DA</td>
                      <td className="p-3 text-center text-saas-text-muted">{car.totalKmDriven.toLocaleString()} km</td>
                      <td className="p-3 text-center text-saas-text-muted text-xs">{car.lastUseDate}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          car.availability === 100
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {car.availability}%
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Client Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-saas-primary-via" />
              <h3 className="text-xl font-black text-saas-text-main">
                {lang === 'fr' ? 'Rapport Détaillé des Clients' : 'تقرير تفصيلي للعملاء'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-saas-bg border-b border-saas-border">
                  <tr>
                    <th className="text-left p-3 font-bold">{lang === 'fr' ? 'Client' : 'العميل'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Réservations' : 'الحجوزات'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Total Dépensé' : 'إجمالي المصروفات'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Moyenne' : 'المتوسط'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Localisation' : 'الموقع'}</th>
                    <th className="text-center p-3 font-bold">{lang === 'fr' ? 'Dernier Rental' : 'آخر حجز'}</th>
                  </tr>
                </thead>
                <tbody>
                  {clientStats.map((client, idx) => (
                    <motion.tr
                      key={client.clientId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`border-b border-saas-border hover:bg-saas-bg transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-saas-bg/50'
                      }`}
                    >
                      <td className="p-3 font-semibold text-saas-text-main">{client.clientName}</td>
                      <td className="p-3 text-center text-saas-text-muted">{client.totalReservations}</td>
                      <td className="p-3 text-center font-bold text-green-600">{client.totalSpent.toLocaleString()} DA</td>
                      <td className="p-3 text-center text-blue-600 font-semibold">{client.averageRental.toLocaleString()} DA</td>
                      <td className="p-3 text-center text-saas-text-muted text-xs flex items-center justify-center gap-1">
                        <MapPin size={14} /> {client.location}
                      </td>
                      <td className="p-3 text-center text-saas-text-muted text-xs">{client.lastRental}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Detailed Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Summary Reports */}
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
                  {lang === 'fr' ? 'Réservations' : 'الحجوزات'}
                </h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="bg-saas-bg p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-saas-text-muted">{lang === 'fr' ? 'Complétées' : 'مكتملة'}</span>
                    <span className="font-bold text-green-600">{stats.completedReservations}</span>
                  </div>
                </div>
                <div className="bg-saas-bg p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-saas-text-muted">{lang === 'fr' ? 'Actives' : 'نشطة'}</span>
                    <span className="font-bold text-blue-600">{stats.activeReservations}</span>
                  </div>
                </div>
                <div className="bg-saas-bg p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-saas-text-muted">{lang === 'fr' ? 'En attente' : 'قيد الانتظار'}</span>
                    <span className="font-bold text-yellow-600">{stats.pendingReservations}</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">{lang === 'fr' ? 'Prix Moyen' : 'السعر المتوسط'}</span>
                    <span className="font-bold text-blue-700">{stats.averageReservationPrice.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Website Orders Report */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <ShoppingCart className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Commandes Website' : 'طلبات الموقع'}
                </h3>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reportData.websiteOrders.length === 0 ? (
                  <div className="text-saas-text-muted text-center py-4">
                    {lang === 'fr' ? 'Aucune commande' : 'لا توجد طلبات'}
                  </div>
                ) : (
                  reportData.websiteOrders.map((order, idx) => (
                    <div key={order.id} className="text-xs bg-saas-bg p-3 rounded-lg border border-blue-200">
                      <div className="font-semibold text-saas-text-main flex justify-between">
                        <span>🛒 {order.car.brand} {order.car.model}</span>
                        <span className="text-blue-600">{order.totalPrice.toLocaleString()} DA</span>
                      </div>
                      <div className="text-saas-text-muted mt-1">
                        👤 {order.step2.firstName} {order.step2.lastName}
                      </div>
                      <div className="text-saas-text-muted text-xs">
                        📅 {order.createdAt.split('T')[0]} • {order.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Expenses & Alerts Report */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'Dépenses & Entretien' : 'المصاريف والصيانة'}
                </h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-800">{lang === 'fr' ? 'Dépenses Magasin' : 'مصاريف المتجر'}</span>
                    <span className="font-bold text-red-600">{stats.storeExpensesTotal.toLocaleString()} DA</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-orange-800">{lang === 'fr' ? 'Dépenses Véhicules' : 'مصاريف المركبات'}</span>
                    <span className="font-bold text-orange-600">{stats.vehicleExpensesTotal.toLocaleString()} DA</span>
                  </div>
                </div>
                <div className="text-xs text-saas-text-muted mt-3 font-semibold mb-2">
                  {lang === 'fr' ? 'Détail des Dépenses' : 'تفاصيل المصاريف'}
                </div>
                {reportData.storeExpenses.map((expense) => (
                  <div key={expense.id} className="text-xs bg-saas-bg p-2 rounded flex justify-between">
                    <span>{expense.icon} {expense.name}</span>
                    <span className="text-red-600 font-semibold">{expense.cost.toLocaleString()} DA</span>
                  </div>
                ))}
                {reportData.vehicleExpenses.map((expense) => (
                  <div key={expense.id} className="text-xs bg-saas-bg p-2 rounded flex justify-between">
                    <span>🛢️ {expense.type}</span>
                    <span className="text-orange-600 font-semibold">{expense.cost.toLocaleString()} DA</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Alerts Report */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white border border-saas-border rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-saas-primary-via" />
                <h3 className="text-lg font-bold text-saas-text-main">
                  {lang === 'fr' ? 'État des Alertes' : 'حالة التنبيهات'}
                </h3>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reportData.alerts.length === 0 ? (
                  <div className="text-saas-text-muted text-center py-4">
                    {lang === 'fr' ? 'Aucune alerte' : 'لا توجد تنبيهات'}
                  </div>
                ) : (
                  <>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-red-800">🔴 {lang === 'fr' ? 'Critique' : 'حرج'}</span>
                        <span className="font-bold text-red-600">{stats.criticalAlerts}</span>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-orange-800">🟠 {lang === 'fr' ? 'Élevé' : 'مرتفع'}</span>
                        <span className="font-bold text-orange-600">{stats.highAlerts}</span>
                      </div>
                    </div>
                    <div className="text-xs text-saas-text-muted mt-3 font-semibold mb-2">
                      {lang === 'fr' ? 'Détail des Alertes' : 'تفاصيل التنبيهات'}
                    </div>
                    {reportData.alerts.map((alert) => (
                      <div key={alert.id} className={`text-xs p-2 rounded flex justify-between ${
                        alert.severity === 'critical' ? 'bg-red-50' : 'bg-orange-50'
                      }`}>
                        <span>{alert.title}</span>
                        <span className={`text-xs font-semibold ${
                          alert.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {alert.daysUntilDue} {lang === 'fr' ? 'j' : 'د'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
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