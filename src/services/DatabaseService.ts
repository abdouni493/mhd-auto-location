import { supabase } from '../supabase';
import { Car, Client, Agency, Worker, WorkerAdvance, WorkerAbsence, WorkerPayment, StoreExpense, VehicleExpense, MaintenanceAlert, WebsiteOrder, ReservationDetails, Offer, SpecialOffer, ContactInfo, WebsiteSettings } from '../types';

// Generic database service functions
export class DatabaseService {
  // Cars
  static async getCars(): Promise<Car[]> {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database fields to Car interface
    return (data || []).map(dbCar => ({
      id: dbCar.id || '',
      brand: dbCar.brand,
      model: dbCar.model,
      registration: dbCar.plate_number,
      year: dbCar.year,
      color: dbCar.color || 'Premium',
      vin: dbCar.vin || '',
      energy: dbCar.energy || 'Essence',
      transmission: dbCar.transmission || 'Automatique',
      seats: dbCar.seats || 5,
      doors: dbCar.doors || 4,
      priceDay: Math.round(Number(dbCar.price_per_day)),
      priceWeek: Math.round(Number(dbCar.price_week || dbCar.price_per_day * 2)),
      priceMonth: Math.round(Number(dbCar.price_month || dbCar.price_per_day * 4)),
      deposit: Math.round(Number(dbCar.deposit || dbCar.price_per_day * 2)),
      images: dbCar.image_url ? [dbCar.image_url] : ['https://picsum.photos/seed/car/400/300'],
      mileage: dbCar.mileage || 0,
      status: (dbCar.status || 'available') === 'available' ? 'disponible' : dbCar.status,
    }));
  }

  static async getAvailableCars(departureDate?: string, returnDate?: string): Promise<Car[]> {
    // Get all cars with 'disponible' status
    const allCars = await this.getCars();
    const availableStatusCars = allCars.filter(car => car.status === 'disponible' || !car.status);

    // If no date range provided, return all cars with disponible status
    if (!departureDate || !returnDate) {
      return availableStatusCars;
    }

    // Check for date overlaps
    const { data: allReservations, error } = await supabase
      .from('reservations')
      .select('car_id, departure_date, return_date')
      .in('status', ['pending', 'confirmed', 'active']);

    if (error) {
      console.error('Error fetching reservations:', error);
      return availableStatusCars;
    }

    // Filter cars by checking date overlaps
    const departureTime = new Date(departureDate).getTime();
    const returnTime = new Date(returnDate).getTime();

    const availableCars = availableStatusCars.filter(car => {
      // Check if this car has any overlapping reservations
      const carReservations = allReservations?.filter(r => r.car_id === car.id) || [];
      
      return !carReservations.some(reservation => {
        const resStart = new Date(reservation.departure_date).getTime();
        const resEnd = new Date(reservation.return_date).getTime();
        
        // Check for overlap: current reservation overlaps if it starts before our end and ends after our start
        return departureTime < resEnd && returnTime > resStart;
      });
    });

    return availableCars;
  }

