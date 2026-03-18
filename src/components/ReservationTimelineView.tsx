import React, { useState, useMemo } from 'react';
import { Language, ReservationDetails } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, User, Car as CarIcon, Phone, Mail, Fuel, Wrench, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [expandedDates, setExpandedDates] = useState<{[key: string]: boolean}>({});

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black text-saas-text-main uppercase tracking-tighter">
            📅 {lang === 'fr' ? 'Vue Calendrier' : 'عرض التقويم'}
          </h2>
          <div className="flex gap-2 bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                viewMode === 'month' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang === 'fr' ? 'Mois' : 'شهر'}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                viewMode === 'week' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang === 'fr' ? 'Semaine' : 'أسبوع'}
            </button>
          </div>
        </div>
        <button
          onClick={handleToday}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
        >
          {lang === 'fr' ? "Aujourd'hui" : 'اليوم'}
        </button>
      </div>

      {viewMode === 'month' ? (
        // MONTH VIEW
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h3 className="text-2xl font-black uppercase tracking-wider">{monthName}</h3>
              <button onClick={handleNextMonth} className="p-2 hover:bg-white/20 rounded-lg transition-all">
                <ChevronRight className="w-6 h-6" />
              </button>
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
                const dateKey = day ? `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}` : '';
                const isExpanded = expandedDates[dateKey] || false;
                const showExpandBtn = dayReservations.length > 2;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`rounded-lg border-2 cursor-pointer transition-all overflow-hidden min-h-28 flex flex-col ${
                      !day ? 'bg-gray-50' : isSelected ? 'bg-blue-50 border-blue-400 shadow-lg' : isToday ? 'bg-green-50 border-green-400 shadow-lg' : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-lg'
                    }`}
                  >
                    {day && (
                      <>
                        <div onClick={() => setSelectedDay(day)} className="p-2 pb-1">
                          <p className={`text-sm font-black ${isToday ? 'text-green-700' : 'text-slate-600'}`}>{day.getDate()}</p>
                        </div>
                        <div className="flex-1 px-2 pb-1 space-y-1 overflow-y-auto">
                          <AnimatePresence mode="popLayout">
                            {(isExpanded ? dayReservations : dayReservations.slice(0, 2)).map((res, i) => {
                              const color = getColorForReservation(reservations.indexOf(res));
                              const startTime = res.step1.departureTime || '10:00';
                              return (
                                <motion.div
                                  key={res.id}
                                  initial={{ opacity: 0, scale: 0.8, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.8, y: -5 }}
                                  transition={{ delay: i * 0.05 }}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  onClick={(e) => { e.stopPropagation(); onSelectReservation(res); }}
                                  className={`text-xs p-1.5 rounded-md bg-gradient-to-r ${color.bg} text-white font-bold cursor-pointer hover:shadow-lg transition-all group`}
                                >
                                  <div className="line-clamp-1 font-bold text-[11px]">{res.client.firstName}</div>
                                  <div className="line-clamp-1 text-[10px] opacity-90">{res.car.brand}</div>
                                  <div className="line-clamp-1 text-[9px] opacity-80 flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> {startTime}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                        {showExpandBtn && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); setExpandedDates(prev => ({ ...prev, [dateKey]: !isExpanded })); }}
                            className={`w-full py-1 px-2 text-xs font-bold flex items-center justify-center gap-1 transition-all border-t ${isExpanded ? 'bg-blue-500 text-white border-blue-400' : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'}`}
                          >
                            {isExpanded ? (<><ChevronUp className="w-3 h-3" /> {lang === 'fr' ? 'Moins' : 'أقل'}</>) : (<><ChevronDown className="w-3 h-3" /> +{dayReservations.length - 2}</>)}
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
      ) : (
        // WEEK VIEW
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
                            <motion.div key={res.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: resIndex * 0.1 }} whileHover={{ scale: 1.02, y: -2 }} onClick={() => onSelectReservation(res)} className={`p-4 rounded-xl bg-gradient-to-br ${color.bg} text-white shadow-md hover:shadow-lg cursor-pointer transition-all group relative border-l-4 border-white/50`}>
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
                                <div className="text-xs opacity-90">⏱️ {res.totalDays} {lang === 'fr' ? 'jours' : 'أيام'}</div>
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
