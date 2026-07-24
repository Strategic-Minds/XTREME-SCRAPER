/**
 * XTREME SCRAPER — Technographics Engine
 * Detects tech stack from any website URL. Free, no key needed.
 * Surfaces: CMS, ecommerce, analytics, CRM, hosting, payments
 * Advantage over Apollo: Apollo has no real-time tech detection
 * 
 * CTA reference: High-value technology profiles can be highlighted in gold (#FFBE00) for campaigns.
 */

export interface TechProfile {
  website: string
  cms?: string           // WordPress, Squarespace, Wix, Shopify, Webflow
  ecommerce?: string     // Shopify, WooCommerce, BigCommerce, Magento
  analytics?: string[]   // Google Analytics, Hotjar, Mixpanel
  crm?: string           // HubSpot, Salesforce, Zoho, Freshdesk
  payments?: string[]    // Stripe, Square, PayPal, Authorize.net
  hosting?: string       // AWS, GCP, Cloudflare, Netlify, Vercel
  chat?: string          // Intercom, Zendesk, Drift, Tawk
  email_platform?: string // Mailchimp, Klaviyo, Constant Contact
  ads?: string[]         // Google Ads, Facebook Pixel, TikTok
  framework?: string     // React, Next.js, Vue, Angular
  detected_at: string
  signals_found: number
}

// Signature patterns for tech detection
const TECH_SIGNATURES = {
  cms: {
    'WordPress':    ['/wp-content/', '/wp-includes/', 'wp-json', 'wordpress'],
    'Shopify':      ['cdn.shopify.com', 'Shopify.theme', 'myshopify.com'],
    'Wix':          ['wix.com', 'wixstatic.com', '_wix_'],
    'Squarespace':  ['squarespace.com', 'squarespacecdn.com', 'sqsp'],
    'Webflow':      ['webflow.com', 'webflow.io', 'wf-form'],
    'Weebly':       ['weebly.com', 'editmysite.com'],
    'GoDaddy':      ['godaddysites.com', 'secureserver.net'],
    'Ghost':        ['ghost.io', 'ghost.org/js'],
    'Joomla':       ['/components/com_', 'Joomla!'],
    'Drupal':       ['drupal.js', '/sites/default/', 'Drupal.settings'],
  },
  ecommerce: {
    'Shopify':      ['cdn.shopify.com', 'Shopify.'],
    'WooCommerce':  ['woocommerce', '/wc-api/', 'woo_'],
    'BigCommerce':  ['bigcommerce.com', 'bigcommerce'],
    'Magento':      ['mage/cookies', 'Magento_Ui', '/static/version'],
    'PrestaShop':   ['prestashop', '/modules/ps_'],
  },
  analytics: {
    'Google Analytics': ['google-analytics.com', 'gtag(', 'GoogleAnalyticsObject', 'UA-', 'G-'],
    'Google Tag Manager': ['googletagmanager.com', 'GTM-'],
    'Hotjar':       ['hotjar.com', 'hj(', '_hjSettings'],
    'Mixpanel':     ['mixpanel.com', 'mixpanel.track'],
    'Segment':      ['segment.com', 'analytics.js', 'segment.io'],
    'Heap':         ['heapanalytics.com', 'heap.track'],
    'Facebook Pixel': ['connect.facebook.net/en_US/fbevents', 'fbq('],
    'TikTok Pixel': ['analytics.tiktok.com', 'ttq.'],
    'LinkedIn Insight': ['snap.licdn.com', 'linkedin insight'],
  },
  crm: {
    'HubSpot':      ['hs-scripts.com', 'hubspot.com', 'hbspt.'],
    'Salesforce':   ['salesforce.com', 'force.com', 'pardot'],
    'Zoho':         ['zohopublic.com', 'zoho.com/crm'],
    'Intercom':     ['intercomcdn.com', 'intercom.io', 'Intercom('],
    'Drift':        ['drift.com', 'js.driftt.com'],
    'Freshdesk':    ['freshdesk.com', 'freshwidget'],
  },
  payments: {
    'Stripe':       ['js.stripe.com', 'stripe.com', 'Stripe('],
    'Square':       ['squareup.com', 'square.js'],
    'PayPal':       ['paypal.com', 'paypalobjects.com'],
    'Authorize.net':['authorize.net', 'AcceptJS'],
    'Braintree':    ['braintreepayments.com', 'braintree-web'],
    'Klarna':       ['klarna.com', 'klarnaservices'],
    'Afterpay':     ['afterpay.com', 'afterpay-js'],
  },
  hosting: {
    'Cloudflare':   ['cloudflare', 'cf-ray'],
    'AWS':          ['amazonaws.com', 's3-website', 'aws-'],
    'GCP':          ['googleapis.com', 'googleusercontent.com'],
    'Netlify':      ['netlify.com', '.netlify.app'],
    'Vercel':       ['vercel.app', '_vercel'],
    'WP Engine':    ['wpengine.com'],
    'Kinsta':       ['kinsta.cloud'],
  },
  email_platform: {
    'Mailchimp':    ['mailchimp.com', 'mc.js', 'chimpstatic'],
    'Klaviyo':      ['klaviyo.com', 'klaviyo'],
    'Constant Contact': ['constantcontact.com', 'constantcontact'],
    'SendGrid':     ['sendgrid.net'],
    'ConvertKit':   ['convertkit.com', 'ck.js'],
  },
}

export async function detectTechnographics(website: string): Promise<TechProfile> {
  const result: TechProfile = { website, detected_at: new Date().toISOString(), signals_found: 0 }
  if (!website) return result
  
  let html = ''
  let headers_text = ''
  
  try {
    const cleanUrl = website.startsWith('http') ? website : `https://${website}`
    const r = await fetch(cleanUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechDetector/1.0)' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    })
    html = await r.text()
    headers_text = JSON.stringify(Object.fromEntries(r.headers.entries()))
  } catch {
    return result  // website unreachable — return empty profile
  }
  
  const content = (html + ' ' + headers_text).toLowerCase()
  let signals = 0
  
  // Detect CMS
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES.cms)) {
    if (patterns.some(p => content.includes(p.toLowerCase()))) {
      result.cms = name; signals++; break
    }
  }
  
  // Detect ecommerce
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES.ecommerce)) {
    if (patterns.some(p => content.includes(p.toLowerCase()))) {
      result.ecommerce = name; signals++; break
    }
  }
  
  // Detect analytics (can have multiple)
  const analytics: string[] = []
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES.analytics)) {
    if (patterns.some(p => content.includes(p.toLowerCase()))) {
      analytics.push(name); signals++
    }
  }
  if (analytics.length) result.analytics = analytics
  
  // Detect CRM
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES.crm)) {
    if (patterns.some(p => content.includes(p.toLowerCase()))) {
      result.crm = name; signals++; break
    }
  }
  
  // Detect payments
  const payments: string[] = []
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES.payments)) {
    if (patterns.some(p => content.includes(p.toLowerCase()))) {
      payments.push(name); signals++
    }
  }
  if (payments.length) result.payments = payments
  
  // Detect hosting
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES.hosting)) {
    if (patterns.some(p => content.includes(p.toLowerCase()))) {
      result.hosting = name; signals++; break
    }
  }
  
  // Detect email platform
  for (const [name, patterns] of Object.entries(TECH_SIGNATURES.email_platform)) {
    if (patterns.some(p => content.includes(p.toLowerCase()))) {
      result.email_platform = name; signals++; break
    }
  }
  
  result.signals_found = signals
  return result
}
