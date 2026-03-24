import React, { useState, useMemo } from 'react';
import { Language, ReservationDetails } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, User, Car as CarIcon, Phone, Mail, Fuel, Wrench, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react';

interface ReservationTimelineViewProps {
  lang: Language;
  reservations: ReservationDetails[];
  onSelectReservation: (reservation: ReservationDetails) => void;
}

const COLORS = [
  { bg: 'from-blue-400 to-blue-600', text: 'text-blue-900', light: 'bg-blue-50', border: 'border-blue-200' },
  { bg: 'from-purple-400 to-purple-600', text: 'text-purple-900', light: 'bg-purple-50', border: 'border-purple-200' },
  { bg: 'from-pink-400 to-pink-600', text: 'text-pink-900', light: 'bg-pink-50', border: 'border-pink-200' },
  { bg: 'from-green-400 to-green-600', text: 'text-green-900', light: 'bg-green-50', border: 'border-green-200' },
  { bg: 'from-orange-400 to-orange-600', text: 'text-orange-900', light: 'bg-orange-50', border: 'border-orange-200' },
  { bg: 'from-teal-400 to-teal-600', text: 'text-teal-900', light: 'bg-teal-50', border: 'border-teal-200' },
  { bg: 'from-cyan-400 to-cyan-600', text: 'text-cyan-900', light: 'bg-cyan-50', border: 'border-cyan-200' },
  { bg: 'from-indigo-400 to-indigo-600', text: 'text-indigo-900', light: 'bg-indigo-50', border: 'border-indigo-200' },
  { bg: 'from-amber-400 to-amber-600', text: 'text-amber-900', light: 'bg-amber-50', border: 'border-amber-200' },
  { bg: 'from-rose-400 to-rose-600', text: 'text-rose-900', light: 'bg-rose-50', border: 'border-rose-200' },
];

