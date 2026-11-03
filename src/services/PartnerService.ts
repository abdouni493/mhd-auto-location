import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Agency, Car, PartnerAgency } from '../types';
import { DatabaseService } from './DatabaseService';

/**
 * Agences partenaires : autres installations de l'application (projets
 * Supabase distincts). Le site public affiche leurs voitures et crée les
 * réservations directement dans LEUR base (RPC create_website_reservation),
 * pour qu'elles apparaissent dans « Commandes Website » chez le propriétaire.
 */

const PARTNER_PREFIX = 'partner:';

const clients = new Map<string, SupabaseClient>();

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '');

const mapRow = (row: any): PartnerAgency => ({
  id: row.id,
  name: row.name,
  city: row.city || undefined,
  phone: row.phone || undefined,
  email: row.email || undefined,
  supabaseUrl: row.supabase_url,
  anonKey: row.anon_key,
  isActive: row.is_active !== false,
  createdAt: row.created_at,
});

const tableMissing = (error: any) =>
  error?.code === '42P01' || error?.code === 'PGRST205' || /partner_agencies/.test(error?.message || '');

export class PartnerService {
  /** Client Supabase (anon, sans session) pour un partenaire — mis en cache. */
  static getClient(partner: Pick<PartnerAgency, 'supabaseUrl' | 'anonKey'>): SupabaseClient {
    const key = `${normalizeUrl(partner.supabaseUrl)}|${partner.anonKey}`;
    let c = clients.get(key);
    if (!c) {
      c = createClient(normalizeUrl(partner.supabaseUrl), partner.anonKey.trim(), {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: `partner-${key.length}-${normalizeUrl(partner.supabaseUrl)}` },
      });
      clients.set(key, c);
    }
    return c;
  }

  // ─── CRUD (base principale) ─────────────────────────────────────────────
  static async list(onlyActive = false): Promise<PartnerAgency[]> {
    let q = supabase.from('partner_agencies').select('*').order('created_at', { ascending: true });
    if (onlyActive) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) {
      if (tableMissing(error)) {
        if (onlyActive) return [];
        throw new Error("La table partner_agencies n'existe pas encore. Exécutez la migration supabase/migrations/20261103_partner_agencies.sql.");
      }
      throw error;
    }
    return (data || []).map(mapRow);
  }

  static async save(p: Omit<PartnerAgency, 'id' | 'createdAt'> & { id?: string }): Promise<void> {
    const payload = {
      name: p.name.trim(),
      city: p.city?.trim() || null,
      phone: p.phone?.trim() || null,
      email: p.email?.trim() || null,
      supabase_url: normalizeUrl(p.supabaseUrl),
      anon_key: p.anonKey.trim(),
      is_active: p.isActive,
    };
    const { error } = p.id
      ? await supabase.from('partner_agencies').update(payload).eq('id', p.id)
      : await supabase.from('partner_agencies').insert(payload);
    if (error) throw error;
  }

  static async remove(id: string): Promise<void> {
    const { error } = await supabase.from('partner_agencies').delete().eq('id', id);
    if (error) throw error;
  }

  /** Vérifie la connexion : renvoie le nombre de voitures et d'agences visibles. */
  static async testConnection(p: Pick<PartnerAgency, 'supabaseUrl' | 'anonKey'>): Promise<{ cars: number; agencies: number }> {
    const c = this.getClient(p);
    const [cars, agencies] = await Promise.all([
      c.from('cars').select('id', { count: 'exact', head: true }),
      c.from('agencies').select('id', { count: 'exact', head: true }),
    ]);
    if (cars.error) throw cars.error;
    if (agencies.error) throw agencies.error;
    return { cars: cars.count || 0, agencies: agencies.count || 0 };
  }

  // ─── Identifiants de voitures partenaires ───────────────────────────────
  static makeCarId(partnerId: string, carId: string) {
    return `${PARTNER_PREFIX}${partnerId}:${carId}`;
  }

  // ─── Lecture publique (site) ────────────────────────────────────────────
  /** Voitures visibles de toutes les agences partenaires actives. */
  static async getAllPartnerCars(): Promise<Car[]> {
    const partners = await this.list(true).catch(() => [] as PartnerAgency[]);
    const results = await Promise.all(partners.map(p => this.getPartnerCars(p).catch(err => {
      console.warn(`[Partenaire ${p.name}] voitures indisponibles :`, err?.message || err);
      return [] as Car[];
    })));
    return results.flat();
  }

  static async getPartnerCars(p: PartnerAgency): Promise<Car[]> {
    const { data, error } = await this.getClient(p)
      .from('cars').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || [])
      .map(row => DatabaseService.mapDbCar(row))
      .filter(car => !car.isHiddenFromSite && car.status !== 'maintenance')
      .map(car => ({
        ...car,
        id: this.makeCarId(p.id, car.id),
        sourceCarId: car.id,
        partnerId: p.id,
        partnerName: p.name,
      }));
  }

  private static async partnerById(id: string): Promise<PartnerAgency> {
    const list = await this.list(true);
    const p = list.find(x => x.id === id);
    if (!p) throw new Error('Agence partenaire introuvable ou désactivée.');
    return p;
  }

  static async getPartnerAgencies(partnerId: string): Promise<Agency[]> {
    const p = await this.partnerById(partnerId);
    const { data, error } = await this.getClient(p).from('agencies').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async getReservedDateRanges(car: Car): Promise<{ from: string; to: string }[]> {
    const p = await this.partnerById(car.partnerId!);
    const c = this.getClient(p);
    const mapRows = (rows: any[]) => (rows || [])
      .filter(r => r.departure_date && r.return_date)
      .map(r => ({ from: String(r.departure_date).substring(0, 10), to: String(r.return_date).substring(0, 10) }));
    const { data, error } = await c.rpc('get_reserved_periods', { p_car_id: car.sourceCarId });
    if (!error && Array.isArray(data)) return mapRows(data);
    return [];
  }

  /** IDs (préfixés) des voitures partenaires indisponibles sur la période. */
  static async getUnavailableCarIds(from: string, to: string, partnerIds: string[]): Promise<string[]> {
    if (partnerIds.length === 0) return [];
    const partners = (await this.list(true)).filter(p => partnerIds.includes(p.id));
    const lists = await Promise.all(partners.map(async p => {
      const { data, error } = await this.getClient(p).rpc('get_unavailable_car_ids', { p_from: from, p_to: to });
      if (error) return [];
      return (data || [])
        .map((r: any) => (typeof r === 'string' ? r : r.get_unavailable_car_ids || r.id))
        .filter(Boolean)
        .map((id: string) => this.makeCarId(p.id, id));
    }));
    return lists.flat();
  }

  /** Crée la réservation dans la base du PARTENAIRE propriétaire de la voiture. */
  static async createReservation(car: Car, payload: {
    client: Record<string, any>;
    reservation: Record<string, any>;
    services?: any[];
  }): Promise<void> {
    const p = await this.partnerById(car.partnerId!);
    const { error } = await this.getClient(p).rpc('create_website_reservation', {
      p_client: payload.client,
      p_reservation: { ...payload.reservation, car_id: car.sourceCarId },
      p_services: payload.services || [],
      p_promo_code: null,
    });
    if (error) {
      if ((error.message || '').includes('CAR_UNAVAILABLE')) {
        throw new Error("Cette voiture vient d'être réservée sur ces dates. Choisissez d'autres dates.");
      }
      throw error;
    }
  }
}