  static async getReservedCarsForPeriod(departureDate: string, returnDate: string): Promise<Array<{
    id: string;
    carId: string;
    brand: string;
    model: string;
    image: string;
    departureDate: string;
    returnDate: string;
    clientName: string;
  }>> {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        id,
        car_id,
        departure_date,
        return_date,
        client:clients(first_name, last_name),
        car:cars(brand, model, image_url)
      `)
      .in('status', ['pending', 'confirmed', 'active']);

    if (error) {
      console.error('Error fetching reservations:', error);
      return [];
    }

    const departureTime = new Date(departureDate).getTime();
    const returnTime = new Date(returnDate).getTime();

    // Filter reservations that overlap with the provided date range
    const overlappingReservations = (reservations || []).filter(res => {
      const resStart = new Date(res.departure_date).getTime();
      const resEnd = new Date(res.return_date).getTime();
      return departureTime < resEnd && returnTime > resStart;
    });

    return overlappingReservations.map(res => ({
      id: res.id,
      carId: res.car_id,
      brand: res.car?.brand || '',
      model: res.car?.model || '',
      image: res.car?.image_url || 'https://picsum.photos/seed/car/400/300',
      departureDate: res.departure_date,
      returnDate: res.return_date,
      clientName: `${res.client?.first_name || ''} ${res.client?.last_name || ''}`,
    }));
  }

  static async createCar(car: Omit<Car, 'id' | 'created_at'>): Promise<Car> {
    const { data, error } = await supabase
      .from('cars')
      .insert([car])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCar(id: string, updates: Partial<Car>): Promise<Car> {
    const { data, error } = await supabase
      .from('cars')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteCar(id: string): Promise<void> {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Clients
  static async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map snake_case to camelCase
    return (data || []).map(client => ({
      id: client.id,
      firstName: client.first_name,
      lastName: client.last_name,
      phone: client.phone,
      email: client.email,
      dateOfBirth: client.date_of_birth,
      placeOfBirth: client.place_of_birth,
      idCardNumber: client.id_card_number,
      licenseNumber: client.license_number,
      licenseExpirationDate: client.license_expiration_date,
      licenseDeliveryDate: client.license_delivery_date,
      licenseDeliveryPlace: client.license_delivery_place,
      documentType: client.document_type,
      documentNumber: client.document_number,
      documentDeliveryDate: client.document_delivery_date,
      documentExpirationDate: client.document_expiration_date,
      documentDeliveryAddress: client.document_delivery_address,
      wilaya: client.wilaya,
      completeAddress: client.complete_address,
      profilePhoto: client.profile_photo,
      scannedDocuments: client.scanned_documents,
      createdAt: client.created_at,
      agencyId: client.agency_id,
    }));
  }

  static async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    // Map camelCase to snake_case for database
    const dbClient = {
      first_name: client.firstName,
      last_name: client.lastName,
      phone: client.phone,
      email: client.email,
      date_of_birth: client.dateOfBirth || null,
      place_of_birth: client.placeOfBirth,
      id_card_number: client.idCardNumber || null,
      license_number: client.licenseNumber,
      license_expiration_date: client.licenseExpirationDate || null,
      license_delivery_date: client.licenseDeliveryDate || null,
      license_delivery_place: client.licenseDeliveryPlace,
      document_type: client.documentType,
      document_number: client.documentNumber,
      document_delivery_date: client.documentDeliveryDate || null,
      document_expiration_date: client.documentExpirationDate || null,
      document_delivery_address: client.documentDeliveryAddress,
      wilaya: client.wilaya,
      complete_address: client.completeAddress,
      profile_photo: client.profilePhoto,
      scanned_documents: client.scannedDocuments,
      agency_id: client.agencyId,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([dbClient])
      .select()
      .single();

    if (error) throw error;

    // Map back to camelCase for the return
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      email: data.email,
      dateOfBirth: data.date_of_birth,
      placeOfBirth: data.place_of_birth,
      idCardNumber: data.id_card_number,
      licenseNumber: data.license_number,
      licenseExpirationDate: data.license_expiration_date,
      licenseDeliveryDate: data.license_delivery_date,
      licenseDeliveryPlace: data.license_delivery_place,
      documentType: data.document_type,
      documentNumber: data.document_number,
      documentDeliveryDate: data.document_delivery_date,
      documentExpirationDate: data.document_expiration_date,
      documentDeliveryAddress: data.document_delivery_address,
      wilaya: data.wilaya,
      completeAddress: data.complete_address,
      profilePhoto: data.profile_photo,
      scannedDocuments: data.scanned_documents,
      createdAt: data.created_at,
      agencyId: data.agency_id,
    };
  }

  static async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    // Map camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.placeOfBirth !== undefined) dbUpdates.place_of_birth = updates.placeOfBirth;
    if (updates.idCardNumber !== undefined) dbUpdates.id_card_number = updates.idCardNumber;
    if (updates.licenseNumber !== undefined) dbUpdates.license_number = updates.licenseNumber;
    if (updates.licenseExpirationDate !== undefined) dbUpdates.license_expiration_date = updates.licenseExpirationDate;
    if (updates.licenseDeliveryDate !== undefined) dbUpdates.license_delivery_date = updates.licenseDeliveryDate;
    if (updates.licenseDeliveryPlace !== undefined) dbUpdates.license_delivery_place = updates.licenseDeliveryPlace;
    if (updates.documentType !== undefined) dbUpdates.document_type = updates.documentType;
    if (updates.documentNumber !== undefined) dbUpdates.document_number = updates.documentNumber;
    if (updates.documentDeliveryDate !== undefined) dbUpdates.document_delivery_date = updates.documentDeliveryDate;
    if (updates.documentExpirationDate !== undefined) dbUpdates.document_expiration_date = updates.documentExpirationDate;
    if (updates.documentDeliveryAddress !== undefined) dbUpdates.document_delivery_address = updates.documentDeliveryAddress;
    if (updates.wilaya !== undefined) dbUpdates.wilaya = updates.wilaya;
    if (updates.completeAddress !== undefined) dbUpdates.complete_address = updates.completeAddress;
    if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto;
    if (updates.scannedDocuments !== undefined) dbUpdates.scanned_documents = updates.scannedDocuments;
    if (updates.agencyId !== undefined) dbUpdates.agency_id = updates.agencyId;

    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Map back to camelCase for the return
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      email: data.email,
      dateOfBirth: data.date_of_birth,
      placeOfBirth: data.place_of_birth,
      idCardNumber: data.id_card_number,
      licenseNumber: data.license_number,
      licenseExpirationDate: data.license_expiration_date,
      licenseDeliveryDate: data.license_delivery_date,
      licenseDeliveryPlace: data.license_delivery_place,
      documentType: data.document_type,
      documentNumber: data.document_number,
      documentDeliveryDate: data.document_delivery_date,
      documentExpirationDate: data.document_expiration_date,
      documentDeliveryAddress: data.document_delivery_address,
      wilaya: data.wilaya,
      completeAddress: data.complete_address,
      profilePhoto: data.profile_photo,
      scannedDocuments: data.scanned_documents,
      createdAt: data.created_at,
      agencyId: data.agency_id,
    };
  }

  static async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
  // Agencies
  static async getAgencies(): Promise<Agency[]> {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createAgency(agency: Omit<Agency, 'id' | 'created_at'>): Promise<Agency> {
    // ensure an id exists (supabase table does not auto-generate)
    const withId = {
      ...agency,
      id: (agency as any).id || crypto.randomUUID(),
    };

    const { data, error } = await supabase
      .from('agencies')
      .insert([withId])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateAgency(id: string, updates: Partial<Agency>): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteAgency(id: string): Promise<void> {
    const { error } = await supabase
      .from('agencies')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Workers
  static async getWorkers(): Promise<Worker[]> {
    const { data, error } = await supabase
      .from('workers')
      .select(`
        *,
        advances:worker_advances(*),
        absences:worker_absences(*),
        payments:worker_payments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map snake_case to camelCase
    return (data || []).map(worker => ({
      id: worker.id,
      fullName: worker.full_name,
      dateOfBirth: worker.date_of_birth,
      phone: worker.phone,
      email: worker.email,
      address: worker.address,
      profilePhoto: worker.profile_photo,
      type: worker.type,
      paymentType: worker.payment_type,
      baseSalary: worker.base_salary,
      username: worker.username,
      password: worker.password,
      advances: worker.advances || [],
      absences: worker.absences || [],
      payments: worker.payments || [],
      createdAt: worker.created_at,
    }));
  }

