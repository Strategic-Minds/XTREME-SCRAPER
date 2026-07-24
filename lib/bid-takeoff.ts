/**
 * XTREME SCRAPER — AI Takeoff Engine
 * Converts parsed job data into material + labor quantities
 * Supports: epoxy, polished concrete, painting, HVAC, roofing, flooring
 */

import type { ParsedBidJob } from './bid-parser'

export interface TakeoffLineItem {
  category: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'misc'
  description: string
  quantity: number
  unit: string
  unit_cost: number
  total: number
  notes?: string
}

export interface TakeoffResult {
  sqft: number
  sqft_source: 'stated' | 'estimated' | 'ai_inferred'
  line_items: TakeoffLineItem[]
  labor_hours: number
  labor_rate: number
  material_cost: number
  subtotal: number
  notes: string
}

// ─── TRADE MATRICES ────────────────────────────────────────────
// material_per_sqft: gallons or units needed per sqft
// labor_hrs_per_sqft: crew hours per sqft
const TRADE_MATRIX: Record<string, {
  material_per_sqft: number
  labor_hrs_per_sqft: number
  material_unit: string
  material_desc: string
  default_sqft: number
  prep_line: string
}> = {
  epoxy: {
    material_per_sqft: 0.012,      // ~1 gal per 85sqft (2 coats)
    labor_hrs_per_sqft: 0.008,     // ~8hrs per 1000sqft crew
    material_unit: 'gallon',
    material_desc: 'Epoxy coating system (primer + color + topcoat)',
    default_sqft: 500,
    prep_line: 'Diamond grind surface prep + crack fill'
  },
  polished_concrete: {
    material_per_sqft: 0.005,
    labor_hrs_per_sqft: 0.015,
    material_unit: 'gallon',
    material_desc: 'Concrete densifier + guard sealer',
    default_sqft: 1000,
    prep_line: 'Multi-step diamond grinding (30/50/100/200/400/800/1500 grit)'
  },
  painting: {
    material_per_sqft: 0.008,
    labor_hrs_per_sqft: 0.006,
    material_unit: 'gallon',
    material_desc: 'Premium interior/exterior paint (2 coats)',
    default_sqft: 800,
    prep_line: 'Surface prep, masking, primer coat'
  },
  roofing: {
    material_per_sqft: 0.003,
    labor_hrs_per_sqft: 0.012,
    material_unit: 'square',
    material_desc: 'Architectural shingles + underlayment + ridge cap',
    default_sqft: 1500,
    prep_line: 'Tear-off existing material + felt paper install'
  },
  flooring: {
    material_per_sqft: 1.05,
    labor_hrs_per_sqft: 0.010,
    material_unit: 'sqft',
    material_desc: 'Flooring material (LVP/tile/hardwood) + underlayment',
    default_sqft: 600,
    prep_line: 'Subfloor prep, leveling, moisture barrier'
  },
  hvac: {
    material_per_sqft: 0.001,
    labor_hrs_per_sqft: 0.020,
    material_unit: 'unit',
    material_desc: 'HVAC equipment + ductwork + fittings',
    default_sqft: 2000,
    prep_line: 'Load calculation + equipment selection'
  },
  general_contractor: {
    material_per_sqft: 0.015,
    labor_hrs_per_sqft: 0.025,
    material_unit: 'unit',
    material_desc: 'General materials + supplies',
    default_sqft: 1000,
    prep_line: 'Site prep and mobilization'
  },
  other: {
    material_per_sqft: 0.010,
    labor_hrs_per_sqft: 0.010,
    material_unit: 'unit',
    material_desc: 'Materials and supplies',
    default_sqft: 500,
    prep_line: 'Site prep'
  }
}

export function runTakeoff(
  job: ParsedBidJob,
  pricing: { labor_rate: number; material_markup_pct: number }
): TakeoffResult {
  const matrix = TRADE_MATRIX[job.job_type] || TRADE_MATRIX.other

  // Determine sqft
  let sqft = job.sqft_mentioned || matrix.default_sqft
  const sqft_source: TakeoffResult['sqft_source'] =
    job.sqft_mentioned ? 'stated' : 'estimated'

  const labor_rate = pricing.labor_rate || 65
  const markup = 1 + (pricing.material_markup_pct || 25) / 100

  const line_items: TakeoffLineItem[] = []

  // 1. Surface prep
  const prep_hrs = sqft * 0.003
  line_items.push({
    category: 'labor',
    description: matrix.prep_line,
    quantity: prep_hrs,
    unit: 'hour',
    unit_cost: labor_rate,
    total: prep_hrs * labor_rate,
    notes: `Based on ${sqft} sqft`
  })

  // 2. Main material
  const mat_qty = parseFloat((sqft * matrix.material_per_sqft).toFixed(2))
  const mat_unit_cost = job.job_type === 'epoxy' ? 42 :
    job.job_type === 'polished_concrete' ? 28 :
    job.job_type === 'painting' ? 38 :
    job.job_type === 'roofing' ? 180 :
    job.job_type === 'flooring' ? 3.5 : 45
  line_items.push({
    category: 'material',
    description: matrix.material_desc,
    quantity: mat_qty,
    unit: matrix.material_unit,
    unit_cost: mat_unit_cost * markup,
    total: mat_qty * mat_unit_cost * markup
  })

  // 3. Application labor
  const app_hrs = parseFloat((sqft * matrix.labor_hrs_per_sqft).toFixed(1))
  line_items.push({
    category: 'labor',
    description: 'Application / installation labor',
    quantity: app_hrs,
    unit: 'hour',
    unit_cost: labor_rate,
    total: app_hrs * labor_rate
  })

  // 4. Equipment / mobilization
  const equip = Math.max(150, sqft * 0.08)
  line_items.push({
    category: 'equipment',
    description: 'Equipment mobilization + tool rental',
    quantity: 1,
    unit: 'job',
    unit_cost: equip,
    total: equip
  })

  // 5. Cleanup + final inspection
  line_items.push({
    category: 'labor',
    description: 'Final cleanup, QC inspection, client walkthrough',
    quantity: 2,
    unit: 'hour',
    unit_cost: labor_rate,
    total: 2 * labor_rate
  })

  const total_labor_hrs = line_items
    .filter(i => i.category === 'labor')
    .reduce((s, i) => s + i.quantity, 0)

  const material_cost = line_items
    .filter(i => i.category === 'material')
    .reduce((s, i) => s + i.total, 0)

  const subtotal = line_items.reduce((s, i) => s + i.total, 0)

  return {
    sqft,
    sqft_source,
    line_items,
    labor_hours: total_labor_hrs,
    labor_rate,
    material_cost,
    subtotal,
    notes: `Takeoff based on ${sqft} sqft (${sqft_source}). Trade: ${job.job_type}. ${job.materials_mentioned.length > 0 ? 'Client specified: ' + job.materials_mentioned.join(', ') : ''}`
  }
}
