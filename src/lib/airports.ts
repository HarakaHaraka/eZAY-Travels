/**
 * Airport directory + helpers.
 *
 * Two jobs:
 *  1. `searchAirports` powers the fare-bar autocomplete when the site runs
 *     without a Duffel key (demo mode), and backs up live suggestions.
 *  2. `displayAirport` turns a bare code into "London Heathrow (LHR)" so no
 *     page ever shows OND-style raw codes again.
 */

export interface AirportEntry {
  code: string;      // IATA code (airport or metro-area)
  name: string;      // full display name
  city: string;      // city for matching ("london" finds all five airports)
  country: string;
  metro?: boolean;   // metro-area code covering all of a city's airports
}

export const AIRPORTS: AirportEntry[] = [
  // London — the metro code first, then every airport
  { code: 'LON', name: 'London (all airports)', city: 'London', country: 'United Kingdom', metro: true },
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom' },
  { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'United Kingdom' },
  { code: 'STN', name: 'London Stansted', city: 'London', country: 'United Kingdom' },
  { code: 'LTN', name: 'London Luton', city: 'London', country: 'United Kingdom' },
  { code: 'LCY', name: 'London City', city: 'London', country: 'United Kingdom' },
  // UK regional
  { code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'United Kingdom' },
  { code: 'BHX', name: 'Birmingham', city: 'Birmingham', country: 'United Kingdom' },
  // East Africa / Horn of Africa
  { code: 'NBO', name: 'Nairobi Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya' },
  { code: 'MBA', name: 'Mombasa Moi International', city: 'Mombasa', country: 'Kenya' },
  { code: 'ADD', name: 'Addis Ababa Bole International', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'MGQ', name: 'Mogadishu Aden Adde International', city: 'Mogadishu', country: 'Somalia' },
  { code: 'HGA', name: 'Hargeisa Egal International', city: 'Hargeisa', country: 'Somaliland' },
  { code: 'JIB', name: 'Djibouti–Ambouli International', city: 'Djibouti', country: 'Djibouti' },
  { code: 'EBB', name: 'Entebbe International', city: 'Entebbe / Kampala', country: 'Uganda' },
  { code: 'DAR', name: 'Dar es Salaam Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzania' },
  { code: 'ZNZ', name: 'Zanzibar Abeid Amani Karume International', city: 'Zanzibar', country: 'Tanzania' },
  { code: 'LOS', name: 'Lagos Murtala Muhammed International', city: 'Lagos', country: 'Nigeria' },
  // Umrah / Gulf
  { code: 'JED', name: 'Jeddah King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'MED', name: 'Madinah Prince Mohammad International', city: 'Madinah', country: 'Saudi Arabia' },
  { code: 'RUH', name: 'Riyadh King Khalid International', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates' },
  { code: 'DOH', name: 'Doha Hamad International', city: 'Doha', country: 'Qatar' },
  { code: 'AUH', name: 'Abu Dhabi Zayed International', city: 'Abu Dhabi', country: 'United Arab Emirates' },
  // Turkey / festival & niche geography
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Türkiye' },
  { code: 'SAW', name: 'Istanbul Sabiha Gökçen', city: 'Istanbul', country: 'Türkiye' },
  { code: 'NAV', name: 'Nevşehir Kapadokya', city: 'Cappadocia / Nevşehir', country: 'Türkiye' },
  { code: 'ASR', name: 'Kayseri Erkilet International', city: 'Kayseri / Cappadocia', country: 'Türkiye' },
  { code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt' },
  { code: 'RAK', name: 'Marrakech Menara', city: 'Marrakech', country: 'Morocco' },
  { code: 'CMN', name: 'Casablanca Mohammed V', city: 'Casablanca', country: 'Morocco' },
  { code: 'SJJ', name: 'Sarajevo International', city: 'Sarajevo', country: 'Bosnia and Herzegovina' },
  { code: 'AGP', name: 'Málaga–Costa del Sol', city: 'Málaga', country: 'Spain' },
  { code: 'SVQ', name: 'Seville', city: 'Seville', country: 'Spain' },
  { code: 'GRX', name: 'Granada', city: 'Granada', country: 'Spain' },
  // South / Southeast Asia
  { code: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { code: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai', country: 'Thailand' },
  { code: 'MNL', name: 'Manila Ninoy Aquino International', city: 'Manila', country: 'Philippines' },
  // Europe
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France' },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy' },
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain' },
  { code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
];

const byCode = new Map(AIRPORTS.map((a) => [a.code, a]));

/** "LHR" → "London Heathrow (LHR)". Unknown codes come back unchanged. */
export function displayAirport(code: string | null | undefined): string {
  if (!code) return '';
  const clean = String(code).toUpperCase().trim();
  const entry = byCode.get(clean);
  return entry ? `${entry.name} (${entry.code})` : clean;
}

/** Local search over the directory — used in demo mode and as live backup. */
export function searchAirports(query: string, limit = 8): AirportEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const starts = (s: string) => s.toLowerCase().startsWith(q);
  const contains = (s: string) => s.toLowerCase().includes(q);

  const scored = AIRPORTS.map((a) => {
    let score = 0;
    if (a.code.toLowerCase() === q) score = 100;
    else if (starts(a.city)) score = 80;
    else if (starts(a.name)) score = 70;
    else if (contains(a.city)) score = 50;
    else if (contains(a.name) || contains(a.country)) score = 30;
    return { a, score };
  })
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score || Number(!!y.a.metro) - Number(!!x.a.metro));

  return scored.slice(0, limit).map((s) => s.a);
}