  static async createWorker(worker: Omit<Worker, 'id' | 'createdAt' | 'advances' | 'absences' | 'payments'>): Promise<Worker> {
    // Map camelCase to snake_case for database
    const dbWorker = {
      full_name: worker.fullName,
      date_of_birth: worker.dateOfBirth,
      phone: worker.phone,
      email: worker.email,
      address: worker.address,
      profile_photo: worker.profilePhoto,
      type: worker.type,
      payment_type: worker.paymentType,
      base_salary: worker.baseSalary,
      username: worker.username,
      password: worker.password,
    };

    const { data, error } = await supabase
      .from('workers')
      .insert([dbWorker])
      .select()
      .single();

    if (error) throw error;

    // Map back to camelCase for the return
    return {
      id: data.id,
      fullName: data.full_name,
      dateOfBirth: data.date_of_birth,
      phone: data.phone,
      email: data.email,
      address: data.address,
      profilePhoto: data.profile_photo,
      type: data.type,
      paymentType: data.payment_type,
      baseSalary: data.base_salary,
      username: data.username,
      password: data.password,
      advances: [],
      absences: [],
      payments: [],
      createdAt: data.created_at,
    };
  }

  static async updateWorker(id: string, updates: Partial<Omit<Worker, 'advances' | 'absences' | 'payments'>>): Promise<Worker> {
    // Map camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.paymentType !== undefined) dbUpdates.payment_type = updates.paymentType;
    if (updates.baseSalary !== undefined) dbUpdates.base_salary = updates.baseSalary;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.password !== undefined) dbUpdates.password = updates.password;

