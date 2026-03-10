import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { CarsPage } from './components/CarsPage';
import { AgenciesPage } from './components/AgenciesPage';
import { ClientsPage } from './components/ClientsPage';
import { EquipePage } from './components/EquipePage';
import { ExpensesPage } from './components/ExpensesPage';
import { ConfigPage } from './components/ConfigPage';
import { WebsiteManagementPage } from './components/WebsiteManagementPage';
import { WebsiteOrders } from './components/WebsiteOrders';
import { PlannerPage } from './components/PlannerPage';
import { Website } from './components/Website';
import { DashboardPage } from './components/DashboardPage';
import ReportsPage from './components/ReportsPage';
import { Language, User, UserRole, Car, Agency } from './types';
import { supabase, supabaseConfigured } from './supabase';
import { SIDEBAR_ITEMS } from './constants';
import { DatabaseService } from './services/DatabaseService';

export default function App() {
  const location = useLocation();
  const [lang, setLang] = useState<Language>('fr');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cars, setCars] = useState<Car[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [specialOffers, setSpecialOffers] = useState<any[]>([]);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);
  const isWebsiteMode = location.pathname === '/website';

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Load cars from database when user is authenticated
  useEffect(() => {
    const loadCars = async () => {
      if (!user) {
        // Use mock data when not authenticated
        setCars(mockCars);
        return;
      }

      try {
        const dbCars = await DatabaseService.getCars();
        setCars(dbCars.length > 0 ? dbCars : mockCars);
      } catch (error) {
        console.error('Failed to load cars from database:', error);
        // Fallback to mock data if database load fails
        setCars(mockCars);
      }
    };

    loadCars();
  }, [user]); // Depend on user state

  // Load website data from database
  useEffect(() => {
    const loadWebsiteData = async () => {
      try {
        const [dbOffers, dbSpecialOffers, dbContactInfo, dbWebsiteSettings] = await Promise.all([
          DatabaseService.getOffers(),
          DatabaseService.getSpecialOffers(),
          DatabaseService.getWebsiteContacts(),
          DatabaseService.getWebsiteSettings(),
        ]);

        setOffers(dbOffers.length > 0 ? dbOffers : mockOffers);
        setSpecialOffers(dbSpecialOffers.length > 0 ? dbSpecialOffers : mockSpecialOffers);
        setContactInfo(dbContactInfo || mockContactInfo);
        setWebsiteSettings(dbWebsiteSettings || mockWebsiteSettings);
      } catch (error) {
        console.error('Failed to load website data from database:', error);
        // Fallback to mock data if database load fails
        setOffers(mockOffers);
        setSpecialOffers(mockSpecialOffers);
        setContactInfo(mockContactInfo);
        setWebsiteSettings(mockWebsiteSettings);
      }
    };

    loadWebsiteData();
  }, []); // Load once on mount

  // Define mock data immediately (used as fallback)
  const mockCars: Car[] = [
    {
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
    {
      id: '2',
      brand: 'Mercedes',
      model: 'E-Class',
      registration: 'AB-456-EF',
      year: 2022,
      color: 'Noir',
      vin: 'VIN789012',
      energy: 'Essence',
      transmission: 'Automatique',
      seats: 5,
      doors: 4,
      priceDay: 12000,
      priceWeek: 70000,
      priceMonth: 200000,
      deposit: 100000,
      images: ['https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=400&fit=crop'],
      mileage: 23000,
    },
    {
      id: '3',
      brand: 'BMW',
      model: 'X5',
      registration: 'AB-789-GH',
      year: 2023,
      color: 'Gris',
      vin: 'VIN345678',
      energy: 'Essence',
      transmission: 'Automatique',
      seats: 7,
      doors: 4,
      priceDay: 15000,
      priceWeek: 85000,
      priceMonth: 250000,
      deposit: 125000,
      images: ['https://images.unsplash.com/photo-1605559424843-9e4c3ff86981?w=500&h=400&fit=crop'],
      mileage: 5000,
    },
  ];

  const mockAgencies: Agency[] = [
    {
      id: '1',
      name: 'Luxdrive Alger Centre',
      address: 'Boulevard Didouche Mourad',
      city: 'Alger',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Luxdrive Oran',
      address: 'Boulevard Khémisti',
      city: 'Oran',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Luxdrive Annaba',
      address: 'Rue Larbi Ben Mhidi',
      city: 'Annaba',
      createdAt: new Date().toISOString(),
    },
  ];

  const mockOffers = mockCars.map((car, i) => ({
    id: `offer-${i}`,
    carId: car.id,
    car,
    price: car.priceDay,
    note: i === 0 ? 'Location journalière premium' : '',
    createdAt: new Date().toISOString(),
  }));

  const mockSpecialOffers = mockCars.slice(0, 2).map((car, i) => ({
    id: `special-${i}`,
    carId: car.id,
    car,
    oldPrice: car.priceDay * 1.2,
    newPrice: car.priceDay,
    note: 'Promotion limitée',
    isActive: true,
    createdAt: new Date().toISOString(),
  }));

  const mockContactInfo = {
    facebook: 'https://facebook.com/luxdrive',
    instagram: '@luxdrive_dz',
    tiktok: '@luxdrive',
    whatsapp: '+213 5 1234 5678',
    phone: '+213 5 1234 5678',
    address: 'Alger, Algeria',
    email: 'contact@luxdrive.com',
  };

  const mockWebsiteSettings = {
    name: 'Luxdrive Premium',
    description: 'Votre partenaire de confiance en location de véhicules',
    logo: 'https://images.unsplash.com/photo-1560958089-b8a63dd8aa8b?w=200&h=200&fit=crop',
  };

  const handleLogin = (userObj: User) => {
    setUser(userObj);
  };

  // try to restore session on mount
  useEffect(() => {
    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const u = data.session.user;
        const role = (u.user_metadata?.role as UserRole) || 'worker';

        // Try to get worker data first
        try {
          const { data: workerData } = await supabase
            .from('workers')
            .select('full_name, profile_photo, type')
            .eq('email', u.email)
            .single();

          if (workerData) {
            setUser({
              name: workerData.full_name,
              email: u.email || '',
              role: workerData.type as UserRole,
              avatar: workerData.profile_photo || ''
            });
            return;
          }
        } catch (error) {
          console.log('User not found in workers table, checking profiles table');
        }

        // Fallback to profiles table for admin users
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', u.id)
            .single();

          if (profileData) {
            setUser({
              name: profileData.username || u.email || '',
              email: u.email || '',
              role: profileData.role as UserRole,
              avatar: ''
            });
            return;
          }
        } catch (error) {
          console.log('User not found in profiles table');
        }

        // Final fallback
        const name = (u.user_metadata?.username as string) || u.email || '';
        setUser({ name, email: u.email || '', role, avatar: '' });
      }
    };
    restore();

    // listen for auth changes (optional)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const role = (u.user_metadata?.role as UserRole) || 'worker';
        const name = (u.user_metadata?.username as string) || u.email || '';
        setUser({ name, email: u.email || '', role, avatar: '' });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Show website directly without login
  if (isWebsiteMode) {
    return (
      <Website 
        lang={lang} 
        onLangChange={setLang}
        cars={cars.length > 0 ? cars : mockCars}
        agencies={mockAgencies}
        offers={offers}
        specialOffers={specialOffers}
        contactInfo={contactInfo}
        websiteSettings={websiteSettings}
      />
    );
  }

  if (!user) {
    return <Login lang={lang} onLogin={handleLogin} />;
  }

  const activeItem = SIDEBAR_ITEMS.find(item => item.id === activeTab) || SIDEBAR_ITEMS[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage lang={lang} />;
      case 'planner':
        return <PlannerPage lang={lang} />;
      case 'vehicles':
        return <CarsPage lang={lang} />;
      case 'agencies':
        return <AgenciesPage lang={lang} />;
      case 'clients':
        return <ClientsPage lang={lang} />;
      case 'team':
        return <EquipePage lang={lang} />;
      case 'expenses':
        return <ExpensesPage lang={lang} cars={cars} />;
      case 'web-mgmt':
        return <WebsiteManagementPage lang={lang} cars={cars.length > 0 ? cars : mockCars} />;
      case 'web-orders':
        return <WebsiteOrders lang={lang} />;
      case 'reports':
        return <ReportsPage lang={lang} />;
      case 'config':
        return user ? <ConfigPage lang={lang} user={user} /> : null;
      default:
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-black text-saas-text-main uppercase tracking-tighter">
                {activeItem.icon} {activeItem.label[lang]}
              </h2>
              <p className="text-saas-text-muted font-bold uppercase text-[10px] tracking-widest">
                {lang === 'fr' 
                  ? `Interface pour ${activeItem.label.fr}` 
                  : `واجهة لـ ${activeItem.label.ar}`}
              </p>
            </div>

            <div className="glass-card p-12 min-h-[500px] flex items-center justify-center border-dashed border-saas-border bg-white group">
              <div className="text-center space-y-6">
                <div className="text-8xl opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-110">
                  {activeItem.icon}
                </div>
                <div className="space-y-3">
                  <p className="text-saas-text-main font-black text-2xl uppercase tracking-tighter">
                    {lang === 'fr' ? 'Contenu en développement' : 'المحتوى قيد التطوير'}
                  </p>
                  <p className="text-saas-text-muted text-sm font-medium max-w-md mx-auto">
                    {lang === 'fr' 
                      ? 'Cette section est en cours de modernisation pour correspondre à votre nouveau standard SaaS.' 
                      : 'هذا القسم قيد التحديث ليتناسب مع معايير SaaS الجديدة الخاصة بك.'}
                  </p>
                </div>
                <button className="btn-saas-primary px-8 py-3">
                  {lang === 'fr' ? 'En savoir plus' : 'معرفة المزيد'}
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex min-h-screen bg-saas-bg ${lang === 'ar' ? 'font-arabic' : ''}`}>
      {!supabaseConfigured && (
        <div className="fixed inset-0 bg-yellow-100 text-yellow-900 flex items-center justify-center z-50 p-4 text-center">
          <strong>Warning:</strong> Supabase variables are missing. Set
          <code className="mx-1">VITE_SUPABASE_URL</code> and
          <code className="mx-1">VITE_SUPABASE_ANON_KEY</code> in your environment.
        </div>
      )}
      <Sidebar 
        lang={lang} 
        isVisible={isSidebarVisible} 
        setIsVisible={setIsSidebarVisible}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar 
          user={user} 
          lang={lang} 
          setLang={setLang} 
          toggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)} 
        />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarVisible(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
