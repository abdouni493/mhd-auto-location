import React, { useState, useEffect } from 'react';
import { DashboardStats, MaintenanceAlert, Language, Car, ReservationDetails } from '../types';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, Users, Car as CarIcon, Calendar, DollarSign, Wrench, Shield, FileCheck, Loader2 } from 'lucide-react';
import { DatabaseService } from '../services/DatabaseService';

// Mock data for dashboard (removed - now using real data)

interface DashboardPageProps {
  lang: Language;
}

interface AlertCardProps {
  alert: MaintenanceAlert;
  lang: Language;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, lang }) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'low':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: '🟢'
        };
      case 'medium':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-orange-100',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: '🟡'
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-red-100',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: '🟠'
        };
      case 'critical':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-rose-100',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: '🔴'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-slate-100',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: '⚪'
        };
    }
  };

  const styles = getSeverityStyles(alert.severity);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02, x: 5 }}
      className={`relative overflow-hidden p-4 rounded-2xl border-2 ${styles.bg} ${styles.border} shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="absolute top-0 right-0 w-12 h-12 bg-white/20 rounded-full -translate-y-6 translate-x-6"></div>

      <div className="relative flex items-start gap-3">
        <motion.div
          animate={{
            rotate: alert.severity === 'critical' ? [0, 10, -10, 0] : [0, 5, -5, 0],
            scale: alert.severity === 'critical' ? [1, 1.1, 1] : [1, 1.05, 1]
          }}
          transition={{
            duration: alert.severity === 'critical' ? 1.5 : 2,
            repeat: Infinity
          }}
          className="text-2xl flex-shrink-0"
        >
          {alert.type === 'vidange' ? '🛢️' : alert.type === 'assurance' ? '🛡️' : alert.type === 'controle_technique' ? '🔍' : '⚠️'}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-bold uppercase tracking-tighter text-sm ${styles.text}`}>
              {alert.title}
            </h4>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg"
            >
              {styles.icon}
            </motion.div>
          </div>

          <p className={`${styles.text} text-sm mb-3 leading-relaxed`}>{alert.message}</p>

          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${styles.text} truncate`}>
              {alert.carInfo}
            </span>
            {alert.daysUntilDue !== undefined && (
              <span className={`font-bold px-2 py-1 rounded-full text-xs ${
                alert.isExpired
                  ? 'bg-red-500 text-white'
                  : alert.severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : alert.severity === 'high'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {alert.isExpired
                  ? (lang === 'fr' ? 'Expiré' : 'منتهي الصلاحية')
                  : (lang === 'fr' ? `${alert.daysUntilDue} jours` : `${alert.daysUntilDue} أيام`)
                }
              </span>
            )}
          </div>

          {alert.currentMileage && alert.nextServiceMileage && (
            <div className={`mt-3 text-xs ${styles.text} bg-white/50 p-2 rounded-lg`}>
              <div className="flex justify-between items-center">
                <span>{lang === 'fr' ? 'Kilométrage:' : 'الكيلومترات:'}</span>
                <span className="font-bold">
                  {alert.currentMileage.toLocaleString()} / {alert.nextServiceMileage.toLocaleString()} km
                </span>
              </div>
              <div className="w-full bg-white/50 rounded-full h-1 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    alert.isExpired ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((alert.currentMileage / alert.nextServiceMileage) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ lang }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalReservations: 0,
    activeReservations: 0,
    totalClients: 0,
    totalCars: 0,
    availableCars: 0,
    maintenanceAlerts: 0,
    overduePayments: 0,
    recentReservations: [],
    revenueByMonth: [],
    carUtilization: []
  });
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real data from database
        const dbStats = await DatabaseService.getDashboardStats();
        const dbAlerts = await DatabaseService.getMaintenanceAlerts();

        // Map database stats to component state
        setStats({
          totalRevenue: dbStats.totalRevenue,
          totalExpenses: dbStats.totalExpenses,
          netProfit: dbStats.netProfit,
          totalClients: dbStats.totalClients,
          totalCars: dbStats.totalCars,
          activeReservations: dbStats.activeReservations,
          maintenanceAlerts: dbStats.maintenanceAlerts,
          // Default values for other fields not provided by database
          monthlyRevenue: 0,
          totalReservations: 0,
          availableCars: 0,
          overduePayments: 0,
          recentReservations: [],
          revenueByMonth: [],
          carUtilization: []
        });

        setAlerts(dbAlerts);

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    loadDashboardData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const otherAlerts = alerts.filter(a => a.severity !== 'critical' && a.severity !== 'high');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-saas-primary-via border-t-transparent rounded-full"
        />
        <span className="ml-4 text-saas-text-main font-medium">
          {lang === 'fr' ? 'Chargement du tableau de bord...' : 'جاري تحميل لوحة القيادة...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-saas-text-main mb-2">
            {lang === 'fr' ? 'Erreur de chargement' : 'خطأ في التحميل'}
          </h3>
          <p className="text-saas-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
{/* Modern Alerts Section */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          {/* Header with Glass Effect */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              </motion.div>
              <div>
                <h2 className="text-2xl font-black text-saas-text-main uppercase tracking-tighter">
                  {lang === 'fr' ? 'Alertes Importantes' : 'تنبيهات مهمة'}
                </h2>
                <p className="text-saas-text-muted font-medium">
                  {alerts.length} {lang === 'fr' ? 'alertes nécessitent votre attention' : 'تنبيه يتطلب انتباهك'}
                </p>
              </div>
            </div>

            {/* Priority Indicators */}
            <div className="flex gap-3">
              {criticalAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-bold shadow-lg border border-red-400/20"
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>{criticalAlerts.length} {lang === 'fr' ? 'Critiques' : 'حرجة'}</span>
                </motion.div>
              )}
              {highAlerts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-lg border border-orange-400/20"
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>{highAlerts.length} {lang === 'fr' ? 'Élevées' : 'مرتفعة'}</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Modern Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.slice(0, 6).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: "easeOut"
                }}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2 }
                }}
                className={`relative group overflow-hidden rounded-2xl border-2 shadow-lg backdrop-blur-sm transition-all duration-300 ${
                  alert.severity === 'critical'
                    ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:border-red-300 hover:shadow-red-200/50'
                    : alert.severity === 'high'
                    ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300 hover:shadow-orange-200/50'
                    : alert.severity === 'medium'
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-300 hover:shadow-yellow-200/50'
                    : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:border-green-300 hover:shadow-green-200/50'
                }`}
              >
                {/* Severity Indicator */}
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  alert.severity === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  alert.severity === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                  alert.severity === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                  'bg-gradient-to-r from-green-500 to-green-600'
                }`}></div>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <span className="text-xl">
                          {alert.type === 'vidange' ? '🛢️' :
                           alert.type === 'assurance' ? '🛡️' :
                           alert.type === 'controle_technique' ? '🔍' : '⚠️'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                          {alert.title}
                        </h3>
                        <p className="text-xs text-gray-600 font-medium">
                          {alert.carInfo.split(' - ')[0]}
                        </p>
                      </div>
                    </div>

                    {/* Priority Badge */}
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {alert.severity === 'critical' ? '🚨' :
                       alert.severity === 'high' ? '⚡' :
                       alert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {alert.message}
                    </p>

                    {/* Time Indicator */}
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold ${
                        alert.daysUntilDue > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <span>⏰</span>
                        {alert.daysUntilDue > 0
                          ? `${alert.daysUntilDue} ${lang === 'fr' ? 'jours' : 'أيام'}`
                          : lang === 'fr' ? 'Expiré' : 'منتهي الصلاحية'
                        }
                      </div>

                      {/* Action Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors ${
                          alert.severity === 'critical'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : alert.severity === 'high'
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {lang === 'fr' ? 'Voir' : 'عرض'}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>

          {/* View All Button */}
          {alerts.length > 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-saas-primary-start to-saas-primary-end text-white rounded-xl font-bold uppercase text-sm shadow-lg hover:shadow-xl transition-shadow"
              >
                {lang === 'fr' ? 'Voir Toutes les Alertes' : 'عرض جميع التنبيهات'}
                <span className="ml-2">→</span>
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Enhanced Header with Better Design */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-2xl"
      >
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <motion.h1
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl"
              >
                📊
              </motion.span>
              {lang === 'fr' ? 'Tableau de Bord' : 'لوحة القيادة'}
            </motion.h1>
            <motion.p
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-blue-100 font-bold text-sm uppercase tracking-[0.3em]"
            >
              {lang === 'fr' ? 'Vue d\'ensemble Premium' : 'نظرة عامة مميزة'}
            </motion.p>
            <motion.p
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-blue-200 text-sm font-medium mt-3 flex items-center gap-2"
            >
              <span className="text-lg">🕐</span>
              {currentTime.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </motion.p>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
            className="flex gap-4"
          >
            <div className="text-center">
              <div className="text-3xl font-black text-white">
                {stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-blue-200 uppercase tracking-widest">
                {lang === 'fr' ? 'Revenus Totaux' : 'إجمالي الإيرادات'}
              </div>
            </div>
            <div className="w-px bg-white/30"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-white">
                {stats.totalClients}
              </div>
              <div className="text-xs text-blue-200 uppercase tracking-widest">
                {lang === 'fr' ? 'Clients' : 'العملاء'}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Key Metrics with Better Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -15 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05, rotateY: 5 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-6 rounded-3xl text-white shadow-2xl hover:shadow-emerald-500/25"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                {lang === 'fr' ? 'Revenus Mensuels' : 'الإيرادات الشهرية'}
              </p>
              <p className="text-3xl font-black mb-3">
                {stats.monthlyRevenue.toLocaleString()} <span className="text-lg">DZD</span>
              </p>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  📈
                </motion.div>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">+12.5%</span>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl opacity-90"
            >
              💰
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -15 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05, rotateY: 5 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-2xl hover:shadow-blue-500/25"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                {lang === 'fr' ? 'Réservations Actives' : 'الحجوزات النشطة'}
              </p>
              <p className="text-3xl font-black mb-3">{stats.activeReservations}</p>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📅
                </motion.div>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                  {lang === 'fr' ? 'Ce mois' : 'هذا الشهر'}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-6xl opacity-90"
            >
              🚗
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -15 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05, rotateY: 5 }}
          className="relative overflow-hidden bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 p-6 rounded-3xl text-white shadow-2xl hover:shadow-orange-500/25"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                {lang === 'fr' ? 'Véhicules Disponibles' : 'المركبات المتاحة'}
              </p>
              <p className="text-3xl font-black mb-3">
                {stats.availableCars}/{stats.totalCars}
              </p>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                >
                  🚙
                </motion.div>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                  {Math.round((stats.availableCars / stats.totalCars) * 100)}%
                </span>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              className="text-6xl opacity-90"
            >
              🏁
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -15 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
          whileHover={{ scale: 1.05, rotateY: 5 }}
          className="relative overflow-hidden bg-gradient-to-br from-red-500 via-rose-600 to-pink-700 p-6 rounded-3xl text-white shadow-2xl hover:shadow-red-500/25"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                {lang === 'fr' ? 'Alertes Maintenance' : 'تنبيهات الصيانة'}
              </p>
              <p className="text-3xl font-black mb-3">{stats.maintenanceAlerts}</p>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ⚠️
                </motion.div>
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                  {criticalAlerts.length} {lang === 'fr' ? 'critiques' : 'حرجة'}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="text-6xl opacity-90"
            >
              🔧
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart with Better Design */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-gray-100 p-8 rounded-3xl border border-slate-200 shadow-xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16"></div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl"
              >
                📊
              </motion.div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                {lang === 'fr' ? 'Évolution des Revenus' : 'تطور الإيرادات'}
              </h3>
            </div>

            <div className="space-y-6">
              {stats.revenueByMonth.map((item, index) => (
                <motion.div
                  key={item.month}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 hover:shadow-lg transition-all"
                >
                  <div className="w-12 text-lg font-black text-slate-700 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    {item.month}
                  </div>
                  <div className="flex-1">
                    <div className="bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.revenue / Math.max(...stats.revenueByMonth.map(m => m.revenue))) * 100}%` }}
                        transition={{ delay: 1 + index * 0.1, duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 rounded-full shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right">
                    <div className="text-lg font-black text-slate-800">
                      {item.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-widest">
                      DZD
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Car Utilization with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50 to-teal-100 p-8 rounded-3xl border border-emerald-200 shadow-xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full -translate-y-16 translate-x-16"></div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-3xl"
              >
                🚗
              </motion.div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                {lang === 'fr' ? 'Taux d\'Utilisation' : 'معدلات الاستخدام'}
              </h3>
            </div>

            <div className="space-y-6">
              {stats.carUtilization.map((car, index) => (
                <motion.div
                  key={car.carId}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                      className="text-2xl"
                    >
                      {car.utilization > 80 ? '🔴' : car.utilization > 60 ? '🟠' : '🟢'}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-800">{car.carInfo}</span>
                        <span className="text-lg font-black text-emerald-600">{car.utilization}%</span>
                      </div>
                      <div className="bg-emerald-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${car.utilization}%` }}
                          transition={{ delay: 1.1 + index * 0.1, duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full shadow-lg ${
                            car.utilization > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            car.utilization > 60 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                            'bg-gradient-to-r from-emerald-500 to-teal-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Maintenance Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8 rounded-3xl border border-slate-200 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-400/10 to-gray-500/10 rounded-full -translate-y-20 translate-x-20"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                🔧
              </motion.div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                  {lang === 'fr' ? 'Alertes de Maintenance' : 'تنبيهات الصيانة'}
                </h3>
                <p className="text-slate-600 text-sm font-medium mt-1">
                  {lang === 'fr' ? 'Suivi des véhicules et interventions' : 'متابعة المركبات والتدخلات'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {criticalAlerts.length > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-bold uppercase shadow-lg"
                >
                  <span className="text-lg">🚨</span>
                  {criticalAlerts.length} {lang === 'fr' ? 'Critiques' : 'حرجة'}
                </motion.div>
              )}
              {highAlerts.length > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-sm font-bold uppercase shadow-lg"
                >
                  <span className="text-lg">⚠️</span>
                  {highAlerts.length} {lang === 'fr' ? 'Élevées' : 'مرتفعة'}
                </motion.div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Critical alerts first */}
            {criticalAlerts.slice(0, 3).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border-2 border-red-200 shadow-lg hover:shadow-red-500/25"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative">
                  <div className="flex items-start gap-3 mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-3xl"
                    >
                      {alert.type === 'vidange' ? '🛢️' : alert.type === 'assurance' ? '🛡️' : '🔍'}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-800 uppercase tracking-tighter text-sm mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-red-700 text-sm">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-red-600">
                    <span className="font-medium">{alert.carInfo.split(' - ')[0]}</span>
                    <span className={`font-bold ${alert.isExpired ? 'text-red-800' : ''}`}>
                      {alert.isExpired
                        ? (lang === 'fr' ? 'Expiré' : 'منتهي الصلاحية')
                        : (lang === 'fr' ? `${alert.daysUntilDue} jours` : `${alert.daysUntilDue} أيام`)
                      }
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* High priority alerts */}
            {highAlerts.slice(0, 3).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-200 shadow-lg hover:shadow-orange-500/25"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative">
                  <div className="flex items-start gap-3 mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-3xl"
                    >
                      {alert.type === 'vidange' ? '🛢️' : alert.type === 'assurance' ? '🛡️' : '🔍'}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-orange-800 uppercase tracking-tighter text-sm mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-orange-700 text-sm">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-orange-600">
                    <span className="font-medium">{alert.carInfo.split(' - ')[0]}</span>
                    <span className="font-bold">
                      {lang === 'fr' ? `${alert.daysUntilDue} jours` : `${alert.daysUntilDue} أيام`}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Other alerts */}
            {otherAlerts.slice(0, 3).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-blue-500/25"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative">
                  <div className="flex items-start gap-3 mb-4">
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="text-3xl"
                    >
                      {alert.type === 'vidange' ? '🛢️' : alert.type === 'assurance' ? '🛡️' : '🔍'}
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-800 uppercase tracking-tighter text-sm mb-1">
                        {alert.title}
                      </h4>
                      <p className="text-blue-700 text-sm">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span className="font-medium">{alert.carInfo.split(' - ')[0]}</span>
                    <span className="font-bold">
                      {lang === 'fr' ? `${alert.daysUntilDue} jours` : `${alert.daysUntilDue} أيام`}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {alerts.length > 9 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-center mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl hover:from-slate-700 hover:to-slate-800 transition-all font-bold uppercase tracking-widest text-sm shadow-lg"
              >
                👁️ {lang === 'fr' ? 'Voir Toutes les Alertes' : 'عرض جميع التنبيهات'}
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-2xl hover:shadow-blue-500/25 text-center group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              📅
            </motion.div>
            <h4 className="text-xl font-black uppercase tracking-tighter mb-3">
              {lang === 'fr' ? 'Nouvelles Réservations' : 'حجوزات جديدة'}
            </h4>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              {lang === 'fr' ? 'Créer une nouvelle réservation pour vos clients' : 'إنشاء حجز جديد لعملائك'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all font-bold uppercase tracking-widest text-sm border border-white/30"
            >
              🚀 {lang === 'fr' ? 'Créer' : 'إنشاء'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 p-8 rounded-3xl text-white shadow-2xl hover:shadow-emerald-500/25 text-center group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              🚗
            </motion.div>
            <h4 className="text-xl font-black uppercase tracking-tighter mb-3">
              {lang === 'fr' ? 'Ajouter un Véhicule' : 'إضافة مركبة'}
            </h4>
            <p className="text-emerald-100 text-sm mb-6 leading-relaxed">
              {lang === 'fr' ? 'Étendre votre flotte automobile' : 'توسيع أسطولك السيارات'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all font-bold uppercase tracking-widest text-sm border border-white/30"
            >
              ➕ {lang === 'fr' ? 'Ajouter' : 'إضافة'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-600 to-pink-700 p-8 rounded-3xl text-white shadow-2xl hover:shadow-orange-500/25 text-center group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              📊
            </motion.div>
            <h4 className="text-xl font-black uppercase tracking-tighter mb-3">
              {lang === 'fr' ? 'Rapports Détaillés' : 'تقارير مفصلة'}
            </h4>
            <p className="text-orange-100 text-sm mb-6 leading-relaxed">
              {lang === 'fr' ? 'Analyser vos performances et statistiques' : 'تحليل أدائك والإحصائيات'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all font-bold uppercase tracking-widest text-sm border border-white/30"
            >
              📈 {lang === 'fr' ? 'Voir' : 'عرض'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};