    const { data, error } = await supabase
      .from('workers')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Map back to camelCase for the return
    return {
      id: data.id,
      fullName: data.full_name,
      dateOfBirth: data.date_of_birth,
      phone: data.phone,
      email: data.email,
      address: data.address,
      profilePhoto: data.profile_photo,
      type: data.type,
      paymentType: data.payment_type,
      baseSalary: data.base_salary,
      username: data.username,
      password: data.password,
      advances: [],
      absences: [],
      payments: [],
      createdAt: data.created_at,
    };
  }

  static async deleteWorker(id: string): Promise<void> {
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Worker Advances
  static async createWorkerAdvance(workerId: string, advance: Omit<WorkerAdvance, 'id' | 'createdAt'>): Promise<WorkerAdvance> {
    const dbAdvance = {
      worker_id: workerId,
      amount: advance.amount,
      date: advance.date,
      note: advance.note,
    };

    const { data, error } = await supabase
      .from('worker_advances')
      .insert([dbAdvance])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      amount: data.amount,
      date: data.date,
      note: data.note,
    };
  }

  static async deleteWorkerAdvance(id: string): Promise<void> {
    const { error } = await supabase
      .from('worker_advances')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Worker Absences
  static async createWorkerAbsence(workerId: string, absence: Omit<WorkerAbsence, 'id' | 'createdAt'>): Promise<WorkerAbsence> {
    const dbAbsence = {
      worker_id: workerId,
      cost: absence.cost,
      date: absence.date,
      note: absence.note,
    };

    const { data, error } = await supabase
      .from('worker_absences')
      .insert([dbAbsence])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      cost: data.cost,
      date: data.date,
      note: data.note,
    };
  }

  static async deleteWorkerAbsence(id: string): Promise<void> {
    const { error } = await supabase
      .from('worker_absences')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Worker Payments
  static async createWorkerPayment(workerId: string, payment: Omit<WorkerPayment, 'id' | 'createdAt'>): Promise<WorkerPayment> {
    const dbPayment = {
      worker_id: workerId,
      amount: payment.amount,
      date: payment.date,
      base_salary: payment.baseSalary,
      advances: payment.advances,
      absences: payment.absences,
      net_salary: payment.netSalary,
      note: payment.note,
    };

    const { data, error } = await supabase
      .from('worker_payments')
      .insert([dbPayment])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      amount: data.amount,
      date: data.date,
      baseSalary: data.base_salary,
      advances: data.advances,
      absences: data.absences,
      netSalary: data.net_salary,
      note: data.note,
    };
  }

  static async deleteWorkerPayment(id: string): Promise<void> {
    const { error } = await supabase
      .from('worker_payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Store Expenses
  static async getStoreExpenses(): Promise<StoreExpense[]> {
    const { data, error } = await supabase
      .from('store_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createStoreExpense(expense: Omit<StoreExpense, 'id' | 'created_at'>): Promise<StoreExpense> {
    const { data, error } = await supabase
      .from('store_expenses')
      .insert([expense])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Vehicle Expenses
  static async getVehicleExpenses(): Promise<VehicleExpense[]> {
    const { data, error } = await supabase
      .from('vehicle_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createVehicleExpense(expense: Omit<VehicleExpense, 'id' | 'created_at'>): Promise<VehicleExpense> {
    const { data, error } = await supabase
      .from('vehicle_expenses')
      .insert([expense])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Maintenance Alerts
  static async getMaintenanceAlerts(): Promise<MaintenanceAlert[]> {
    try {
      const { data, error } = await supabase
        .from('maintenance_alerts')
        .select('*');

      if (error) throw error;
      return (data || []).map(alert => ({
        id: alert.id || '',
        carId: alert.car_id || '',
        carInfo: alert.car_info || '',
        type: alert.type || 'other',
        title: alert.title || 'Alert',
        message: alert.message || '',
        severity: alert.severity || 'medium',
        dueDate: alert.due_date,
        isExpired: alert.is_expired || false,
        daysUntilDue: alert.days_until_due,
        currentMileage: alert.current_mileage,
        nextServiceMileage: alert.next_service_mileage,
        createdAt: alert.created_at || new Date().toISOString()
      }));
    } catch (e) {
      console.warn('getMaintenanceAlerts failed, table may not exist or missing columns:', e);
      return [];
    }
  }

  static async createMaintenanceAlert(alert: Omit<MaintenanceAlert, 'id' | 'created_at'>): Promise<MaintenanceAlert> {
    const { data, error } = await supabase
      .from('maintenance_alerts')
      .insert([alert])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteMaintenanceAlert(carId: string, type: string): Promise<void> {
    const { error } = await supabase
      .from('maintenance_alerts')
      .delete()
      .eq('car_id', carId)
      .eq('type', type);

    if (error) throw error;
  }

  // Website Orders
  static async getWebsiteOrders(): Promise<WebsiteOrder[]> {
    try {
      // Query pending reservations from reservations table (website orders)
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          client_id,
          car_id,
          departure_date,
          departure_time,
          departure_agency_id,
          return_date,
          return_time,
          return_agency_id,
          total_days,
          total_price,
          additional_fees,
          status,
          created_at,
          client:clients(*),
          car:cars(*)
        `)
        // load both new pending orders and those we've already accepted so they stay visible here
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching website orders:', error);
        return [];
      }

      // Transform reservations to WebsiteOrder format
      if (!data) return [];

      return data.map((reservation: any) => {
        const totalPrice = parseInt(reservation.total_price) || 0;
        const additionalFees = parseInt(reservation.additional_fees) || 0;
        
        return {
          id: reservation.id,
          carId: reservation.car_id,
          car: reservation.car || {},
          step1: {
            carId: reservation.car_id,
            departureDate: reservation.departure_date,
            departureTime: reservation.departure_time,
            departureAgency: reservation.departure_agency_id,
            returnDate: reservation.return_date,
            returnTime: reservation.return_time,
            returnAgency: reservation.return_agency_id,
            differentReturnAgency: reservation.departure_agency_id !== reservation.return_agency_id,
          },
          step2: {
            firstName: reservation.client?.first_name || '',
            lastName: reservation.client?.last_name || '',
            phone: reservation.client?.phone || '',
            email: reservation.client?.email || '',
            licenseNumber: reservation.client?.license_number || '',
            wilaya: reservation.client?.wilaya || '',
            completeAddress: reservation.client?.complete_address || '',
            // include profile photo like planner reservations do
            photo: reservation.client?.profile_photo || '',
            scannedDocuments: reservation.client?.documents_urls || [],
          },
          step3: {
            additionalServices: [],
          },
          totalDays: reservation.total_days || 0,
          totalPrice: totalPrice,
          servicesTotal: additionalFees,
          status: 'pending',
          createdAt: reservation.created_at,
          source: 'website',
        } as WebsiteOrder;
      });
    } catch (err) {
      console.warn('Exception fetching website orders:', err);
      return [];
    }
  }

  static async createWebsiteOrder(order: Omit<WebsiteOrder, 'id' | 'created_at'>): Promise<WebsiteOrder> {
    // Website orders are actually reservations with pending status
    const reservationData = {
      client_id: (order as any).clientId,
      car_id: order.carId,
      departure_date: order.step1.departureDate,
      departure_time: order.step1.departureTime,
      departure_agency_id: order.step1.departureAgency,
      return_date: order.step1.returnDate,
      return_time: order.step1.returnTime,
      return_agency_id: order.step1.returnAgency,
      total_days: order.totalDays,
      total_price: order.totalPrice,
      additional_fees: order.servicesTotal,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
      .single();

    if (error) throw error;
    return order;
  }

  static async updateWebsiteOrderStatus(orderId: string, status: 'pending' | 'accepted' | 'confirmed' | 'processing' | 'completed' | 'cancelled'): Promise<void> {
    // Update reservation status (website orders are reservations)
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
  }

  static async deleteWebsiteOrder(orderId: string): Promise<void> {
    // Delete from reservations table (website orders are reservations)
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
  }

  // Reservations
  static async getReservations(): Promise<ReservationDetails[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        client:clients(*),
        car:cars(*),
        payments:payments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createReservation(reservation: Omit<ReservationDetails, 'id' | 'created_at' | 'activatedAt' | 'completedAt'>): Promise<ReservationDetails> {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservation])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Dashboard Statistics
  static async getDashboardStats() {
    // Run all queries in parallel for faster loading
    const [
      revenueResult,
      monthlyRevenueResult,
      storeExpensesResult,
      vehicleExpensesResult,
      clientsResult,
      carsResult,
      activeReservationsForCarsResult,
      totalReservationsResult,
      activeReservationsResult,
      overduePaymentsResult,
      recentReservationsResult,
      alertsResult
    ] = await Promise.all([
      supabase.from('reservations').select('total_price').eq('status', 'completed'),
      supabase.from('reservations').select('total_price, completed_at').eq('status', 'completed').gte('completed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('store_expenses').select('cost'),
      supabase.from('vehicle_expenses').select('cost'),
      supabase.from('clients').select('id', { count: 'exact' }),
      supabase.from('cars').select('id', { count: 'exact' }),
      supabase.from('reservations').select('car_id').in('status', ['pending', 'confirmed', 'active']),
      supabase.from('reservations').select('id', { count: 'exact' }),
      supabase.from('reservations').select('id', { count: 'exact' }).in('status', ['confirmed', 'active']),
      supabase.from('payments').select('id', { count: 'exact' }).eq('status', 'pending'),
      supabase.from('reservations').select('*, client:clients(*), car:cars(*)').order('created_at', { ascending: false }).limit(5),
      supabase.from('maintenance_alerts').select('id', { count: 'exact' })
    ]);

    // Extract data and errors
    const { data: revenueData, error: revenueError } = revenueResult;
    const { data: monthlyRevenueData, error: monthlyRevenueError } = monthlyRevenueResult;
    const { data: storeExpenses, error: storeError } = storeExpensesResult;
    const { data: vehicleExpenses, error: vehicleError } = vehicleExpensesResult;
    const { data: clients, error: clientsError } = clientsResult;
    const { data: cars, error: carsError } = carsResult;
    const { data: activeReservationsForCars, error: activeReservationsForCarsError } = activeReservationsForCarsResult;
    const { data: totalReservations, error: totalReservationsError } = totalReservationsResult;
    const { data: activeReservations, error: activeResError } = activeReservationsResult;
    const { data: overduePayments, error: overduePaymentsError } = overduePaymentsResult;
    const { data: recentReservations, error: recentReservationsError } = recentReservationsResult;
    const { data: alerts, error: alertsError } = alertsResult;

    // Throw on critical errors
    if (revenueError || storeError || vehicleError || clientsError || carsError || activeResError) {
      throw revenueError || storeError || vehicleError || clientsError || carsError || activeResError;
    }

    // Calculate available cars: total cars minus those with active/pending reservations
    const rentedCarIds = new Set(activeReservationsForCars?.map((r: any) => r.car_id) || []);
    const availableCarsCount = (cars?.length || 0) - rentedCarIds.size;

    // Calculate totals
    const totalRevenue = revenueData?.reduce((sum, r) => sum + r.total_price, 0) || 0;
    const monthlyRevenue = monthlyRevenueData?.reduce((sum, r) => sum + r.total_price, 0) || 0;
    const totalExpenses = (storeExpenses?.reduce((sum, e) => sum + e.cost, 0) || 0) +
                         (vehicleExpenses?.reduce((sum, e) => sum + e.cost, 0) || 0);
    const maintenanceAlertsCount = alertsError ? 0 : (alerts?.length || 0);

    // Calculate revenue by month (last 6 months)
    const revenueByMonth = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthRevenue = revenueData?.filter(r => {
        const completedDate = new Date(r.completed_at || r.created_at);
        return completedDate >= month && completedDate < nextMonth;
      }).reduce((sum, r) => sum + r.total_price, 0) || 0;

      revenueByMonth.push({
        month: month.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue: monthRevenue
      });
    }

    // Calculate car utilization (simplified - based on active reservations)
    const carUtilization = cars?.slice(0, 5).map(car => ({
      carId: car.id,
      carName: `${car.brand} ${car.model}`,
      utilization: Math.floor(Math.random() * 40) + 60 // Placeholder - would need actual calculation
    })) || [];

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalClients: clients?.length || 0,
      totalCars: cars?.length || 0,
      availableCars: availableCarsCount,
      totalReservations: totalReservations?.length || 0,
      activeReservations: activeReservations?.length || 0,
      overduePayments: overduePayments?.length || 0,
      maintenanceAlerts: maintenanceAlertsCount,
      monthlyRevenue,
      recentReservations: recentReservations || [],
      revenueByMonth,
      carUtilization
    };
  }

  // Website Management - Offers
  static async getOffers(): Promise<Offer[]> {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          car:cars(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(offer => ({
        id: offer.id,
        carId: offer.car_id,
        car: {
          id: offer.car.id || '',
          brand: offer.car.brand,
          model: offer.car.model,
          registration: offer.car.plate_number,
          year: offer.car.year,
          color: offer.car.color || 'Premium',
          vin: offer.car.vin || '',
          energy: offer.car.energy || 'Essence',
          transmission: offer.car.transmission || 'Automatique',
          seats: offer.car.seats || 5,
          doors: offer.car.doors || 4,
          priceDay: Math.round(Number(offer.car.price_per_day)),
          priceWeek: Math.round(Number(offer.car.price_week || offer.car.price_per_day * 2)),
          priceMonth: Math.round(Number(offer.car.price_month || offer.car.price_per_day * 4)),
          deposit: Math.round(Number(offer.car.deposit || offer.car.price_per_day * 2)),
          images: offer.car.image_url ? [offer.car.image_url] : ['https://picsum.photos/seed/car/400/300'],
          mileage: offer.car.mileage || 0,
        },
        price: Math.round(Number(offer.price)),
        note: offer.note,
        createdAt: offer.created_at,
      }));
    } catch (e: any) {
      console.warn('getOffers failed, returning empty array', e.message || e);
      return [];
    }
  }

  static async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'car'>): Promise<Offer> {
    const { data, error } = await supabase
      .from('offers')
      .insert([{
        car_id: offer.carId,
        price: offer.price,
        note: offer.note,
      }])
      .select(`
        *,
        car:cars(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      carId: data.car_id,
      car: {
        id: data.car.id || '',
        brand: data.car.brand,
        model: data.car.model,
        registration: data.car.plate_number,
        year: data.car.year,
        color: data.car.color || 'Premium',
        vin: data.car.vin || '',
        energy: data.car.energy || 'Essence',
        transmission: data.car.transmission || 'Automatique',
        seats: data.car.seats || 5,
        doors: data.car.doors || 4,
        priceDay: Math.round(Number(data.car.price_per_day)),
        priceWeek: Math.round(Number(data.car.price_week || data.car.price_per_day * 2)),
        priceMonth: Math.round(Number(data.car.price_month || data.car.price_per_day * 4)),
        deposit: Math.round(Number(data.car.deposit || data.car.price_per_day * 2)),
        images: data.car.image_url ? [data.car.image_url] : ['https://picsum.photos/seed/car/400/300'],
        mileage: data.car.mileage || 0,
      },
      price: Math.round(Number(data.price)),
      note: data.note,
      createdAt: data.created_at,
    };
  }

  static async updateOffer(id: string, updates: Partial<Omit<Offer, 'id' | 'createdAt' | 'car'>>): Promise<Offer> {
    const { data, error } = await supabase
      .from('offers')
      .update({
        car_id: updates.carId,
        price: updates.price,
        note: updates.note,
      })
      .eq('id', id)
      .select(`
        *,
        car:cars(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      carId: data.car_id,
      car: {
        id: data.car.id || '',
        brand: data.car.brand,
        model: data.car.model,
        registration: data.car.plate_number,
        year: data.car.year,
        color: data.car.color || 'Premium',
        vin: data.car.vin || '',
        energy: data.car.energy || 'Essence',
        transmission: data.car.transmission || 'Automatique',
        seats: data.car.seats || 5,
        doors: data.car.doors || 4,
        priceDay: Math.round(Number(data.car.price_per_day)),
        priceWeek: Math.round(Number(data.car.price_week || data.car.price_per_day * 2)),
        priceMonth: Math.round(Number(data.car.price_month || data.car.price_per_day * 4)),
        deposit: Math.round(Number(data.car.deposit || data.car.price_per_day * 2)),
        images: data.car.image_url ? [data.car.image_url] : ['https://picsum.photos/seed/car/400/300'],
        mileage: data.car.mileage || 0,
      },
      price: Math.round(Number(data.price)),
      note: data.note,
      createdAt: data.created_at,
    };
  }

  static async deleteOffer(id: string): Promise<void> {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Website Management - Special Offers
  static async getSpecialOffers(): Promise<SpecialOffer[]> {
    try {
      const { data, error } = await supabase
        .from('special_offers')
        .select(`
          *,
          car:cars(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(offer => ({
        id: offer.id,
        carId: offer.car_id,
        car: {
          id: offer.car.id || '',
          brand: offer.car.brand,
          model: offer.car.model,
          registration: offer.car.plate_number,
          year: offer.car.year,
          color: offer.car.color || 'Premium',
          vin: offer.car.vin || '',
          energy: offer.car.energy || 'Essence',
          transmission: offer.car.transmission || 'Automatique',
          seats: offer.car.seats || 5,
          doors: offer.car.doors || 4,
          priceDay: Math.round(Number(offer.car.price_per_day)),
          priceWeek: Math.round(Number(offer.car.price_week || offer.car.price_per_day * 2)),
          priceMonth: Math.round(Number(offer.car.price_month || offer.car.price_per_day * 4)),
          deposit: Math.round(Number(offer.car.deposit || offer.car.price_per_day * 2)),
          images: offer.car.image_url ? [offer.car.image_url] : ['https://picsum.photos/seed/car/400/300'],
          mileage: offer.car.mileage || 0,
        },
        oldPrice: Math.round(Number(offer.old_price)),
        newPrice: Math.round(Number(offer.new_price)),
        note: offer.note,
        isActive: offer.is_active,
        createdAt: offer.created_at,
      }));
    } catch (e: any) {
      console.warn('getSpecialOffers failed, returning empty array', e.message || e);
      return [];
    }
  }

  static async createSpecialOffer(offer: Omit<SpecialOffer, 'id' | 'createdAt' | 'car'>): Promise<SpecialOffer> {
    const { data, error } = await supabase
      .from('special_offers')
      .insert([{
        car_id: offer.carId,
        old_price: offer.oldPrice,
        new_price: offer.newPrice,
        note: offer.note,
        is_active: offer.isActive,
      }])
      .select(`
        *,
        car:cars(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      carId: data.car_id,
      car: {
        id: data.car.id || '',
        brand: data.car.brand,
        model: data.car.model,
        registration: data.car.plate_number,
        year: data.car.year,
        color: data.car.color || 'Premium',
        vin: data.car.vin || '',
        energy: data.car.energy || 'Essence',
        transmission: data.car.transmission || 'Automatique',
        seats: data.car.seats || 5,
        doors: data.car.doors || 4,
        priceDay: Math.round(Number(data.car.price_per_day)),
        priceWeek: Math.round(Number(data.car.price_week || data.car.price_per_day * 2)),
        priceMonth: Math.round(Number(data.car.price_month || data.car.price_per_day * 4)),
        deposit: Math.round(Number(data.car.deposit || data.car.price_per_day * 2)),
        images: data.car.image_url ? [data.car.image_url] : ['https://picsum.photos/seed/car/400/300'],
        mileage: data.car.mileage || 0,
      },
      oldPrice: Math.round(Number(data.old_price)),
      newPrice: Math.round(Number(data.new_price)),
      note: data.note,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  static async updateSpecialOffer(id: string, updates: Partial<Omit<SpecialOffer, 'id' | 'createdAt' | 'car'>>): Promise<SpecialOffer> {
    const { data, error } = await supabase
      .from('special_offers')
      .update({
        car_id: updates.carId,
        old_price: updates.oldPrice,
        new_price: updates.newPrice,
        note: updates.note,
        is_active: updates.isActive,
      })
      .eq('id', id)
      .select(`
        *,
        car:cars(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      carId: data.car_id,
      car: {
        id: data.car.id || '',
        brand: data.car.brand,
        model: data.car.model,
        registration: data.car.plate_number,
        year: data.car.year,
        color: data.car.color || 'Premium',
        vin: data.car.vin || '',
        energy: data.car.energy || 'Essence',
        transmission: data.car.transmission || 'Automatique',
        seats: data.car.seats || 5,
        doors: data.car.doors || 4,
        priceDay: Math.round(Number(data.car.price_per_day)),
        priceWeek: Math.round(Number(data.car.price_week || data.car.price_per_day * 2)),
        priceMonth: Math.round(Number(data.car.price_month || data.car.price_per_day * 4)),
        deposit: Math.round(Number(data.car.deposit || data.car.price_per_day * 2)),
        images: data.car.image_url ? [data.car.image_url] : ['https://picsum.photos/seed/car/400/300'],
        mileage: data.car.mileage || 0,
      },
      oldPrice: Math.round(Number(data.old_price)),
      newPrice: Math.round(Number(data.new_price)),
      note: data.note,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  static async toggleSpecialOfferStatus(id: string): Promise<SpecialOffer> {
    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from('special_offers')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the status
    const { data, error } = await supabase
      .from('special_offers')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select(`
        *,
        car:cars(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      carId: data.car_id,
      car: {
        id: data.car.id || '',
        brand: data.car.brand,
        model: data.car.model,
        registration: data.car.plate_number,
        year: data.car.year,
        color: data.car.color || 'Premium',
        vin: data.car.vin || '',
        energy: data.car.energy || 'Essence',
        transmission: data.car.transmission || 'Automatique',
        seats: data.car.seats || 5,
        doors: data.car.doors || 4,
        priceDay: Math.round(Number(data.car.price_per_day)),
        priceWeek: Math.round(Number(data.car.price_week || data.car.price_per_day * 2)),
        priceMonth: Math.round(Number(data.car.price_month || data.car.price_per_day * 4)),
        deposit: Math.round(Number(data.car.deposit || data.car.price_per_day * 2)),
        images: data.car.image_url ? [data.car.image_url] : ['https://picsum.photos/seed/car/400/300'],
        mileage: data.car.mileage || 0,
      },
      oldPrice: Math.round(Number(data.old_price)),
      newPrice: Math.round(Number(data.new_price)),
      note: data.note,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  static async deleteSpecialOffer(id: string): Promise<void> {
    const { error } = await supabase
      .from('special_offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Website Management - Contacts
  static async getWebsiteContacts(): Promise<ContactInfo> {
    try {
      const { data, error } = await supabase
        .from('website_contacts')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        return {
          facebook: data[0].facebook,
          instagram: data[0].instagram,
          tiktok: data[0].tiktok,
          whatsapp: data[0].whatsapp,
          phone: data[0].phone,
          address: data[0].address,
          email: data[0].email,
        };
      }
    } catch (e: any) {
      console.warn('getWebsiteContacts failed, returning empty object', e.message || e);
    }

    // Return empty object if error or no contacts exist
    return {};
  }

  static async updateWebsiteContacts(contacts: ContactInfo): Promise<ContactInfo> {
    // First, delete all existing records to ensure only one record exists
    await supabase
      .from('website_contacts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    // Then insert the new record
    const { data, error } = await supabase
      .from('website_contacts')
      .insert([{
        facebook: contacts.facebook,
        instagram: contacts.instagram,
        tiktok: contacts.tiktok,
        whatsapp: contacts.whatsapp,
        phone: contacts.phone,
        address: contacts.address,
        email: contacts.email,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      facebook: data.facebook,
      instagram: data.instagram,
      tiktok: data.tiktok,
      whatsapp: data.whatsapp,
      phone: data.phone,
      address: data.address,
      email: data.email,
    };
  }

  // Website Management - Settings
  static async getWebsiteSettings(): Promise<WebsiteSettings> {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        return {
          name: data[0].name,
          description: data[0].description,
          logo: data[0].logo,
        };
      }
    } catch (e: any) {
      console.warn('getWebsiteSettings failed, returning empty object', e.message || e);
    }

    // default empty - ensure required fields present
    return {
      name: '',
      description: '',
      logo: ''
    };
  }

  static async updateWebsiteSettings(settings: WebsiteSettings): Promise<WebsiteSettings> {
    // First, delete all existing records to ensure only one record exists
    await supabase
      .from('website_settings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    // Then insert the new record
    const { data, error } = await supabase
      .from('website_settings')
      .insert([{
        name: settings.name,
        description: settings.description,
        logo: settings.logo,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      name: data.name,
      description: data.description,
      logo: data.logo,
    };
  }

  // Inspection Checklist Items
  static async getInspectionChecklistItems(): Promise<any[]> {
    const { data, error } = await supabase
      .from('inspection_checklist_items')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createInspectionChecklistItem(item: {
    category: string;
    item_name: string;
    display_order?: number;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('inspection_checklist_items')
      .insert([{
        category: item.category,
        item_name: item.item_name,
        display_order: item.display_order || 0
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteInspectionChecklistItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inspection_checklist_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Vehicle Inspections
  static async createVehicleInspection(inspection: {
    reservation_id: string;
    type: 'departure' | 'return';
    mileage: number;
    fuel_level: string;
    agency_id: string;
    exterior_front_photo?: string;
    exterior_rear_photo?: string;
    interior_photo?: string;
    other_photos?: string[];
    client_signature?: string;
    notes?: string;
    date: string;
    time: string;
  }): Promise<any> {
    // upsert so that if an inspection already exists for this reservation/type it updates instead of inserting duplicate
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .upsert([inspection], { onConflict: 'reservation_id,type' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateVehicleInspection(inspectionId: string, updates: Partial<{
    mileage: number;
    fuel_level: string;
    agency_id: string;
    exterior_front_photo?: string | null;
    exterior_rear_photo?: string | null;
    interior_photo?: string | null;
    other_photos?: string[];
    client_signature?: string | null;
    notes?: string | null;
    date?: string;
    time?: string;
  }>): Promise<any> {
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .update(updates)
      .eq('id', inspectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getVehicleInspections(reservationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('vehicle_inspections')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Inspection Responses
  static async createInspectionResponses(responses: {
    inspection_id: string;
    checklist_item_id: string;
    status: boolean;
    note?: string;
  }[]): Promise<any[]> {
    try {
      // Request explicit columns to avoid complex auto-generated REST query params
      const { data, error } = await supabase
        .from('inspection_responses')
        .insert(responses)
        .select('id,inspection_id,checklist_item_id,status,note');

      if (error) {
        console.error('createInspectionResponses error:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('createInspectionResponses exception:', err);
      throw err;
    }
  }

  static async deleteInspectionResponses(inspectionId: string): Promise<void> {
    const { error } = await supabase
      .from('inspection_responses')
      .delete()
      .eq('inspection_id', inspectionId);

    if (error) throw error;
  }

  // Upsert inspection responses: create new rows or update existing ones by (inspection_id, checklist_item_id)
  static async upsertInspectionResponses(responses: {
    inspection_id: string;
    checklist_item_id: string;
    status: boolean;
    note?: string;
  }[]): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('inspection_responses')
        .upsert(responses, { onConflict: 'inspection_id,checklist_item_id' })
        .select('id,inspection_id,checklist_item_id,status,note');

      if (error) {
        console.error('upsertInspectionResponses error:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('upsertInspectionResponses exception:', err);
      throw err;
    }
  }

  // Services
  static async getServices(): Promise<any[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(service => ({
      id: service.id,
      category: service.category,
      name: service.service_name,
      description: service.description,
      price: Math.round(Number(service.price)),
      isActive: service.is_active,
      createdAt: service.created_at,
    }));
  }

  static async createService(service: Omit<any, 'id' | 'created_at'>): Promise<any> {
    const { data, error } = await supabase
      .from('services')
      .insert([{
        category: service.category,
        service_name: service.name,
        description: service.description,
        price: service.price,
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      category: data.category,
      name: data.service_name,
      description: data.description,
      price: Math.round(Number(data.price)),
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  static async updateService(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('services')
      .update({
        service_name: updates.name,
        description: updates.description,
        price: updates.price,
        is_active: updates.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      category: data.category,
      name: data.service_name,
      description: data.description,
      price: Math.round(Number(data.price)),
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  }

  static async deleteService(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Get drivers (workers with type 'driver')
  static async getDrivers(): Promise<Worker[]> {
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('type', 'driver')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return (data || []).map(worker => ({
      id: worker.id,
      fullName: worker.full_name,
      dateOfBirth: worker.date_of_birth,
      phone: worker.phone,
      email: worker.email,
      address: worker.address,
      profilePhoto: worker.profile_photo,
      type: worker.type,
      paymentType: worker.payment_type,
      baseSalary: worker.base_salary,
      username: worker.username,
      password: worker.password,
      advances: [],
      absences: [],
      payments: [],
      createdAt: worker.created_at,
    }));
  }
}
