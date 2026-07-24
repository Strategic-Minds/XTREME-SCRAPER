export type SearchMode = 'quick' | 'deep' | 'max' | 'level5'

const NEARBY_COORDINATE_CITIES = new Set([
  'phoenix','scottsdale','mesa','tempe','chandler','gilbert','glendale','tucson',
  'los angeles','san diego','san francisco','las vegas','denver','dallas','houston','austin',
  'miami','orlando','atlanta','chicago','new york','boston','seattle','portland','nashville',
  'charlotte','tampa','minneapolis','salt lake city','albuquerque','kansas city','omaha','raleigh',
  'columbus','cleveland','detroit','sacramento','el paso','san antonio','fort worth','jacksonville',
  'memphis','louisville','richmond',
])

export function protectLocationMode(city: string, requested: SearchMode): {
  mode: SearchMode
  locationStrategy: 'text-search' | 'text-and-nearby'
  warning?: string
} {
  const normalized = city.toLowerCase().trim()
  if (!normalized || NEARBY_COORDINATE_CITIES.has(normalized)) {
    return { mode: requested, locationStrategy: normalized ? 'text-and-nearby' : 'text-search' }
  }
  if (requested === 'quick') return { mode: 'quick', locationStrategy: 'text-search' }
  return {
    mode: 'quick',
    locationStrategy: 'text-search',
    warning: `Nearby-radius search was disabled for ${city} because verified coordinates are not configured. Text and directory search continued without substituting another city.`,
  }
}
