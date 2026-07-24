/**
 * XTREME SCRAPER — Bid Pricing Engine
 * Applies overhead, margin, and tax to a takeoff result
 */

import type { TakeoffResult } from './bid-takeoff'

export interface FinalPricing {
  subtotal: number
  overhead_amount: number
  overhead_pct: number
  margin_amount: number
  margin_pct: number
  pretax_total: number
  tax_rate: number
  tax_amount: number
  total: number
  price_per_sqft: number
}

export function applyPricing(
  takeoff: TakeoffResult,
  config: {
    overhead_pct: number    // e.g. 15
    margin_pct: number      // e.g. 20
    tax_rate: number        // e.g. 6.5
  }
): FinalPricing {
  const overhead_amount = takeoff.subtotal * (config.overhead_pct / 100)
  const with_overhead   = takeoff.subtotal + overhead_amount
  const margin_amount   = with_overhead * (config.margin_pct / 100)
  const pretax_total    = with_overhead + margin_amount
  const tax_amount      = pretax_total * (config.tax_rate / 100)
  const total           = pretax_total + tax_amount

  return {
    subtotal:        Math.round(takeoff.subtotal * 100) / 100,
    overhead_amount: Math.round(overhead_amount * 100) / 100,
    overhead_pct:    config.overhead_pct,
    margin_amount:   Math.round(margin_amount * 100) / 100,
    margin_pct:      config.margin_pct,
    pretax_total:    Math.round(pretax_total * 100) / 100,
    tax_rate:        config.tax_rate,
    tax_amount:      Math.round(tax_amount * 100) / 100,
    total:           Math.round(total * 100) / 100,
    price_per_sqft:  Math.round((total / takeoff.sqft) * 100) / 100
  }
}

// Default contractor config — overridden by ContractorProfile settings
export const DEFAULT_CONTRACTOR_CONFIG = {
  labor_rate: 65,
  material_markup_pct: 25,
  overhead_pct: 15,
  margin_pct: 20,
  tax_rate: 0,
  default_validity_days: 30,
  default_payment_terms: '50% deposit required to schedule. Balance due upon completion.'
}
