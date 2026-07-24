/**
 * XTREME SCRAPER — Proposal HTML Generator
 * Generates a complete HTML proposal from bid data
 * HTML is then converted to PDF via Browserbase or puppeteer
 * No external PDF library needed — pure HTML/CSS → PDF
 */

import type { ParsedBidJob } from './bid-parser'
import type { TakeoffResult, TakeoffLineItem } from './bid-takeoff'
import type { FinalPricing } from './bid-pricing'

export interface ProposalData {
  // Contractor info
  contractor_name: string
  contractor_email: string
  contractor_phone: string
  contractor_address: string
  contractor_license?: string
  contractor_logo_url?: string
  proposal_footer?: string
  // Job info
  job: ParsedBidJob
  takeoff: TakeoffResult
  pricing: FinalPricing
  // Proposal meta
  proposal_number: string
  proposal_date: string
  valid_until: string
  payment_terms: string
  scope_of_work?: string
}

function currency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function lineItemRow(item: TakeoffLineItem): string {
  return `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#111">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#555;text-align:center">${item.quantity} ${item.unit}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;color:#555;text-align:right">${currency(item.unit_cost)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:600;text-align:right">${currency(item.total)}</td>
    </tr>`
}

export function generateProposalHTML(data: ProposalData): string {
  const logoHtml = data.contractor_logo_url
    ? `<img src="${data.contractor_logo_url}" alt="${data.contractor_name}" style="max-height:80px;max-width:240px;object-fit:contain;">`
    : `<div style="font-size:24px;font-weight:900;color:#111;letter-spacing:-1px">${data.contractor_name}</div>`

  const jobTypeLabel: Record<string, string> = {
    epoxy: 'Epoxy Floor Coating',
    polished_concrete: 'Polished Concrete',
    painting: 'Interior / Exterior Painting',
    roofing: 'Roofing',
    flooring: 'Flooring Installation',
    hvac: 'HVAC Services',
    general_contractor: 'General Construction',
    other: 'General Services'
  }

  const scopeText = data.scope_of_work || `Supply and install ${jobTypeLabel[data.job.job_type] || 'services'} at ${data.job.job_address}, ${data.job.job_city}, ${data.job.job_state}. Total area: approximately ${data.takeoff.sqft} square feet.`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proposal ${data.proposal_number}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#fff; color:#111; }
  .page { max-width:820px; margin:0 auto; padding:48px 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; padding-bottom:32px; border-bottom:3px solid #FFBE00; }
  .proposal-label { font-size:13px; font-weight:700; letter-spacing:2px; color:#6B7280; text-transform:uppercase; margin-bottom:6px; }
  .proposal-number { font-size:22px; font-weight:900; color:#111; }
  .meta-row { font-size:12px; color:#6B7280; margin-top:4px; }
  .parties { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-bottom:36px; }
  .party-label { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#FFBE00; margin-bottom:8px; }
  .party-name { font-size:16px; font-weight:700; color:#111; margin-bottom:4px; }
  .party-info { font-size:13px; color:#555; line-height:1.6; }
  .section-title { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#FFBE00; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #F3F4F6; }
  .scope-box { background:#F9FAFB; border-left:4px solid #FFBE00; padding:16px 20px; border-radius:0 8px 8px 0; font-size:14px; color:#374151; line-height:1.7; margin-bottom:32px; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  thead tr { background:#111; }
  thead th { padding:12px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#fff; text-align:left; }
  thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align:right; }
  thead th:nth-child(2) { text-align:center; }
  .totals { margin-left:auto; width:280px; }
  .total-row { display:flex; justify-content:space-between; padding:7px 0; font-size:13px; color:#555; border-bottom:1px solid #F3F4F6; }
  .total-row.main { font-size:16px; font-weight:900; color:#111; background:#FFBE00; padding:12px 16px; border-radius:6px; margin-top:8px; border:none; }
  .terms-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:32px; }
  .terms-box { background:#F9FAFB; border-radius:8px; padding:16px; }
  .terms-label { font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6B7280; margin-bottom:6px; }
  .terms-value { font-size:13px; color:#374151; line-height:1.6; }
  .footer-bar { margin-top:48px; padding-top:24px; border-top:1px solid #E5E7EB; text-align:center; font-size:11px; color:#9CA3AF; }
  .sig-area { margin-top:40px; display:grid; grid-template-columns:1fr 1fr; gap:60px; }
  .sig-line { border-top:1px solid #D1D5DB; padding-top:8px; font-size:12px; color:#6B7280; margin-top:40px; }
  .badge { display:inline-block; background:#111; color:#FFBE00; font-size:10px; font-weight:700; letter-spacing:1px; padding:3px 8px; border-radius:4px; text-transform:uppercase; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>${logoHtml}</div>
    <div style="text-align:right">
      <div class="proposal-label">Proposal</div>
      <div class="proposal-number">#${data.proposal_number}</div>
      <div class="meta-row">Date: ${data.proposal_date}</div>
      <div class="meta-row">Valid Until: ${data.valid_until}</div>
      <div style="margin-top:8px"><span class="badge">AI-Generated Estimate</span></div>
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div>
      <div class="party-label">Prepared By</div>
      <div class="party-name">${data.contractor_name}</div>
      <div class="party-info">
        ${data.contractor_email}<br>
        ${data.contractor_phone}<br>
        ${data.contractor_address}<br>
        ${data.contractor_license ? 'Lic: ' + data.contractor_license : ''}
      </div>
    </div>
    <div>
      <div class="party-label">Prepared For</div>
      <div class="party-name">${data.job.client_name || 'Client'}</div>
      <div class="party-info">
        ${data.job.client_company ? data.job.client_company + '<br>' : ''}
        ${data.job.client_email}<br>
        ${data.job.client_phone}<br>
        ${data.job.job_address}, ${data.job.job_city}, ${data.job.job_state}
      </div>
    </div>
  </div>

  <!-- Scope of Work -->
  <div class="section-title">Scope of Work</div>
  <div class="scope-box">${scopeText}</div>

  <!-- Line Items -->
  <div class="section-title">Itemized Estimate</div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${data.takeoff.line_items.map(lineItemRow).join('')}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${currency(data.pricing.subtotal)}</span></div>
    <div class="total-row"><span>Overhead (${data.pricing.overhead_pct}%)</span><span>${currency(data.pricing.overhead_amount)}</span></div>
    ${data.pricing.tax_rate > 0 ? `<div class="total-row"><span>Tax (${data.pricing.tax_rate}%)</span><span>${currency(data.pricing.tax_amount)}</span></div>` : ''}
    <div class="total-row main"><span>TOTAL</span><span>${currency(data.pricing.total)}</span></div>
    <div style="font-size:11px;color:#9CA3AF;margin-top:8px;text-align:right">${currency(data.pricing.price_per_sqft)}/sqft (${data.takeoff.sqft} sqft)</div>
  </div>

  <!-- Terms -->
  <div class="terms-grid">
    <div class="terms-box">
      <div class="terms-label">Payment Terms</div>
      <div class="terms-value">${data.payment_terms}</div>
    </div>
    <div class="terms-box">
      <div class="terms-label">Project Timeline</div>
      <div class="terms-value">${data.job.timeline_mentioned || 'To be determined upon signed agreement'}</div>
    </div>
  </div>

  <!-- Signatures -->
  <div class="sig-area">
    <div>
      <div class="sig-line">Contractor Signature / Date</div>
      <div style="font-size:12px;color:#6B7280;margin-top:4px">${data.contractor_name}</div>
    </div>
    <div>
      <div class="sig-line">Client Signature / Date</div>
      <div style="font-size:12px;color:#6B7280;margin-top:4px">${data.job.client_name || 'Client'}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer-bar">
    ${data.proposal_footer || 'This proposal is valid for ' + data.valid_until + '. All work guaranteed per industry standards. Questions? Contact us before signing.'}
    <br><span style="color:#FFBE00;font-weight:700">Powered by XTREME AI</span>
  </div>

</div>
</body>
</html>`
}
