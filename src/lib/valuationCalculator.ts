/**
 * Calcolatore di valutazione immobiliare per il form pubblico /valuta.
 *
 * Modello semplice basato su:
 * - prezzo €/mq medio per città+zona (valori OMI indicativi)
 * - moltiplicatori per stato, classe energetica, anno costruzione
 * - bonus terrazzo/giardino/box/ascensore
 *
 * Output: range min/max + mediana del prezzo stimato.
 * NOTA: è una valutazione INDICATIVA per generare lead, non sostituisce
 * una valutazione professionale di un agente immobiliare.
 */

export type City = 'Novara' | 'Milano' | 'altro'
export type Zone = 'centro' | 'semicentro' | 'periferia'
export type Condition = 'nuovo' | 'ottimo' | 'buono' | 'da_ristrutturare'
export type EnergyClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

interface PriceRange { min: number; max: number }

const PRICE_PER_SQM: Record<City, Record<Zone, PriceRange>> = {
  Novara: {
    centro: { min: 2400, max: 3200 },
    semicentro: { min: 1800, max: 2400 },
    periferia: { min: 1200, max: 1800 },
  },
  Milano: {
    centro: { min: 5000, max: 8000 },
    semicentro: { min: 3500, max: 5500 },
    periferia: { min: 2500, max: 4000 },
  },
  altro: {
    centro: { min: 1800, max: 2600 },
    semicentro: { min: 1300, max: 1900 },
    periferia: { min: 900, max: 1400 },
  },
}

function conditionMultiplier(c: Condition | undefined | null): number {
  switch (c) {
    case 'nuovo': return 1.10
    case 'ottimo': return 1.05
    case 'buono': return 1.00
    case 'da_ristrutturare': return 0.75
    default: return 1.00
  }
}

function energyMultiplier(e: EnergyClass | undefined | null): number {
  switch (e) {
    case 'A': return 1.06
    case 'B': return 1.03
    case 'C': return 1.00
    case 'D': return 0.98
    case 'E': return 0.95
    case 'F': return 0.92
    case 'G': return 0.90
    default: return 1.00
  }
}

function yearBuiltMultiplier(year: number | undefined | null): number {
  if (!year || isNaN(year)) return 1.00
  if (year >= 2010) return 1.05
  if (year >= 1990) return 1.00
  if (year >= 1970) return 0.95
  return 0.90
}

export interface ValuationInput {
  city: City
  zone: Zone
  surface_mq: number
  property_condition?: Condition | null
  energy_class?: EnergyClass | null
  year_built?: number | null
  has_terrace?: boolean
  has_garden?: boolean
  has_garage?: boolean
  has_elevator?: boolean
}

export interface ValuationOutput {
  pricePerSqm: { min: number; max: number; median: number }
  totalPrice: { min: number; max: number; median: number }
  multipliers: {
    condition: number
    energy: number
    yearBuilt: number
    extras: number
    combined: number
  }
}

export function calculateValuation(input: ValuationInput): ValuationOutput {
  const base = PRICE_PER_SQM[input.city]?.[input.zone] || PRICE_PER_SQM.altro.semicentro

  const condM = conditionMultiplier(input.property_condition || null)
  const energyM = energyMultiplier(input.energy_class || null)
  const yearM = yearBuiltMultiplier(input.year_built || null)

  // Bonus extras: piccoli, fissi (additive)
  let extrasBonus = 1.00
  if (input.has_terrace) extrasBonus += 0.03
  if (input.has_garden) extrasBonus += 0.05
  if (input.has_garage) extrasBonus += 0.04
  if (input.has_elevator) extrasBonus += 0.02

  const combined = condM * energyM * yearM * extrasBonus

  const adjustedMin = base.min * combined
  const adjustedMax = base.max * combined
  const adjustedMedian = (adjustedMin + adjustedMax) / 2

  return {
    pricePerSqm: {
      min: Math.round(adjustedMin),
      max: Math.round(adjustedMax),
      median: Math.round(adjustedMedian),
    },
    totalPrice: {
      min: Math.round(adjustedMin * input.surface_mq / 1000) * 1000,
      max: Math.round(adjustedMax * input.surface_mq / 1000) * 1000,
      median: Math.round(adjustedMedian * input.surface_mq / 1000) * 1000,
    },
    multipliers: { condition: condM, energy: energyM, yearBuilt: yearM, extras: extrasBonus, combined },
  }
}
