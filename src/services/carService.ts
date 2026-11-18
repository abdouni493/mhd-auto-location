import { supabase } from '../supabase'
import { uploadCarImage } from './uploadCarImage'
import { companyContext, isCarInActiveCompany } from '../utils/companyContext'
import { isCarRowDeleted, markCurrenciesDeleted, withoutDeletedCars } from '../utils/carSoftDelete'

export interface Car {
  id?: string
  brand: string
  model: string
  year: number
  plate_number: string
  price_per_day: number
  status: string
  image_url?: string
  created_at?: string
  // Additional fields for full car data
  color?: string
  vin?: string
  energy?: string
  transmission?: string
  seats?: number
  doors?: number
  price_week?: number
  price_month?: number
  deposit?: number
  mileage?: number
  fuel_level?: 'full' | 'half' | 'quarter' | 'eighth' | 'empty'
  is_hidden_from_site?: boolean
  // Propriété du véhicule
  owner_type?: 'personal' | 'third_party'
  owner_name?: string | null
  owner_phone?: string | null
  agency_share_per_day?: number
  // Devises secondaires activées (JSONB)
  currencies?: Record<string, { enabled: boolean; rate: number }>
}

export interface AddCarData {
  brand: string
  model: string
  year: number
  plate_number: string
  price_per_day: number
  status: string
  image?: File
  image_url?: string
  // Additional fields
  color?: string
  vin?: string
  energy?: string
  transmission?: string
  seats?: number
  doors?: number
  price_week?: number
  price_month?: number
  deposit?: number
  mileage?: number
  // Propriété du véhicule
  owner_type?: 'personal' | 'third_party'
  owner_name?: string | null
  owner_phone?: string | null
  agency_share_per_day?: number
  // Devises secondaires activées (JSONB)
  currencies?: Record<string, { enabled: boolean; rate: number }>
}

/**
 * Add a new car with optional image upload or direct URL
 */
export async function addCar(carData: AddCarData): Promise<{ success: boolean; car?: Car; error?: string }> {
  try {
    let imageUrl: string | undefined

    // Use provided image_url or upload image if provided
    if (carData.image_url) {
      imageUrl = carData.image_url
    } else if (carData.image) {
      const uploadResult = await uploadCarImage(carData.image)
      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error
        }
      }
      imageUrl = uploadResult.url
    }

    // Insert car data into database
    const payload = {
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      plate_number: carData.plate_number,
      price_per_day: carData.price_per_day,
      status: carData.status,
      image_url: imageUrl,
      color: carData.color,
      vin: carData.vin,
      energy: carData.energy,
      transmission: carData.transmission,
      seats: carData.seats,
      doors: carData.doors,
      price_week: carData.price_week,
      price_month: carData.price_month,
      deposit: carData.deposit,
      mileage: carData.mileage,
      owner_type: carData.owner_type || 'personal',
      owner_name: carData.owner_name ?? null,
      owner_phone: carData.owner_phone ?? null,
      agency_share_per_day: carData.agency_share_per_day ?? 0,
        currencies: carData.currencies ?? {},
      }
    const insert = () => supabase.from('cars').insert(payload).select().single()
    let { data, error } = await insert()

    // Immatriculation déjà prise par une voiture SUPPRIMÉE : on libère la plaque
    // de l'ancienne fiche (son historique reste intact) puis on réessaie.
    if (error && (error.code === '23505' || /duplicate|unique/i.test(error.message || ''))) {
      if (await releaseDeletedPlate(carData.plate_number)) {
        ({ data, error } = await insert())
      }
    }

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      car: data
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Get all cars
 */
export async function getCars(): Promise<{ success: boolean; cars?: Car[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Multi-agences : une agence ne voit QUE ses propres voitures dans l'admin.
    await companyContext.whenResolved()
    // Voitures supprimées : masquées (leur historique reste en base).
    let cars = withoutDeletedCars(data)
    if (companyContext.getScopeCompanyId()) {
      const { data: links } = await supabase.from('car_companies').select('car_id, company_id')
      const map: Record<string, string[]> = {}
      for (const l of links || []) (map[l.car_id] ||= []).push(l.company_id)
      cars = cars.filter((c: any) => isCarInActiveCompany(c.id, map))
    }

    return {
      success: true,
      cars
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Get a single car by ID
 */
export async function getCar(id: string): Promise<{ success: boolean; car?: Car; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      car: data
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Update a car
 */
export async function updateCar(
  id: string,
  updates: Partial<Car>
): Promise<{ success: boolean; car?: Car; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      car: data
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Delete a car
 *
 * La voiture disparaît de l'application, mais TOUT son historique est conservé :
 * réservations, dépenses, maintenances, inspections, paiements… Pour cela on ne
 * supprime pas la ligne `cars` (la base supprimerait en cascade ces données) :
 * on la marque comme supprimée et on la masque partout.
 */
export async function deleteCar(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: row, error: readError } = await supabase
      .from('cars')
      .select('id, currencies')
      .eq('id', id)
      .maybeSingle()

    if (readError) {
      console.error('Database error:', readError)
      return { success: false, error: readError.message }
    }
    if (!row) return { success: true }

    const { error } = await supabase
      .from('cars')
      .update({ currencies: markCurrenciesDeleted(row.currencies) })
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Retire aussi la voiture du site public (best-effort : colonne optionnelle).
    try {
      await supabase.from('cars').update({ is_hidden_from_site: true }).eq('id', id)
    } catch { /* colonne absente : la voiture est déjà filtrée côté application */ }

    return {
      success: true
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Libère l'immatriculation d'une voiture supprimée (si la colonne est unique)
 * pour permettre de recréer une voiture avec la même plaque. Renvoie true si
 * une voiture supprimée portait cette plaque.
 */
async function releaseDeletedPlate(plate: string): Promise<boolean> {
  const { data } = await supabase
    .from('cars')
    .select('id, plate_number, currencies')
    .eq('plate_number', plate)
  const deleted = (data || []).filter((r: any) => isCarRowDeleted(r))
  if (deleted.length === 0) return false
  for (const r of deleted) {
    await supabase
      .from('cars')
      .update({ plate_number: `${r.plate_number} (supprimée ${String(r.id).slice(0, 4)})` })
      .eq('id', r.id)
  }
  return true
}