export const ReservationTimelineView: React.FC<ReservationTimelineViewProps> = ({ 
  lang, 
  reservations,
  onSelectReservation 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'cars'>('month');
  const [expandedDates, setExpandedDates] = useState<{[key: string]: boolean}>({});
  const [hoveredReservationId, setHoveredReservationId] = useState<string | null>(null);
  const [selectedReservationForDetail, setSelectedReservationForDetail] = useState<ReservationDetails | null>(null);

  const getColorForReservation = (index: number) => COLORS[index % COLORS.length];

  const getReservationsForDate = (date: Date): ReservationDetails[] => {
    return reservations.filter(res => {
      const start = new Date(res.step1.departureDate);
      const end = new Date(res.step1.returnDate);
      return date >= start && date <= end;
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }
    return days;
  }, [currentDate]);

  const getWeekDays = () => {
    const today = selectedDay || new Date();
    const first = today.getDate() - today.getDay();
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(new Date(today.getFullYear(), today.getMonth(), first + i));
    }
    return weekDays;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setSelectedDay(new Date());
  };

  const monthName = currentDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ', {
    month: 'long',
    year: 'numeric'
  });

  const weekDays = getWeekDays();

  const uniqueCars = useMemo(() => {
    const carsMap = new Map();
    reservations.forEach(res => {
      const key = res.car.id;
      if (!carsMap.has(key)) {
        carsMap.set(key, { ...res.car, id: key });
      }
    });
    return Array.from(carsMap.values());
  }, [reservations]);

  const getCarReservations = (carId: string, startDate: Date, endDate: Date) => {
    return reservations.filter(res => {
      const resStart = new Date(res.step1.departureDate);
      const resEnd = new Date(res.step1.returnDate);
      return res.car.id === carId && resStart <= endDate && resEnd >= startDate;
    });
  };

  const getReservationPosition = (startDate: Date, endDate: Date, rangeStart: Date, rangeEnd: Date) => {
    const resStart = new Date(startDate).getTime();
    const resEnd = new Date(endDate).getTime();
    const rangeStartTime = rangeStart.getTime();
    const rangeEndTime = rangeEnd.getTime();
    
    const start = Math.max(resStart, rangeStartTime);
    const end = Math.min(resEnd, rangeEndTime);
    const total = rangeEndTime - rangeStartTime;
    
    const offset = ((start - rangeStartTime) / total) * 100;
    const width = ((end - start) / total) * 100;
    
    return { offset, width };
  };

  // Detailed Reservation Card Component
  const DetailedReservationCard: React.FC<{ res: ReservationDetails; onClose: () => void }> = ({ res, onClose }) => {
    const color = getColorForReservation(reservations.indexOf(res));
    const startTime = res.step1.departureTime || '10:00';
    const endTime = res.step1.returnTime || '18:00';
    const durationDays = Math.ceil((new Date(res.step1.returnDate).getTime() - new Date(res.step1.departureDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50 bg-gradient-to-br ${color.bg} text-white max-w-2xl w-full`}
      >
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 z-10"
        >
          <X className="w-6 h-6" />
        </motion.button>

        {/* Header with Client and Car */}
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            {/* Client Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center border-3 border-white/50 flex-shrink-0">
                  {res.client.profilePhoto ? (
                    <img src={res.client.profilePhoto} alt={res.client.firstName} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-black leading-tight">{res.client.firstName} {res.client.lastName}</p>
                  <p className="text-sm opacity-90">👤 {lang === 'fr' ? 'Client' : 'العميل'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white/10 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base font-bold">{res.client.phone}</span>
                </div>
                {res.client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base font-bold break-all">{res.client.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Car Image */}
            {res.car.images && res.car.images.length > 0 && res.car.images[0] ? (
              <img src={res.car.images[0]} alt={res.car.brand} className="w-32 h-32 rounded-xl object-cover border-4 border-white/50 flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-32 h-32 rounded-xl bg-white/20 flex items-center justify-center border-4 border-white/50 flex-shrink-0">
                <CarIcon className="w-16 h-16 text-white/40" />
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="bg-white/10 rounded-xl p-5 mb-5">
            <h4 className="text-2xl font-black mb-4">🚗 {res.car.brand} {res.car.model}</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Immatriculation' : 'التسجيل'}</p>
                <p className="font-black text-lg mt-1">🏷️ {res.car.registration}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Couleur' : 'اللون'}</p>
                <p className="font-black text-lg mt-1">🎨 {res.car.color}</p>
              </div>
              {res.car.fuelType && (
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Carburant' : 'الوقود'}</p>
                  <p className="font-black text-lg mt-1">⛽ {res.car.fuelType}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reservation Dates and Times */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Date Départ' : 'تاريخ المغادرة'}</p>
              <p className="font-black text-xl mt-1">{new Date(res.step1.departureDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</p>
              <p className="text-sm opacity-90 mt-1">⏰ {startTime}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Date Retour' : 'تاريخ الإرجاع'}</p>
              <p className="font-black text-xl mt-1">{new Date(res.step1.returnDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</p>
              <p className="text-sm opacity-90 mt-1">⏰ {endTime}</p>
            </div>
          </div>

          {/* Duration and Status */}
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              <div>
                <p className="font-black text-2xl">{durationDays}</p>
                <p className="text-xs opacity-75 uppercase">{lang === 'fr' ? 'jour(s)' : 'أيام'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-black px-4 py-2 rounded-full ${res.status === 'confirmed' ? 'bg-green-400/40 text-green-100' : 'bg-yellow-400/40 text-yellow-100'}`}>
                {res.status === 'confirmed' ? (lang === 'fr' ? '✓ CONFIRMÉE' : '✓ مؤكدة') : (lang === 'fr' ? '⏳ EN ATTENTE' : '⏳ معلقة')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white/10 px-6 py-4 flex justify-end border-t border-white/20">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onSelectReservation(res);
              onClose();
            }}
            className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-bold text-white transition-all"
          >
            {lang === 'fr' ? 'Voir Détails' : 'عرض التفاصيل'}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black text-saas-text-main uppercase tracking-tighter">
            📅 {lang === 'fr' ? 'Vue Calendrier' : 'عرض التقويم'}
          </h2>
          <div className="flex gap-1 bg-white rounded-lg border border-slate-300 p-1 shadow-md">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                viewMode === 'month' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang === 'fr' ? 'Mois' : 'شهر'}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                viewMode === 'week' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang === 'fr' ? 'Semaine' : 'أسبوع'}
            </button>
            <button
              onClick={() => setViewMode('cars')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                viewMode === 'cars' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang === 'fr' ? 'Voitures' : 'السيارات'}
            </button>
          </div>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          {lang === 'fr' ? "Aujourd'hui" : 'اليوم'}
        </button>
      </div>

      {/* Reservation Detail Modal */}
      <AnimatePresence>
        {selectedReservationForDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => setSelectedReservationForDetail(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <DetailedReservationCard 
                res={selectedReservationForDetail} 
                onClose={() => setSelectedReservationForDetail(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevMonth} 
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <h3 className="text-2xl font-black uppercase tracking-wider">{monthName}</h3>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNextMonth} 
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-sm font-bold">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="py-2">{lang === 'fr' ? day : ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'][['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].indexOf(day)]}</div>
              ))}
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayReservations = day ? getReservationsForDate(day) : [];
                const isToday = day && day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
                const isSelected = day && selectedDay && day.getDate() === selectedDay.getDate() && day.getMonth() === selectedDay.getMonth();

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`rounded-xl border-2 cursor-pointer transition-all overflow-hidden min-h-24 flex flex-col relative group ${
                      !day ? 'bg-gray-50' : isSelected ? 'bg-blue-50 border-blue-400 shadow-lg' : isToday ? 'bg-green-50 border-green-400 shadow-lg' : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xl'
                    }`}
                  >
                    {day && (
                      <>
                        <div onClick={() => setSelectedDay(day)} className="p-2">
                          <p className={`text-base font-black ${isToday ? 'text-green-700' : isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{day.getDate()}</p>
                        </div>
                        <div className="flex-1 px-2 space-y-1 overflow-y-auto">
                          <AnimatePresence mode="popLayout">
                            {dayReservations.slice(0, expandedDates[day?.toDateString() || ''] ? dayReservations.length : 1).map((res, i) => {
                              const color = getColorForReservation(reservations.indexOf(res));
                              const startTime = res.step1.departureTime || '10:00';
                              
                              return (
                                <motion.div
                                  key={res.id}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ delay: i * 0.05 }}
                                  onClick={() => setSelectedReservationForDetail(res)}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  className={`text-xs p-2 rounded-lg bg-gradient-to-r ${color.bg} text-white font-bold cursor-pointer hover:shadow-lg transition-all`}
                                >
                                  <div className="line-clamp-1 font-bold text-[11px]">{res.client.firstName}</div>
                                  <div className="line-clamp-1 text-[9px] opacity-90">{res.car.brand}</div>
                                  <div className="line-clamp-1 text-[8px] opacity-80">⏰ {startTime}</div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                        {dayReservations.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setExpandedDates({
                              ...expandedDates,
                              [day?.toDateString() || '']: !expandedDates[day?.toDateString() || '']
                            })}
                            className="w-full py-1 px-2 text-xs font-bold bg-blue-100 text-blue-700 border-t border-blue-200 hover:bg-blue-200"
                          >
                            {expandedDates[day?.toDateString() || ''] ? (
                              <span>🔺 {lang === 'fr' ? 'Afficher moins' : 'عرض أقل'}</span>
                            ) : (
                              <span>+{dayReservations.length - 1} {lang === 'fr' ? 'autre' : 'آخر'}</span>
                            )}
                          </motion.button>
                        )}
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSelectedDay(new Date(selectedDay?.getTime() || new Date().getTime() - 7 * 24 * 60 * 60 * 1000))} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <div className="text-center flex-1">
                <h3 className="text-2xl font-black uppercase tracking-wider mb-2">{lang === 'fr' ? 'Semaine du' : 'أسبوع'} {weekDays[0].toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</h3>
                <p className="text-sm opacity-90">{lang === 'fr' ? 'au' : 'إلى'} {weekDays[6].toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</p>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSelectedDay(new Date(selectedDay?.getTime() || new Date().getTime() + 7 * 24 * 60 * 60 * 1000))} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {weekDays.map((day, dayIndex) => {
              const dayReservations = getReservationsForDate(day);
              const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth();
              return (
                <motion.div key={dayIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.1 }} className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isToday ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'}`}>
                  <div className={`p-4 ${isToday ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-slate-500 to-slate-600'} text-white`}>
                    <p className="text-xs font-bold uppercase opacity-90">{day.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ', { weekday: 'short' })}</p>
                    <p className="text-3xl font-black">{day.getDate()}</p>
                    {isToday && <p className="text-xs font-bold opacity-90 mt-1">{lang === 'fr' ? "Aujourd'hui" : 'اليوم'}</p>}
                  </div>
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {dayReservations.length > 0 ? (
                        dayReservations.map((res, resIndex) => {
                          const color = getColorForReservation(reservations.indexOf(res));
                          const startTime = res.step1.departureTime || '10:00';
                          const endTime = res.step1.returnTime || '18:00';
                          
                          return (
                            <motion.div 
                              key={res.id} 
                              initial={{ opacity: 0, x: -20 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              exit={{ opacity: 0, x: -20 }} 
                              transition={{ delay: resIndex * 0.1 }} 
                              onClick={() => setSelectedReservationForDetail(res)}
                              whileHover={{ scale: 1.02, y: -2 }} 
                              className={`p-4 rounded-xl bg-gradient-to-br ${color.bg} text-white shadow-md hover:shadow-xl cursor-pointer transition-all group relative border-l-4 border-white/50`}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 border-2 border-white/50">
                                  {res.client.profilePhoto ? (
                                    <img src={res.client.profilePhoto} alt={res.client.firstName} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <User className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm leading-tight group-hover:underline">{res.client.firstName} {res.client.lastName}</p>
                                  <p className="text-xs opacity-90 truncate">📱 {res.client.phone}</p>
                                </div>
                              </div>
                              <div className="bg-white/20 rounded-lg p-3 mb-3 border-l-4 border-white/50">
                                <div className="flex items-center gap-2 mb-2">
                                  <CarIcon className="w-4 h-4" />
                                  <p className="font-bold text-sm">{res.car.brand} {res.car.model}</p>
                                </div>
                                <div className="text-xs opacity-90">🏷️ {res.car.registration}</div>
                              </div>
                              <div className="bg-white/20 rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>📍 Départ: {startTime}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>📍 Retour: {endTime}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <Calendar className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-xs font-bold text-center">{lang === 'fr' ? 'Aucune réservation' : 'لا توجد حجوزات'}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* CAR VIEW */}
      {viewMode === 'cars' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <div className="text-center flex-1">
                <h3 className="text-2xl font-black uppercase tracking-wider mb-2">{lang === 'fr' ? 'Vue Voitures' : 'عرض السيارات'}</h3>
                <p className="text-sm opacity-90">{monthName}</p>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {uniqueCars.map((car, carIndex) => {
              const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              const carReservations = getCarReservations(car.id, monthStart, monthEnd);
              const daysInMonth = getDaysInMonth(currentDate);
              
              return (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: carIndex * 0.1 }}
                  className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  {/* Car Header with Image */}
                  <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6 flex items-start gap-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="flex-shrink-0"
                    >
                      {car.images && car.images.length > 0 && car.images[0] ? (
                        <img src={car.images[0]} alt={car.brand} className="w-40 h-40 rounded-2xl object-cover border-4 border-white/60 shadow-lg hover:shadow-xl transition-all" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center border-4 border-white/60 shadow-lg">
                          <CarIcon className="w-20 h-20 text-white/40" />
                        </div>
                      )}
                    </motion.div>
                    
                    <div className="flex-1">
                      <h4 className="text-3xl font-black tracking-tight mb-2">{car.brand} {car.model}</h4>
                      
                      <div className="bg-white/10 rounded-xl p-4 space-y-3 mb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Immatriculation' : 'التسجيل'}</p>
                            <p className="font-black text-base mt-1">🏷️ {car.registration}</p>
                          </div>
                          <div>
                            <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Couleur' : 'اللون'}</p>
                            <p className="font-black text-base mt-1">🎨 {car.color}</p>
                          </div>
                          {car.fuelType && (
                            <div>
                              <p className="opacity-75 text-xs font-bold uppercase">{lang === 'fr' ? 'Carburant' : 'الوقود'}</p>
                              <p className="font-black text-base mt-1">⛽ {car.fuelType}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-amber-500/30 rounded-lg p-3 backdrop-blur-sm border border-amber-400/50 text-center">
                        <p className="text-2xl font-black text-amber-300">{carReservations.length}</p>
                        <p className="text-xs opacity-90">{lang === 'fr' ? 'réservation(s)' : 'حجز(ات)'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Section */}
                  <div className="p-5">
                    <p className="text-sm font-bold text-slate-700 mb-3">{lang === 'fr' ? 'Calendrier Disponibilité' : 'تقويم التوفر'}</p>
                    <div className="relative h-24 bg-slate-50 rounded-lg border border-slate-200 p-3 overflow-hidden mb-4">
                      {/* Timeline grid */}
                      <div className="absolute inset-0 flex opacity-20 pointer-events-none">
                        {Array.from({ length: daysInMonth }).map((_, i) => (
                          <div key={i} className="flex-1 border-r border-slate-300 last:border-r-0" />
                        ))}
                      </div>

                      {/* Reservation bars */}
                      <div className="relative h-full">
                        {carReservations.map((res, resIndex) => {
                          const { offset, width } = getReservationPosition(res.step1.departureDate, res.step1.returnDate, monthStart, monthEnd);
                          const color = getColorForReservation(reservations.indexOf(res));
                          const isHovered = hoveredReservationId === res.id;
                          const durationDays = Math.ceil((new Date(res.step1.returnDate).getTime() - new Date(res.step1.departureDate).getTime()) / (1000 * 60 * 60 * 24));
                          const startTime = res.step1.departureTime || '10:00';
                          const endTime = res.step1.returnTime || '18:00';
                          
                          return (
                            <motion.div
                              key={res.id}
                              initial={{ opacity: 0, scaleX: 0 }}
                              animate={{ opacity: 1, scaleX: 1 }}
                              transition={{ delay: resIndex * 0.05 }}
                              className="absolute top-2 h-10 rounded-md cursor-pointer"
                              style={{
                                left: `${offset}%`,
                                width: `${Math.max(width, 2)}%`,
                                transformOrigin: 'left'
                              }}
                              onMouseEnter={() => setHoveredReservationId(res.id)}
                              onMouseLeave={() => setHoveredReservationId(null)}
                              onClick={() => setSelectedReservationForDetail(res)}
                              whileHover={{ scaleY: 1.2, y: -2 }}
                            >
                              <div className={`w-full h-full bg-gradient-to-r ${color.bg} rounded-md shadow-md flex items-center justify-center relative group border border-white/30`}>
                                <div className="text-white text-[9px] font-bold text-center px-1 line-clamp-2">
                                  {res.client.firstName.substring(0, 4)}
                                </div>

                                {/* Hover Card Tooltip */}
                                <AnimatePresence>
                                  {isHovered && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                      transition={{ duration: 0.2 }}
                                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-4 w-72 z-50"
                                    >
                                      {/* Client and Car Info Row */}
                                      <div className="flex gap-3 mb-4">
                                        {/* Client Circle */}
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: 0.1 }}
                                          className="flex-shrink-0"
                                        >
                                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center border-3 border-white shadow-lg overflow-hidden flex-shrink-0">
                                            {res.client.profilePhoto ? (
                                              <img src={res.client.profilePhoto} alt={res.client.firstName} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                              <User className="w-8 h-8 text-white" />
                                            )}
                                          </div>
                                        </motion.div>

                                        {/* Car Circle */}
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ delay: 0.15 }}
                                          className="flex-shrink-0"
                                        >
                                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center border-3 border-white shadow-lg overflow-hidden flex-shrink-0">
                                            {res.car.images && res.car.images.length > 0 && res.car.images[0] ? (
                                              <img src={res.car.images[0]} alt={res.car.brand} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                              <CarIcon className="w-8 h-8 text-white" />
                                            )}
                                          </div>
                                        </motion.div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-black text-sm text-slate-900 leading-tight">{res.client.firstName}</p>
                                          <p className="text-xs text-slate-600">{res.client.lastName}</p>
                                          <p className="font-bold text-xs text-slate-700 mt-1">🚗 {res.car.brand}</p>
                                        </div>
                                      </div>

                                      {/* Divider */}
                                      <div className="h-px bg-slate-200 mb-3"></div>

                                      {/* Details Grid */}
                                      <div className="space-y-2">
                                        {/* Duration */}
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                          <span className="text-sm font-bold text-slate-800">{durationDays} {lang === 'fr' ? 'jour(s)' : 'يوم'}</span>
                                        </div>

                                        {/* Times */}
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                                          <span className="text-sm font-bold text-slate-800">{startTime} - {endTime}</span>
                                        </div>

                                        {/* Registration */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-slate-800">🏷️ {res.car.registration}</span>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                          <span className="text-xs text-slate-700">{res.client.phone}</span>
                                        </div>
                                      </div>

                                      {/* Arrow Pointer */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 translate-y-[-6px] w-4 h-4 bg-white border-r-2 border-b-2 border-slate-200 rounded-sm transform rotate-45"></div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Day labels */}
                    <div className="flex gap-0 text-[8px] font-bold text-slate-600 mb-4">
                      {Array.from({ length: daysInMonth }).map((_, i) => (
                        <div key={i} className="flex-1 text-center">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Reservations List */}
                    {carReservations.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-700">{lang === 'fr' ? 'Réservations:' : 'الحجوزات:'}</p>
                        <div className="space-y-2">
                          {carReservations.map((res) => {
                            const color = getColorForReservation(reservations.indexOf(res));
                            const durationDays = Math.ceil((new Date(res.step1.returnDate).getTime() - new Date(res.step1.departureDate).getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <motion.div
                                key={res.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setSelectedReservationForDetail(res)}
                                className={`p-3 rounded-lg bg-gradient-to-r ${color.bg} text-white font-bold cursor-pointer hover:shadow-lg transition-all`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm">{res.client.firstName} {res.client.lastName}</span>
                                  </div>
                                  <div className="text-right text-xs opacity-90">
                                    <div>{durationDays} {lang === 'fr' ? 'j' : 'ي'}</div>
                                    <div className="text-[10px]">
                                      {new Date(res.step1.departureDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })} - {new Date(res.step1.returnDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {uniqueCars.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-slate-400">
                <CarIcon className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-bold text-center">{lang === 'fr' ? 'Aucune voiture' : 'لا توجد سيارات'}</p>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 shadow-lg">
        <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">ℹ️ {lang === 'fr' ? 'Légende' : 'وسيلة إيضاح'}</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-green-500 shadow-md"></div>
            <span className="text-sm font-bold text-slate-700">{lang === 'fr' ? 'Jour actuel' : 'اليوم الحالي'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-blue-500 shadow-md"></div>
            <span className="text-sm font-bold text-slate-700">{lang === 'fr' ? 'Jour sélectionné' : 'اليوم المختار'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-400 to-pink-400 shadow-md"></div>
            <span className="text-sm font-bold text-slate-700">{lang === 'fr' ? 'Réservation' : 'حجز'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
