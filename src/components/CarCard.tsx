import React from 'react';
import { Car, Language } from '../types';
import { motion } from 'motion/react';

interface CarCardProps {
  car: Car;
  lang: Language;
  onDelete: (id: string) => void;
  onEdit: (car: Car) => void;
  onViewDetails: (car: Car) => void;
  onHistory: (car: Car) => void;
  onExpenses: (car: Car) => void;
  onReports: (car: Car) => void;
  onStatusChange?: (carId: string, newStatus: string) => void;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  lang,
  onDelete,
  onEdit,
  onViewDetails,
  onHistory,
  onExpenses,
  onReports,
  onStatusChange,
}) => {
  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'louer':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'disponible':
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch(status) {
      case 'louer':
        return lang === 'fr' ? 'En Location' : 'في الإيجار';
      case 'maintenance':
        return lang === 'fr' ? 'En Maintenance' : 'في الصيانة';
      case 'disponible':
      default:
        return lang === 'fr' ? 'Disponible' : 'متاح';
    }
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card overflow-hidden bg-white flex flex-col group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={car.images[0] || 'https://picsum.photos/seed/car/400/300'}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 right-2 bg-saas-primary-start/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm shadow-lg">
          {car.year}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-black text-saas-text-main uppercase tracking-tighter">
            {car.brand} {car.model}
          </h3>
          <p className="text-[10px] text-saas-primary-via font-bold uppercase tracking-widest">{car.registration}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-saas-text-muted uppercase tracking-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-saas-primary-via">⛽</span> {car.energy}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-saas-primary-via">⚙️</span> {car.transmission}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-saas-primary-via">👥</span> {car.seats} Places
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-saas-primary-via">🎨</span> {car.color}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-2">
          <div className={`text-[9px] font-bold px-3 py-1.5 rounded-lg border ${getStatusColor(car.status)}`}>
            {getStatusLabel(car.status)}
          </div>
          {onStatusChange && (
            <button
              onClick={() => {
                const newStatus = car.status === 'louer' ? 'disponible' : 'louer';
                onStatusChange(car.id, newStatus);
              }}
              className="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              title={lang === 'fr' ? 'Changer le statut' : 'تغيير الحالة'}
            >
              ↔️ {lang === 'fr' ? 'Changer' : 'تغيير'}
            </button>
          )}
        </div>

        <div className="pt-3 border-t border-saas-border flex items-center justify-between">
          <div className="text-saas-primary-via font-black text-lg tracking-tighter">
            {car.priceDay.toLocaleString()} <span className="text-[9px] text-saas-text-muted uppercase">DZD / JOUR</span>
          </div>
          <div className="text-[9px] text-saas-text-muted font-bold uppercase tracking-widest">
            {car.mileage.toLocaleString()} KM
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onViewDetails(car)}
            className="p-2.5 rounded-xl bg-saas-bg hover:bg-saas-secondary-start/10 text-saas-text-muted transition-all hover:scale-105 flex flex-col items-center gap-1 border border-saas-border hover:border-saas-secondary-start/20"
            title="Détails"
          >
            <span className="text-lg">👁️</span>
            <span className="text-[8px] uppercase font-bold">Détails</span>
          </button>
          <button
            onClick={() => onEdit(car)}
            className="p-2.5 rounded-xl bg-saas-bg hover:bg-saas-secondary-start/10 text-saas-text-muted transition-all hover:scale-105 flex flex-col items-center gap-1 border border-saas-border hover:border-saas-secondary-start/20"
            title="Modifier"
          >
            <span className="text-lg">✏️</span>
            <span className="text-[8px] uppercase font-bold">Edit</span>
          </button>
          <button
            onClick={() => onHistory(car)}
            className="p-2.5 rounded-xl bg-saas-bg hover:bg-saas-secondary-start/10 text-saas-text-muted transition-all hover:scale-105 flex flex-col items-center gap-1 border border-saas-border hover:border-saas-secondary-start/20"
            title="Historique"
          >
            <span className="text-lg">📜</span>
            <span className="text-[8px] uppercase font-bold">History</span>
          </button>
          <button
            onClick={() => onExpenses(car)}
            className="p-2.5 rounded-xl bg-saas-bg hover:bg-saas-success-start/10 text-saas-text-muted transition-all hover:scale-105 flex flex-col items-center gap-1 border border-saas-border hover:border-saas-success-start/20"
            title="Dépenses"
          >
            <span className="text-lg">📉</span>
            <span className="text-[8px] uppercase font-bold text-saas-success-start">Expences</span>
          </button>
          <button
            onClick={() => onReports(car)}
            className="p-2.5 rounded-xl bg-saas-bg hover:bg-saas-warning-start/10 text-saas-text-muted transition-all hover:scale-105 flex flex-col items-center gap-1 border border-saas-border hover:border-saas-warning-start/20"
            title="Rapports"
          >
            <span className="text-lg">📄</span>
            <span className="text-[8px] uppercase font-bold text-saas-warning-start">Reports</span>
          </button>
          <button
            onClick={() => onDelete(car.id)}
            className="p-2.5 rounded-xl bg-saas-danger-start/5 hover:bg-saas-danger-start hover:text-white text-saas-danger-start transition-all hover:scale-105 flex flex-col items-center gap-1 border border-saas-danger-start/10"
            title="Supprimer"
          >
            <span className="text-lg">🗑️</span>
            <span className="text-[8px] uppercase font-bold">Delete</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
