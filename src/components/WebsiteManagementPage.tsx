import React, { useState, useEffect } from 'react';
import { Language, Car, Offer, SpecialOffer, ContactInfo, WebsiteSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { DatabaseService } from '../services/DatabaseService';

interface WebsiteManagementPageProps {
  lang: Language;
  cars: Car[];
}

export const WebsiteManagementPage: React.FC<WebsiteManagementPageProps> = ({ lang, cars }) => {
  const [activeTab, setActiveTab] = useState<'offers' | 'special' | 'contacts' | 'settings'>('offers');

  // OFFERS STATE
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerSearch, setOfferSearch] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [selectedCarOffer, setSelectedCarOffer] = useState<Car | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // SPECIAL OFFERS STATE
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [specialSearch, setSpecialSearch] = useState('');
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [selectedCarSpecial, setSelectedCarSpecial] = useState<Car | null>(null);
  const [specialOldPrice, setSpecialOldPrice] = useState('');
  const [specialNewPrice, setSpecialNewPrice] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [editingSpecial, setEditingSpecial] = useState<SpecialOffer | null>(null);

  // CONTACTS STATE
  const [contacts, setContacts] = useState<ContactInfo>({});
  const [settings, setSettings] = useState<WebsiteSettings>({
    name: '',
    description: '',
    logo: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [offersData, specialOffersData, contactsData, settingsData] = await Promise.all([
          DatabaseService.getOffers(),
          DatabaseService.getSpecialOffers(),
          DatabaseService.getWebsiteContacts(),
          DatabaseService.getWebsiteSettings(),
        ]);

        setOffers(offersData);
        setSpecialOffers(specialOffersData);
        setContacts(contactsData);
        setSettings(settingsData);
        setError(null);
      } catch (error: any) {
        console.error('Error loading website data:', error);
        if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
          setError('Session expirée. Veuillez vous reconnecter.');
        } else {
          setError('Erreur lors du chargement des données du site web');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // OFFERS SEARCH
  const handleOfferSearch = (query: string) => {
    setOfferSearch(query);
    if (query.trim()) {
      const filtered = cars.filter(car =>
        car.brand.toLowerCase().includes(query.toLowerCase()) ||
        car.model.toLowerCase().includes(query.toLowerCase()) ||
        car.registration.toLowerCase().includes(query.toLowerCase()) ||
        car.vin.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCars(filtered);
    } else {
      setFilteredCars([]);
    }
  };

  const handleSelectCarOffer = (car: Car) => {
    setSelectedCarOffer(car);
    setOfferSearch(`${car.brand} ${car.model}`);
    setFilteredCars([]);
  };

  const handleAddOffer = async () => {
    if (selectedCarOffer && offerPrice) {
      try {
        if (editingOffer) {
          const updatedOffer = await DatabaseService.updateOffer(editingOffer.id, {
            carId: selectedCarOffer.id,
            price: parseFloat(offerPrice),
            note: offerNote,
          });
          setOffers(prev => prev.map(o => o.id === editingOffer.id ? updatedOffer : o));
          setEditingOffer(null);
        } else {
          const newOffer = await DatabaseService.createOffer({
            carId: selectedCarOffer.id,
            price: parseFloat(offerPrice),
            note: offerNote,
          });
          setOffers(prev => [newOffer, ...prev]);
        }

        setShowOfferModal(false);
        setSelectedCarOffer(null);
        setOfferPrice('');
        setOfferNote('');
        setOfferSearch('');
      } catch (error) {
        console.error('Error saving offer:', error);
        setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors de la sauvegarde de l\'offre' : 'خطأ في حفظ العرض' });
        setTimeout(() => setNotification(null), 4000);
      }
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (confirm(lang === 'fr' ? 'Êtes-vous sûr?' : 'هل أنت متأكد؟')) {
      try {
        await DatabaseService.deleteOffer(id);
        setOffers(prev => prev.filter(o => o.id !== id));
      } catch (error) {
        console.error('Error deleting offer:', error);
        setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors de la suppression' : 'خطأ في الحذف' });
        setTimeout(() => setNotification(null), 4000);
      }
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setSelectedCarOffer(offer.car);
    setOfferPrice(offer.price.toString());
    setOfferNote(offer.note || '');
    setOfferSearch(`${offer.car.brand} ${offer.car.model}`);
    setShowOfferModal(true);
  };

  // SPECIAL OFFERS SEARCH
  const handleSpecialSearch = (query: string) => {
    setSpecialSearch(query);
    if (query.trim()) {
      const filtered = cars.filter(car =>
        car.brand.toLowerCase().includes(query.toLowerCase()) ||
        car.model.toLowerCase().includes(query.toLowerCase()) ||
        car.registration.toLowerCase().includes(query.toLowerCase()) ||
        car.vin.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCars(filtered);
    } else {
      setFilteredCars([]);
    }
  };

  const handleSelectCarSpecial = (car: Car) => {
    setSelectedCarSpecial(car);
    setSpecialSearch(`${car.brand} ${car.model}`);
    setFilteredCars([]);
  };

  const handleAddSpecial = async () => {
    if (selectedCarSpecial && specialOldPrice && specialNewPrice) {
      try {
        if (editingSpecial) {
          const updatedSpecial = await DatabaseService.updateSpecialOffer(editingSpecial.id, {
            carId: selectedCarSpecial.id,
            oldPrice: parseFloat(specialOldPrice),
            newPrice: parseFloat(specialNewPrice),
            note: specialNote,
            isActive: editingSpecial.isActive,
          });
          setSpecialOffers(prev => prev.map(s => s.id === editingSpecial.id ? updatedSpecial : s));
          setEditingSpecial(null);
        } else {
          const newSpecial = await DatabaseService.createSpecialOffer({
            carId: selectedCarSpecial.id,
            oldPrice: parseFloat(specialOldPrice),
            newPrice: parseFloat(specialNewPrice),
            note: specialNote,
            isActive: true,
          });
          setSpecialOffers(prev => [newSpecial, ...prev]);
        }

        setShowSpecialModal(false);
        setSelectedCarSpecial(null);
        setSpecialOldPrice('');
        setSpecialNewPrice('');
        setSpecialNote('');
        setSpecialSearch('');
      } catch (error) {
        console.error('Error saving special offer:', error);
        setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors de la sauvegarde de l\'offre spéciale' : 'خطأ في حفظ العرض الخاص' });
        setTimeout(() => setNotification(null), 4000);
      }
    }
  };

  const handleDeleteSpecial = async (id: string) => {
    if (confirm(lang === 'fr' ? 'Êtes-vous sûr?' : 'هل أنت متأكد؟')) {
      try {
        await DatabaseService.deleteSpecialOffer(id);
        setSpecialOffers(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error('Error deleting special offer:', error);
        setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors de la suppression' : 'خطأ في الحذف' });
        setTimeout(() => setNotification(null), 4000);
      }
    }
  };

  const handleEditSpecial = (special: SpecialOffer) => {
    setEditingSpecial(special);
    setSelectedCarSpecial(special.car);
    setSpecialOldPrice(special.oldPrice.toString());
    setSpecialNewPrice(special.newPrice.toString());
    setSpecialNote(special.note || '');
    setSpecialSearch(`${special.car.brand} ${special.car.model}`);
    setShowSpecialModal(true);
  };

  const handleToggleSpecialStatus = async (id: string) => {
    try {
      const updatedSpecial = await DatabaseService.toggleSpecialOfferStatus(id);
      setSpecialOffers(prev => prev.map(s => s.id === id ? updatedSpecial : s));
    } catch (error) {
      console.error('Error toggling special offer status:', error);
      setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors du changement de statut' : 'خطأ في تغيير الحالة' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DatabaseService.updateWebsiteContacts(contacts);
      setNotification({ type: 'success', message: lang === 'fr' ? 'Contacts enregistrés avec succès!' : 'تم حفظ جهات الاتصال بنجاح!' });
      setTimeout(() => setNotification(null), 4000);
    } catch (error: any) {
      console.error('Error saving contacts:', error);
      setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors de la sauvegarde des contacts' : 'خطأ في حفظ جهات الاتصال' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure settings are properly prepared for saving
      const settingsToSave = {
        name: settings.name || '',
        description: settings.description || '',
        logo: settings.logo || '',
      };
      
      await DatabaseService.updateWebsiteSettings(settingsToSave);
      
      // Reload settings after save to confirm
      const updatedSettings = await DatabaseService.getWebsiteSettings();
      setSettings(updatedSettings);
      
      setNotification({ type: 'success', message: lang === 'fr' ? 'Paramètres enregistrés avec succès!' : 'تم حفظ الإعدادات بنجاح!' });
      setTimeout(() => setNotification(null), 4000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      if (error.message?.includes('JWT') || error.message?.includes('auth') || error.code === 'PGRST301') {
        setNotification({ type: 'error', message: lang === 'fr' ? 'Session expirée. Veuillez vous reconnecter.' : 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.' });
        setTimeout(() => setNotification(null), 4000);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors de la sauvegarde' : 'خطأ في الحفظ' });
        setTimeout(() => setNotification(null), 4000);
      }
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContacts(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setNotification({ type: 'error', message: lang === 'fr' ? 'Veuillez sélectionner une image valide' : 'يرجى تحديد صورة صحيحة' });
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({ type: 'error', message: lang === 'fr' ? 'La taille du fichier ne doit pas dépasser 5MB' : 'حجم الملف لا يجب أن يتجاوز 5MB' });
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setSettings(prev => ({
          ...prev,
          logo: imageData,
        }));
        
        // Auto-save after logo upload
        const settingsToSave = {
          name: settings.name || '',
          description: settings.description || '',
          logo: imageData,
        };
        
        DatabaseService.updateWebsiteSettings(settingsToSave).then(() => {
          setNotification({ type: 'success', message: lang === 'fr' ? 'Logo enregistré avec succès!' : 'تم حفظ الشعار بنجاح!' });
          setTimeout(() => setNotification(null), 3000);
        }).catch(error => {
          console.error('Error auto-saving logo:', error);
          setNotification({ type: 'error', message: lang === 'fr' ? 'Erreur lors de la sauvegarde du logo' : 'خطأ في حفظ الشعار' });
          setTimeout(() => setNotification(null), 4000);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-saas-bg via-saas-bg-light to-saas-bg p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black uppercase tracking-tighter text-saas-text-main mb-2 flex items-center gap-3">
            🌐 {{fr: 'Gestion du Site Web', ar: 'إدارة الموقع الإلكتروني'}[lang]}
          </h1>
          <p className="text-saas-text-muted text-sm font-bold uppercase tracking-widest">
            {{fr: 'Gérez les offres, les contacts et les paramètres de votre site', ar: 'إدارة العروض والجهات الاتصال وإعدادات موقعك'}[lang]}
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="text-red-500">⚠️</div>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            {error.includes('Session expirée') && (
              <button
                onClick={() => window.location.reload()}
                className="btn-saas-primary text-sm px-4 py-2"
              >
                {lang === 'fr' ? 'Se reconnecter' : 'إعادة الاتصال'}
              </button>
            )}
          </motion.div>
        )}

        {/* Notification Display */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 border rounded-2xl p-4 flex items-center justify-between ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={notification.type === 'success' ? 'text-green-500' : 'text-red-500'}>
                  {notification.type === 'success' ? '✅' : '❌'}
                </div>
                <p className={`font-medium ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {notification.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-primary-via mx-auto mb-4"></div>
              <p className="text-saas-text-muted font-bold">
                {{fr: 'Chargement des données...', ar: 'جاري تحميل البيانات...'}[lang]}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <button
                onClick={() => setActiveTab('offers')}
                className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === 'offers'
                    ? 'bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white shadow-lg'
                    : 'bg-white border-2 border-saas-border text-saas-text-main hover:border-saas-primary-via'
                }`}
              >
                🎁 {{fr: 'Offres', ar: 'العروض'}[lang]}
              </button>
              <button
                onClick={() => setActiveTab('special')}
                className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === 'special'
                    ? 'bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white shadow-lg'
                    : 'bg-white border-2 border-saas-border text-saas-text-main hover:border-saas-primary-via'
                }`}
              >
                ⭐ {{fr: 'Spéciales', ar: 'خاصة'}[lang]}
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === 'contacts'
                    ? 'bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white shadow-lg'
                    : 'bg-white border-2 border-saas-border text-saas-text-main hover:border-saas-primary-via'
                }`}
              >
                📞 {{fr: 'Contacts', ar: 'جهات الاتصال'}[lang]}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  activeTab === 'settings'
                    ? 'bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white shadow-lg'
                    : 'bg-white border-2 border-saas-border text-saas-text-main hover:border-saas-primary-via'
                }`}
              >
                ⚙️ {{fr: 'Paramètres', ar: 'المعاملات'}[lang]}
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
          {/* OFFERS TAB */}
          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header with Add Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-saas-text-main flex items-center gap-3">
                  🎁 {{fr: 'Offres de Voitures', ar: 'عروض السيارات'}[lang]}
                </h2>
                <button
                  onClick={() => {
                    setEditingOffer(null);
                    setSelectedCarOffer(null);
                    setOfferPrice('');
                    setOfferNote('');
                    setOfferSearch('');
                    setShowOfferModal(true);
                  }}
                  className="btn-saas-primary px-6 py-3"
                >
                  ➕ {{fr: 'Nouvelle offre', ar: 'عرض جديد'}[lang]}
                </button>
              </div>

              {/* Offers Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-lg border border-saas-border overflow-hidden hover:shadow-xl transition-shadow group"
                  >
                    {/* Car Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={offer.car.images[0]}
                        alt={`${offer.car.brand} ${offer.car.model}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 bg-saas-primary-start/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm shadow-lg">
                        {offer.car.year}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-black text-lg text-saas-text-main">
                          {offer.car.brand} {offer.car.model}
                        </h3>
                        <p className="text-sm text-saas-text-muted">{offer.car.registration}</p>
                      </div>

                      <div className="bg-saas-bg p-3 rounded-lg">
                        <p className="text-xs text-saas-text-muted">💰 {{fr: 'Prix', ar: 'السعر'}[lang]}</p>
                        <p className="font-black text-xl text-saas-primary-via">
                          {offer.price.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}
                        </p>
                      </div>

                      {offer.note && (
                        <div className="text-xs text-saas-text-muted">
                          <p className="font-bold">📝 {{fr: 'Note', ar: 'ملاحظة'}[lang]}</p>
                          <p>{offer.note}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-saas-border">
                        <button
                          onClick={() => handleEditOffer(offer)}
                          className="flex-1 btn-saas-secondary py-2 px-3 flex items-center justify-center gap-2"
                        >
                          <Edit2 size={16} /> {{fr: 'Éditer', ar: 'تحرير'}[lang]}
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} /> {{fr: 'Supprimer', ar: 'حذف'}[lang]}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add/Edit Offer Modal */}
              <AnimatePresence>
                {showOfferModal && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-saas-border"
                    >
                      <div className="p-8 border-b border-saas-border flex items-center justify-between bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                            {editingOffer ? '✏️ Modifier l\'offre' : '🎁 Nouvelle offre'}
                          </h2>
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                            {lang === 'fr' ? 'Gestion des offres de véhicules' : 'إدارة عروض المركبات'}
                          </p>
                        </div>
                        <button onClick={() => setShowOfferModal(false)} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-saas-bg">
                        {/* Sélection de Voiture */}
                        <section className="space-y-6">
                          <h3 className="text-xs font-black text-saas-primary-via flex items-center gap-3 uppercase tracking-[0.2em]">
                            <span className="p-2 bg-saas-primary-via/10 rounded-lg">🚗</span>
                            Sélection de Voiture
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="label-saas">
                                {lang === 'fr' ? 'Rechercher une voiture' : 'البحث عن مركبة'}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={offerSearch}
                                  onChange={e => handleOfferSearch(e.target.value)}
                                  placeholder={lang === 'fr' ? 'Marque, modèle, immatriculation...' : 'الماركة، الموديل، رقم التسجيل...'}
                                  className="input-saas"
                                  autoComplete="off"
                                />
                                {filteredCars.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 bg-white border border-saas-border rounded-lg mt-1 max-h-48 overflow-y-auto z-50 shadow-lg">
                                    {filteredCars.map(car => (
                                      <button
                                        key={car.id}
                                        onClick={() => handleSelectCarOffer(car)}
                                        className="w-full text-left p-4 hover:bg-saas-bg transition-colors border-b border-saas-border last:border-b-0"
                                      >
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={car.images[0]}
                                            alt={`${car.brand} ${car.model}`}
                                            className="w-12 h-12 rounded-lg object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div>
                                            <p className="font-bold">{car.brand} {car.model}</p>
                                            <p className="text-xs text-saas-text-muted">{car.registration} • {car.year} • {car.priceDay.toLocaleString()} DZD/jour</p>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedCarOffer && (
                              <div className="bg-white p-4 rounded-2xl border border-saas-border">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={selectedCarOffer.images[0]}
                                    alt={`${selectedCarOffer.brand} ${selectedCarOffer.model}`}
                                    className="w-16 h-16 rounded-xl object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h4 className="font-black text-lg">{selectedCarOffer.brand} {selectedCarOffer.model}</h4>
                                    <p className="text-sm text-saas-text-muted">{selectedCarOffer.registration}</p>
                                    <p className="text-xs text-saas-primary-via font-bold">{selectedCarOffer.priceDay.toLocaleString()} DZD/jour</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>

                        {/* Configuration de l'Offre */}
                        <section className="space-y-6">
                          <h3 className="text-xs font-black text-saas-primary-via flex items-center gap-3 uppercase tracking-[0.2em]">
                            <span className="p-2 bg-saas-primary-via/10 rounded-lg">💰</span>
                            Configuration de l'Offre
                          </h3>
                          <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                              <label className="label-saas">
                                {lang === 'fr' ? 'Prix de l\'offre (DZD)' : 'سعر العرض (دج)'}
                              </label>
                              <input
                                type="number"
                                value={offerPrice}
                                onChange={e => setOfferPrice(e.target.value)}
                                placeholder="0"
                                className="input-saas"
                                min="0"
                              />
                              {offerPrice && selectedCarOffer && (
                                <p className="text-xs text-saas-text-muted">
                                  {lang === 'fr' ? 'Prix normal' : 'السعر العادي'}: {selectedCarOffer.priceDay.toLocaleString()} DZD/jour
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="label-saas">
                                {lang === 'fr' ? 'Note (optionnel)' : 'ملاحظة (اختياري)'}
                              </label>
                              <textarea
                                value={offerNote}
                                onChange={e => setOfferNote(e.target.value)}
                                placeholder={lang === 'fr' ? 'Ajouter une note pour cette offre...' : 'أضف ملاحظة لهذا العرض...'}
                                rows={3}
                                className="input-saas resize-none"
                              />
                            </div>
                          </div>
                        </section>
                      </div>

                      <div className="p-8 border-t border-saas-border flex items-center justify-between gap-4 bg-white">
                        <div>
                          {editingOffer && (
                            <button
                              onClick={() => handleDeleteOffer(editingOffer.id)}
                              className="btn-saas-danger px-6"
                            >
                              {lang === 'fr' ? 'Supprimer' : 'حذف'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setShowOfferModal(false)}
                            className="btn-saas-outline px-8"
                          >
                            {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                          </button>
                          <button
                            onClick={handleAddOffer}
                            disabled={!selectedCarOffer || !offerPrice}
                            className="btn-saas-primary px-12"
                          >
                            {editingOffer ? (lang === 'fr' ? 'Modifier l\'offre' : 'تعديل العرض') : (lang === 'fr' ? 'Créer l\'offre' : 'إنشاء العرض')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* SPECIAL OFFERS TAB */}
          {activeTab === 'special' && (
            <motion.div
              key="special"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header with Add Button */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-saas-text-main flex items-center gap-3">
                  ⭐ {{fr: 'Offres Spéciales', ar: 'عروض خاصة'}[lang]}
                </h2>
                <button
                  onClick={() => {
                    setEditingSpecial(null);
                    setSelectedCarSpecial(null);
                    setSpecialOldPrice('');
                    setSpecialNewPrice('');
                    setSpecialNote('');
                    setSpecialSearch('');
                    setShowSpecialModal(true);
                  }}
                  className="btn-saas-primary px-6 py-3"
                >
                  ➕ {{fr: 'Nouvelle spéciale', ar: 'عرض جديد'}[lang]}
                </button>
              </div>

              {/* Special Offers Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specialOffers.map(special => (
                  <motion.div
                    key={special.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-lg border border-saas-border overflow-hidden hover:shadow-xl transition-shadow relative group"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-md z-10">
                      {special.isActive ? (
                        <>
                          <CheckCircle size={16} className="text-green-500" />
                          <span className="text-xs font-bold text-green-500">
                            {{fr: 'Active', ar: 'نشط'}[lang]}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle size={16} className="text-red-500" />
                          <span className="text-xs font-bold text-red-500">
                            {{fr: 'Inactive', ar: 'غير نشط'}[lang]}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Car Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={special.car.images[0]}
                        alt={`${special.car.brand} ${special.car.model}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 bg-saas-primary-start/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm shadow-lg">
                        {special.car.year}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-black text-lg text-saas-text-main">
                          {special.car.brand} {special.car.model}
                        </h3>
                        <p className="text-sm text-saas-text-muted">{special.car.registration}</p>
                      </div>

                      {/* Price Comparison */}
                      <div className="bg-saas-bg p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-saas-text-muted line-through">
                            💰 {special.oldPrice.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}
                          </p>
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{Math.round((1 - special.newPrice / special.oldPrice) * 100)}%
                          </span>
                        </div>
                        <p className="font-black text-2xl text-green-600">
                          {special.newPrice.toLocaleString()} {{fr: 'DA', ar: 'د.ج'}[lang]}
                        </p>
                      </div>

                      {special.note && (
                        <div className="text-xs text-saas-text-muted">
                          <p className="font-bold">📝 {{fr: 'Note', ar: 'ملاحظة'}[lang]}</p>
                          <p>{special.note}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-saas-border flex-wrap">
                        <button
                          onClick={() => handleToggleSpecialStatus(special.id)}
                          className={`flex-1 font-bold py-2 px-3 rounded-lg transition-colors text-sm ${
                            special.isActive
                              ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                        >
                          {{fr: special.isActive ? '⏸️ Désactiver' : '▶️ Activer', ar: special.isActive ? '⏸️ تعطيل' : '▶️ تفعيل'}[lang]}
                        </button>
                        <button
                          onClick={() => handleEditSpecial(special)}
                          className="flex-1 btn-saas-secondary py-2 px-3 text-sm"
                        >
                          ✏️ {{fr: 'Éditer', ar: 'تحرير'}[lang]}
                        </button>
                        <button
                          onClick={() => handleDeleteSpecial(special.id)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          🗑️ {{fr: 'Supprimer', ar: 'حذف'}[lang]}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add/Edit Special Modal */}
              <AnimatePresence>
                {showSpecialModal && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-saas-border"
                    >
                      <div className="p-8 border-b border-saas-border flex items-center justify-between bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end text-white">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                            {editingSpecial ? '✏️ Modifier l\'offre spéciale' : '⭐ Nouvelle offre spéciale'}
                          </h2>
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-1">
                            {lang === 'fr' ? 'Gestion des offres spéciales' : 'إدارة العروض الخاصة'}
                          </p>
                        </div>
                        <button onClick={() => setShowSpecialModal(false)} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
                          <X size={24} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-saas-bg">
                        {/* Sélection de Voiture */}
                        <section className="space-y-6">
                          <h3 className="text-xs font-black text-saas-primary-via flex items-center gap-3 uppercase tracking-[0.2em]">
                            <span className="p-2 bg-saas-primary-via/10 rounded-lg">🚗</span>
                            Sélection de Voiture
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="label-saas">
                                {lang === 'fr' ? 'Rechercher une voiture' : 'البحث عن مركبة'}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={specialSearch}
                                  onChange={e => handleSpecialSearch(e.target.value)}
                                  placeholder={lang === 'fr' ? 'Marque, modèle, immatriculation...' : 'الماركة، الموديل، رقم التسجيل...'}
                                  className="input-saas"
                                  autoComplete="off"
                                />
                                {filteredCars.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 bg-white border border-saas-border rounded-lg mt-1 max-h-48 overflow-y-auto z-50 shadow-lg">
                                    {filteredCars.map(car => (
                                      <button
                                        key={car.id}
                                        onClick={() => handleSelectCarSpecial(car)}
                                        className="w-full text-left p-4 hover:bg-saas-bg transition-colors border-b border-saas-border last:border-b-0"
                                      >
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={car.images[0]}
                                            alt={`${car.brand} ${car.model}`}
                                            className="w-12 h-12 rounded-lg object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div>
                                            <p className="font-bold">{car.brand} {car.model}</p>
                                            <p className="text-xs text-saas-text-muted">{car.registration} • {car.year} • {car.priceDay.toLocaleString()} DZD/jour</p>
                                          </div>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {selectedCarSpecial && (
                              <div className="bg-white p-4 rounded-2xl border border-saas-border">
                                <div className="flex items-center gap-4">
                                  <img
                                    src={selectedCarSpecial.images[0]}
                                    alt={`${selectedCarSpecial.brand} ${selectedCarSpecial.model}`}
                                    className="w-16 h-16 rounded-xl object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <h4 className="font-black text-lg">{selectedCarSpecial.brand} {selectedCarSpecial.model}</h4>
                                    <p className="text-sm text-saas-text-muted">{selectedCarSpecial.registration}</p>
                                    <p className="text-xs text-saas-primary-via font-bold">{selectedCarSpecial.priceDay.toLocaleString()} DZD/jour</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>

                        {/* Configuration des Prix */}
                        <section className="space-y-6">
                          <h3 className="text-xs font-black text-saas-primary-via flex items-center gap-3 uppercase tracking-[0.2em]">
                            <span className="p-2 bg-saas-primary-via/10 rounded-lg">💰</span>
                            Configuration des Prix
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="label-saas">
                                {lang === 'fr' ? 'Prix original (DZD)' : 'السعر الأصلي (دج)'}
                              </label>
                              <input
                                type="number"
                                value={specialOldPrice}
                                onChange={e => setSpecialOldPrice(e.target.value)}
                                placeholder="0"
                                className="input-saas"
                                min="0"
                              />
                              {selectedCarSpecial && (
                                <p className="text-xs text-saas-text-muted">
                                  {lang === 'fr' ? 'Prix normal suggéré' : 'السعر العادي المقترح'}: {selectedCarSpecial.priceDay.toLocaleString()} DZD/jour
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="label-saas">
                                {lang === 'fr' ? 'Prix spécial (DZD)' : 'السعر الخاص (دج)'}
                              </label>
                              <input
                                type="number"
                                value={specialNewPrice}
                                onChange={e => setSpecialNewPrice(e.target.value)}
                                placeholder="0"
                                className="input-saas"
                                min="0"
                              />
                              {specialOldPrice && specialNewPrice && parseFloat(specialNewPrice) < parseFloat(specialOldPrice) && (
                                <p className="text-xs text-green-600 font-bold">
                                  💚 {lang === 'fr' ? 'Réduction' : 'الخصم'}: {Math.round((1 - parseFloat(specialNewPrice) / parseFloat(specialOldPrice)) * 100)}%
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="label-saas">
                              {lang === 'fr' ? 'Note (optionnel)' : 'ملاحظة (اختياري)'}
                            </label>
                            <textarea
                              value={specialNote}
                              onChange={e => setSpecialNote(e.target.value)}
                              placeholder={lang === 'fr' ? 'Ajouter une note pour cette offre spéciale...' : 'أضف ملاحظة لهذا العرض الخاص...'}
                              rows={3}
                              className="input-saas resize-none"
                            />
                          </div>
                        </section>
                      </div>

                      <div className="p-8 border-t border-saas-border flex items-center justify-between gap-4 bg-white">
                        <div>
                          {editingSpecial && (
                            <button
                              onClick={() => handleDeleteSpecial(editingSpecial.id)}
                              className="btn-saas-danger px-6"
                            >
                              {lang === 'fr' ? 'Supprimer' : 'حذف'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setShowSpecialModal(false)}
                            className="btn-saas-outline px-8"
                          >
                            {lang === 'fr' ? 'Annuler' : 'إلغاء'}
                          </button>
                          <button
                            onClick={handleAddSpecial}
                            disabled={!selectedCarSpecial || !specialOldPrice || !specialNewPrice}
                            className="btn-saas-primary px-12"
                          >
                            {editingSpecial ? (lang === 'fr' ? 'Modifier l\'offre' : 'تعديل العرض') : (lang === 'fr' ? 'Créer l\'offre spéciale' : 'إنشاء العرض الخاص')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* CONTACTS TAB */}
          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[2rem] shadow-lg border border-saas-border overflow-hidden"
            >
              <div className="p-6 border-b border-saas-border bg-linear-to-r from-blue-500 via-blue-600 to-blue-700 text-white">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  📞 {{fr: 'Paramètres de Contact', ar: 'إعدادات جهات الاتصال'}[lang]}
                </h2>
              </div>

              <form onSubmit={handleSaveContacts} className="p-8 space-y-6">
                {/* Facebook */}
                <div className="space-y-2">
                  <label className="label-saas">👍 Facebook</label>
                  <input
                    type="text"
                    name="facebook"
                    value={contacts.facebook || ''}
                    onChange={handleContactChange}
                    placeholder="https://facebook.com/..."
                    className="input-saas"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-2">
                  <label className="label-saas">📷 Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={contacts.instagram || ''}
                    onChange={handleContactChange}
                    placeholder="@username"
                    className="input-saas"
                  />
                </div>

                {/* TikTok */}
                <div className="space-y-2">
                  <label className="label-saas">🎵 TikTok</label>
                  <input
                    type="text"
                    name="tiktok"
                    value={contacts.tiktok || ''}
                    onChange={handleContactChange}
                    placeholder="@username"
                    className="input-saas"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <label className="label-saas">💬 WhatsApp</label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={contacts.whatsapp || ''}
                    onChange={handleContactChange}
                    placeholder="+213 5 1234 5678"
                    className="input-saas"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="label-saas">☎️ {{fr: 'Téléphone', ar: 'الهاتف'}[lang]}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={contacts.phone || ''}
                    onChange={handleContactChange}
                    placeholder="+213 5 1234 5678"
                    className="input-saas"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="label-saas">📧 {{fr: 'E-mail', ar: 'البريد الإلكتروني'}[lang]}</label>
                  <input
                    type="email"
                    name="email"
                    value={contacts.email || ''}
                    onChange={handleContactChange}
                    placeholder="contact@luxdrive.com"
                    className="input-saas"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="label-saas">📍 {{fr: 'Adresse', ar: 'العنوان'}[lang]}</label>
                  <input
                    type="text"
                    name="address"
                    value={contacts.address || ''}
                    onChange={handleContactChange}
                    placeholder="Alger, Algeria"
                    className="input-saas"
                  />
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-6 border-t border-saas-border">
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 rounded-lg font-bold text-sm bg-white border-2 border-saas-border hover:bg-saas-bg-light transition-colors"
                  >
                    {{fr: 'Annuler', ar: 'إلغاء'}[lang]}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-saas-primary py-3"
                  >
                    {{fr: 'Enregistrer les contacts', ar: 'حفظ جهات الاتصال'}[lang]}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[2rem] shadow-lg border border-saas-border overflow-hidden"
            >
              <div className="p-6 border-b border-saas-border bg-linear-to-r from-purple-500 via-purple-600 to-purple-700 text-white">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  ⚙️ {{fr: 'Paramètres du Site', ar: 'إعدادات الموقع'}[lang]}
                </h2>
              </div>

              <form onSubmit={handleSaveSettings} className="p-8 space-y-6">
                {/* Website Name */}
                <div className="space-y-2">
                  <label className="label-saas">🌐 {{fr: 'Nom du site web', ar: 'اسم الموقع'}[lang]}</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={e => setSettings({ ...settings, name: e.target.value })}
                    className="input-saas"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="label-saas">📝 {{fr: 'Description', ar: 'الوصف'}[lang]}</label>
                  <textarea
                    value={settings.description}
                    onChange={e => setSettings({ ...settings, description: e.target.value })}
                    rows={4}
                    className="input-saas resize-none"
                  />
                </div>

                {/* Logo */}
                <div className="space-y-4">
                  <label className="label-saas">🖼️ {{fr: 'Logo du site', ar: 'شعار الموقع'}[lang]}</label>
                  <div className="flex gap-6 items-start">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-saas-border bg-saas-bg flex items-center justify-center flex-shrink-0">
                      {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-4xl">🌐</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <span className="btn-saas-primary px-6 py-3 inline-block cursor-pointer">
                          {{fr: 'Changer le logo', ar: 'تغيير الشعار'}[lang]}
                        </span>
                      </label>
                      <p className="text-xs text-saas-text-muted mt-2">
                        {{fr: 'Format recommandé: PNG ou JPG (500x500px)', ar: 'الصيغة الموصى بها: PNG أو JPG (500x500px)'}[lang]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-6 border-t border-saas-border">
                  <button
                    type="button"
                    className="flex-1 py-3 px-4 rounded-lg font-bold text-sm bg-white border-2 border-saas-border hover:bg-saas-bg-light transition-colors"
                  >
                    {{fr: 'Annuler', ar: 'إلغاء'}[lang]}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-saas-primary py-3"
                  >
                    {{fr: 'Enregistrer les paramètres', ar: 'حفظ الإعدادات'}[lang]}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </div>
    </div>
  );
};
