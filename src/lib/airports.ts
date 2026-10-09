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
  lat?: number;      // for nearest-airport lookup
  lon?: number;
}

export const AIRPORTS: AirportEntry[] = [
  // London — the metro code first, then every airport
  { code: 'LON', name: 'London (all airports)', city: 'London', country: 'United Kingdom', metro: true, lat: 51.5, lon: -0.12 },
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'United Kingdom', lat: 51.47, lon: -0.46 },
  { code: 'LGW', name: 'London Gatwick', city: 'London', country: 'United Kingdom', lat: 51.15, lon: -0.19 },
  { code: 'STN', name: 'London Stansted', city: 'London', country: 'United Kingdom', lat: 51.89, lon: 0.26 },
  { code: 'LTN', name: 'London Luton', city: 'London', country: 'United Kingdom', lat: 51.87, lon: -0.37 },
  { code: 'LCY', name: 'London City', city: 'London', country: 'United Kingdom', lat: 51.5, lon: 0.05 },
  // UK regional
  { code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'United Kingdom', lat: 53.36, lon: -2.27 },
  { code: 'BHX', name: 'Birmingham', city: 'Birmingham', country: 'United Kingdom', lat: 52.45, lon: -1.75 },
  // East Africa / Horn of Africa
  { code: 'NBO', name: 'Nairobi Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', lat: -1.32, lon: 36.93 },
  { code: 'MBA', name: 'Mombasa Moi International', city: 'Mombasa', country: 'Kenya', lat: -4.03, lon: 39.59 },
  { code: 'ADD', name: 'Addis Ababa Bole International', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.98, lon: 38.8 },
  { code: 'MGQ', name: 'Mogadishu Aden Adde International', city: 'Mogadishu', country: 'Somalia', lat: 2.01, lon: 45.3 },
  { code: 'HGA', name: 'Hargeisa Egal International', city: 'Hargeisa', country: 'Somaliland', lat: 9.52, lon: 44.09 },
  { code: 'JIB', name: 'Djibouti–Ambouli International', city: 'Djibouti', country: 'Djibouti', lat: 11.55, lon: 43.16 },
  { code: 'EBB', name: 'Entebbe International', city: 'Entebbe / Kampala', country: 'Uganda', lat: 0.04, lon: 32.44 },
  { code: 'DAR', name: 'Dar es Salaam Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzania', lat: -6.88, lon: 39.2 },
  { code: 'ZNZ', name: 'Zanzibar Abeid Amani Karume International', city: 'Zanzibar', country: 'Tanzania', lat: -6.22, lon: 39.22 },
  { code: 'LOS', name: 'Lagos Murtala Muhammed International', city: 'Lagos', country: 'Nigeria', lat: 6.58, lon: 3.32 },
  // Umrah / Gulf
  { code: 'JED', name: 'Jeddah King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia', lat: 21.68, lon: 39.16 },
  { code: 'MED', name: 'Madinah Prince Mohammad International', city: 'Madinah', country: 'Saudi Arabia', lat: 24.55, lon: 39.7 },
  { code: 'RUH', name: 'Riyadh King Khalid International', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.96, lon: 46.7 },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'United Arab Emirates', lat: 25.25, lon: 55.36 },
  { code: 'DOH', name: 'Doha Hamad International', city: 'Doha', country: 'Qatar', lat: 25.27, lon: 51.61 },
  { code: 'AUH', name: 'Abu Dhabi Zayed International', city: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.43, lon: 54.65 },
  // Turkey / festival & niche geography
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Türkiye', lat: 41.26, lon: 28.74 },
  { code: 'SAW', name: 'Istanbul Sabiha Gökçen', city: 'Istanbul', country: 'Türkiye', lat: 40.9, lon: 29.31 },
  { code: 'NAV', name: 'Nevşehir Kapadokya', city: 'Cappadocia / Nevşehir', country: 'Türkiye', lat: 38.77, lon: 34.53 },
  { code: 'ASR', name: 'Kayseri Erkilet International', city: 'Kayseri / Cappadocia', country: 'Türkiye', lat: 38.77, lon: 35.5 },
  { code: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt', lat: 30.12, lon: 31.41 },
  { code: 'RAK', name: 'Marrakech Menara', city: 'Marrakech', country: 'Morocco', lat: 31.61, lon: -8.04 },
  { code: 'CMN', name: 'Casablanca Mohammed V', city: 'Casablanca', country: 'Morocco', lat: 33.37, lon: -7.59 },
  { code: 'SJJ', name: 'Sarajevo International', city: 'Sarajevo', country: 'Bosnia and Herzegovina', lat: 43.82, lon: 18.33 },
  { code: 'AGP', name: 'Málaga–Costa del Sol', city: 'Málaga', country: 'Spain', lat: 36.68, lon: -4.5 },
  { code: 'SVQ', name: 'Seville', city: 'Seville', country: 'Spain', lat: 37.42, lon: -5.9 },
  { code: 'GRX', name: 'Granada', city: 'Granada', country: 'Spain', lat: 37.19, lon: -3.78 },
  // South / Southeast Asia
  { code: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok', country: 'Thailand', lat: 13.69, lon: 100.75 },
  { code: 'CNX', name: 'Chiang Mai International', city: 'Chiang Mai', country: 'Thailand', lat: 18.77, lon: 98.96 },
  { code: 'MNL', name: 'Manila Ninoy Aquino International', city: 'Manila', country: 'Philippines', lat: 14.51, lon: 121.02 },
  // Europe
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.01, lon: 2.55 },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', lat: 48.73, lon: 2.36 },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.31, lon: 4.76 },
  { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8, lon: 12.25 },
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain', lat: 40.47, lon: -3.56 },
  { code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland', lat: 46.24, lon: 6.11 },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany', lat: 50.03, lon: 8.57 },

  // Italy
  { code: 'MIL', name: 'Milan (all airports)', city: 'Milan', country: 'Italy', metro: true, lat: 45.46, lon: 9.19 },
  { code: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', lat: 45.63, lon: 8.72 },
  { code: 'LIN', name: 'Milan Linate', city: 'Milan', country: 'Italy', lat: 45.45, lon: 9.28 },
  { code: 'BGY', name: 'Milan Bergamo (Orio al Serio)', city: 'Bergamo / Milan', country: 'Italy', lat: 45.67, lon: 9.7 },
  { code: 'VRN', name: 'Verona Villafranca', city: 'Verona', country: 'Italy', lat: 45.4, lon: 10.89 },
  { code: 'VBS', name: 'Brescia Montichiari', city: 'Brescia', country: 'Italy', lat: 45.43, lon: 10.33 },
  { code: 'VCE', name: 'Venice Marco Polo', city: 'Venice', country: 'Italy', lat: 45.5, lon: 12.35 },
  { code: 'TSF', name: 'Treviso (Venice)', city: 'Treviso / Venice', country: 'Italy', lat: 45.65, lon: 12.19 },
  { code: 'BLQ', name: 'Bologna Guglielmo Marconi', city: 'Bologna', country: 'Italy', lat: 44.53, lon: 11.29 },
  { code: 'FLR', name: 'Florence Peretola', city: 'Florence', country: 'Italy', lat: 43.81, lon: 11.2 },
  { code: 'PSA', name: 'Pisa Galileo Galilei', city: 'Pisa / Florence', country: 'Italy', lat: 43.68, lon: 10.39 },
  { code: 'TRN', name: 'Turin Caselle', city: 'Turin', country: 'Italy', lat: 45.2, lon: 7.65 },
  { code: 'GOA', name: 'Genoa', city: 'Genoa', country: 'Italy', lat: 44.41, lon: 8.84 },
  { code: 'CIA', name: 'Rome Ciampino', city: 'Rome', country: 'Italy', lat: 41.8, lon: 12.59 },
  { code: 'NAP', name: 'Naples Capodichino', city: 'Naples', country: 'Italy', lat: 40.88, lon: 14.29 },
  { code: 'BRI', name: 'Bari Karol Wojtyła', city: 'Bari', country: 'Italy', lat: 41.14, lon: 16.76 },
  { code: 'PMO', name: 'Palermo Falcone Borsellino', city: 'Palermo', country: 'Italy', lat: 38.18, lon: 13.1 },
  { code: 'CTA', name: 'Catania Fontanarossa', city: 'Catania', country: 'Italy', lat: 37.47, lon: 15.07 },
  { code: 'CAG', name: 'Cagliari Elmas', city: 'Cagliari', country: 'Italy', lat: 39.25, lon: 9.05 },
  { code: 'OLB', name: 'Olbia Costa Smeralda', city: 'Olbia', country: 'Italy', lat: 40.9, lon: 9.52 },
  // Balkans and Adriatic
  { code: 'TIV', name: 'Tivat', city: 'Tivat / Budva / Kotor', country: 'Montenegro', lat: 42.4, lon: 18.72 },
  { code: 'TGD', name: 'Podgorica', city: 'Podgorica', country: 'Montenegro', lat: 42.36, lon: 19.25 },
  { code: 'DBV', name: 'Dubrovnik', city: 'Dubrovnik', country: 'Croatia', lat: 42.56, lon: 18.27 },
  { code: 'SPU', name: 'Split', city: 'Split', country: 'Croatia', lat: 43.54, lon: 16.3 },
  { code: 'ZAD', name: 'Zadar', city: 'Zadar', country: 'Croatia', lat: 44.11, lon: 15.35 },
  { code: 'ZAG', name: 'Zagreb', city: 'Zagreb', country: 'Croatia', lat: 45.74, lon: 16.07 },
  { code: 'TIA', name: 'Tirana', city: 'Tirana', country: 'Albania', lat: 41.41, lon: 19.72 },
  { code: 'BEG', name: 'Belgrade Nikola Tesla', city: 'Belgrade', country: 'Serbia', lat: 44.82, lon: 20.29 },
  { code: 'SKP', name: 'Skopje', city: 'Skopje', country: 'North Macedonia', lat: 41.96, lon: 21.62 },
  { code: 'PRN', name: 'Pristina', city: 'Pristina', country: 'Kosovo', lat: 42.57, lon: 21.04 },
  { code: 'LJU', name: 'Ljubljana', city: 'Ljubljana', country: 'Slovenia', lat: 46.22, lon: 14.46 },
  { code: 'SOF', name: 'Sofia', city: 'Sofia', country: 'Bulgaria', lat: 42.7, lon: 23.41 },
  { code: 'ATH', name: 'Athens Eleftherios Venizelos', city: 'Athens', country: 'Greece', lat: 37.94, lon: 23.94 },
  { code: 'SKG', name: 'Thessaloniki', city: 'Thessaloniki', country: 'Greece', lat: 40.52, lon: 22.97 },
  { code: 'CFU', name: 'Corfu', city: 'Corfu', country: 'Greece', lat: 39.6, lon: 19.91 },
  { code: 'HER', name: 'Heraklion (Crete)', city: 'Heraklion / Crete', country: 'Greece', lat: 35.34, lon: 25.18 },
  { code: 'RHO', name: 'Rhodes', city: 'Rhodes', country: 'Greece', lat: 36.41, lon: 28.09 },
  { code: 'JTR', name: 'Santorini', city: 'Santorini', country: 'Greece', lat: 36.4, lon: 25.48 },
  // Türkiye resorts
  { code: 'AYT', name: 'Antalya', city: 'Antalya', country: 'Türkiye', lat: 36.9, lon: 30.8 },
  { code: 'DLM', name: 'Dalaman', city: 'Dalaman / Marmaris / Fethiye', country: 'Türkiye', lat: 36.71, lon: 28.79 },
  { code: 'BJV', name: 'Bodrum Milas', city: 'Bodrum', country: 'Türkiye', lat: 37.25, lon: 27.66 },
  { code: 'ADB', name: 'İzmir Adnan Menderes', city: 'İzmir', country: 'Türkiye', lat: 38.29, lon: 27.16 },
  { code: 'ESB', name: 'Ankara Esenboğa', city: 'Ankara', country: 'Türkiye', lat: 40.13, lon: 32.99 },
  // Spain, Portugal, France
  { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain', lat: 41.3, lon: 2.08 },
  { code: 'ALC', name: 'Alicante–Elche', city: 'Alicante / Benidorm', country: 'Spain', lat: 38.28, lon: -0.56 },
  { code: 'VLC', name: 'Valencia', city: 'Valencia', country: 'Spain', lat: 39.49, lon: -0.48 },
  { code: 'PMI', name: 'Palma de Mallorca', city: 'Palma / Mallorca', country: 'Spain', lat: 39.55, lon: 2.74 },
  { code: 'IBZ', name: 'Ibiza', city: 'Ibiza', country: 'Spain', lat: 38.87, lon: 1.37 },
  { code: 'TFS', name: 'Tenerife South', city: 'Tenerife', country: 'Spain', lat: 28.04, lon: -16.57 },
  { code: 'LPA', name: 'Gran Canaria', city: 'Las Palmas / Gran Canaria', country: 'Spain', lat: 27.93, lon: -15.39 },
  { code: 'ACE', name: 'Lanzarote', city: 'Lanzarote', country: 'Spain', lat: 28.95, lon: -13.6 },
  { code: 'LIS', name: 'Lisbon Humberto Delgado', city: 'Lisbon', country: 'Portugal', lat: 38.77, lon: -9.13 },
  { code: 'OPO', name: 'Porto', city: 'Porto', country: 'Portugal', lat: 41.24, lon: -8.68 },
  { code: 'FAO', name: 'Faro (Algarve)', city: 'Faro / Algarve', country: 'Portugal', lat: 37.01, lon: -7.97 },
  { code: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice / Cannes / Monaco', country: 'France', lat: 43.66, lon: 7.22 },
  { code: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France', lat: 43.44, lon: 5.22 },
  { code: 'LYS', name: 'Lyon Saint-Exupéry', city: 'Lyon', country: 'France', lat: 45.73, lon: 5.08 },
  { code: 'BOD', name: 'Bordeaux Mérignac', city: 'Bordeaux', country: 'France', lat: 44.83, lon: -0.72 },
  { code: 'TLS', name: 'Toulouse Blagnac', city: 'Toulouse', country: 'France', lat: 43.63, lon: 1.37 },
  // Rest of Europe
  { code: 'BRU', name: 'Brussels', city: 'Brussels', country: 'Belgium', lat: 50.9, lon: 4.48 },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany', lat: 48.35, lon: 11.79 },
  { code: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', country: 'Germany', lat: 52.37, lon: 13.5 },
  { code: 'ZRH', name: 'Zürich', city: 'Zürich', country: 'Switzerland', lat: 47.46, lon: 8.55 },
  { code: 'VIE', name: 'Vienna', city: 'Vienna', country: 'Austria', lat: 48.11, lon: 16.57 },
  { code: 'PRG', name: 'Prague', city: 'Prague', country: 'Czechia', lat: 50.1, lon: 14.26 },
  { code: 'BUD', name: 'Budapest', city: 'Budapest', country: 'Hungary', lat: 47.44, lon: 19.26 },
  { code: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland', lat: 52.17, lon: 20.97 },
  { code: 'KRK', name: 'Kraków', city: 'Kraków', country: 'Poland', lat: 50.08, lon: 19.78 },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark', lat: 55.62, lon: 12.65 },
  { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.19, lon: 11.1 },
  { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden', lat: 59.65, lon: 17.92 },
  { code: 'HEL', name: 'Helsinki', city: 'Helsinki', country: 'Finland', lat: 60.32, lon: 24.96 },
  { code: 'KEF', name: 'Reykjavík Keflavík', city: 'Reykjavík', country: 'Iceland', lat: 63.98, lon: -22.6 },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland', lat: 53.42, lon: -6.27 },
  // UK regional
  { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'United Kingdom', lat: 55.95, lon: -3.37 },
  { code: 'GLA', name: 'Glasgow', city: 'Glasgow', country: 'United Kingdom', lat: 55.87, lon: -4.43 },
  { code: 'BRS', name: 'Bristol', city: 'Bristol', country: 'United Kingdom', lat: 51.38, lon: -2.72 },
  { code: 'LPL', name: 'Liverpool John Lennon', city: 'Liverpool', country: 'United Kingdom', lat: 53.33, lon: -2.85 },
  { code: 'NCL', name: 'Newcastle', city: 'Newcastle', country: 'United Kingdom', lat: 55.04, lon: -1.69 },
  { code: 'LBA', name: 'Leeds Bradford', city: 'Leeds', country: 'United Kingdom', lat: 53.87, lon: -1.66 },
  { code: 'EMA', name: 'East Midlands', city: 'Nottingham / Derby / Leicester', country: 'United Kingdom', lat: 52.83, lon: -1.33 },
  { code: 'SEN', name: 'London Southend', city: 'London', country: 'United Kingdom', lat: 51.57, lon: 0.7 },
  // North Africa and Middle East
  { code: 'TNG', name: 'Tangier Ibn Battouta', city: 'Tangier', country: 'Morocco', lat: 35.73, lon: -5.92 },
  { code: 'AGA', name: 'Agadir Al Massira', city: 'Agadir', country: 'Morocco', lat: 30.33, lon: -9.41 },
  { code: 'FEZ', name: 'Fès Saïss', city: 'Fès', country: 'Morocco', lat: 33.93, lon: -4.98 },
  { code: 'RBA', name: 'Rabat Salé', city: 'Rabat', country: 'Morocco', lat: 34.05, lon: -6.75 },
  { code: 'TUN', name: 'Tunis Carthage', city: 'Tunis', country: 'Tunisia', lat: 36.85, lon: 10.23 },
  { code: 'NBE', name: 'Enfidha–Hammamet', city: 'Hammamet / Sousse', country: 'Tunisia', lat: 36.08, lon: 10.44 },
  { code: 'DJE', name: 'Djerba–Zarzis', city: 'Djerba', country: 'Tunisia', lat: 33.88, lon: 10.78 },
  { code: 'ALG', name: 'Algiers Houari Boumediene', city: 'Algiers', country: 'Algeria', lat: 36.69, lon: 3.22 },
  { code: 'SPX', name: 'Cairo Sphinx International', city: 'Cairo / Giza', country: 'Egypt', lat: 30.11, lon: 30.9 },
  { code: 'HRG', name: 'Hurghada', city: 'Hurghada', country: 'Egypt', lat: 27.18, lon: 33.8 },
  { code: 'SSH', name: 'Sharm El Sheikh', city: 'Sharm El Sheikh', country: 'Egypt', lat: 27.98, lon: 34.39 },
  { code: 'LXR', name: 'Luxor', city: 'Luxor', country: 'Egypt', lat: 25.67, lon: 32.71 },
  { code: 'AMM', name: 'Amman Queen Alia', city: 'Amman', country: 'Jordan', lat: 31.72, lon: 35.99 },
  { code: 'BEY', name: 'Beirut Rafic Hariri', city: 'Beirut', country: 'Lebanon', lat: 33.82, lon: 35.49 },
  { code: 'TLV', name: 'Tel Aviv Ben Gurion', city: 'Tel Aviv', country: 'Israel', lat: 32.01, lon: 34.89 },
  { code: 'MCT', name: 'Muscat', city: 'Muscat', country: 'Oman', lat: 23.59, lon: 58.28 },
  { code: 'BAH', name: 'Bahrain', city: 'Manama', country: 'Bahrain', lat: 26.27, lon: 50.63 },
  { code: 'KWI', name: 'Kuwait', city: 'Kuwait City', country: 'Kuwait', lat: 29.23, lon: 47.97 },
  { code: 'SHJ', name: 'Sharjah', city: 'Sharjah', country: 'United Arab Emirates', lat: 25.33, lon: 55.52 },
  { code: 'DMM', name: 'Dammam King Fahd', city: 'Dammam', country: 'Saudi Arabia', lat: 26.47, lon: 49.8 },
  // Africa
  { code: 'JRO', name: 'Kilimanjaro', city: 'Arusha / Moshi', country: 'Tanzania', lat: -3.43, lon: 37.07 },
  { code: 'KGL', name: 'Kigali', city: 'Kigali', country: 'Rwanda', lat: -1.97, lon: 30.14 },
  { code: 'KRT', name: 'Khartoum', city: 'Khartoum', country: 'Sudan', lat: 15.59, lon: 32.55 },
  { code: 'ACC', name: 'Accra Kotoka', city: 'Accra', country: 'Ghana', lat: 5.6, lon: -0.17 },
  { code: 'ABV', name: 'Abuja', city: 'Abuja', country: 'Nigeria', lat: 9.01, lon: 7.26 },
  { code: 'DSS', name: 'Dakar Blaise Diagne', city: 'Dakar', country: 'Senegal', lat: 14.67, lon: -17.07 },
  { code: 'BJL', name: 'Banjul', city: 'Banjul', country: 'Gambia', lat: 13.34, lon: -16.65 },
  { code: 'JNB', name: 'Johannesburg O. R. Tambo', city: 'Johannesburg', country: 'South Africa', lat: -26.14, lon: 28.25 },
  { code: 'CPT', name: 'Cape Town', city: 'Cape Town', country: 'South Africa', lat: -33.97, lon: 18.6 },
  { code: 'MRU', name: 'Mauritius', city: 'Mauritius', country: 'Mauritius', lat: -20.43, lon: 57.68 },
  // Asia and Americas
  { code: 'DEL', name: 'Delhi Indira Gandhi', city: 'Delhi', country: 'India', lat: 28.57, lon: 77.1 },
  { code: 'BOM', name: 'Mumbai', city: 'Mumbai', country: 'India', lat: 19.09, lon: 72.87 },
  { code: 'LHE', name: 'Lahore', city: 'Lahore', country: 'Pakistan', lat: 31.52, lon: 74.4 },
  { code: 'ISB', name: 'Islamabad', city: 'Islamabad', country: 'Pakistan', lat: 33.56, lon: 72.85 },
  { code: 'KHI', name: 'Karachi', city: 'Karachi', country: 'Pakistan', lat: 24.91, lon: 67.16 },
  { code: 'DAC', name: 'Dhaka', city: 'Dhaka', country: 'Bangladesh', lat: 23.84, lon: 90.4 },
  { code: 'CMB', name: 'Colombo', city: 'Colombo', country: 'Sri Lanka', lat: 7.18, lon: 79.88 },
  { code: 'KUL', name: 'Kuala Lumpur', city: 'Kuala Lumpur', country: 'Malaysia', lat: 2.75, lon: 101.71 },
  { code: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.36, lon: 103.99 },
  { code: 'HKT', name: 'Phuket', city: 'Phuket', country: 'Thailand', lat: 8.11, lon: 98.31 },
  { code: 'DPS', name: 'Bali Denpasar', city: 'Bali', country: 'Indonesia', lat: -8.75, lon: 115.17 },
  { code: 'CGK', name: 'Jakarta Soekarno–Hatta', city: 'Jakarta', country: 'Indonesia', lat: -6.13, lon: 106.66 },
  { code: 'HKG', name: 'Hong Kong', city: 'Hong Kong', country: 'Hong Kong', lat: 22.31, lon: 113.92 },
  { code: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', lat: 35.77, lon: 140.39 },
  { code: 'NYC', name: 'New York (all airports)', city: 'New York', country: 'United States', metro: true, lat: 40.71, lon: -74.01 },
  { code: 'JFK', name: 'New York JFK', city: 'New York', country: 'United States', lat: 40.64, lon: -73.78 },
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', lat: 43.68, lon: -79.63 },
];

/**
 * Places people type that have no airport of their own (or a tiny one), with
 * the airports that actually serve them, nearest first. The search returns
 * these labelled "nearest airport to X" instead of "no results".
 */
export const PLACE_ALIASES: Array<{ names: string[]; airports: string[] }> = [
  { names: ['brescia', 'lago di garda', 'lake garda', 'sirmione', 'desenzano'], airports: ['BGY', 'VRN', 'VBS'] },
  { names: ['como', 'lake como', 'lecco', 'varese'], airports: ['MXP', 'LIN', 'BGY'] },
  { names: ['monza', 'pavia', 'lodi', 'cremona'], airports: ['LIN', 'MXP', 'BGY'] },
  { names: ['padova', 'padua', 'vicenza', 'rovigo'], airports: ['VCE', 'TSF', 'VRN'] },
  { names: ['trento', 'trentino', 'bolzano', 'dolomites', 'dolomiti'], airports: ['VRN', 'VCE', 'BGY'] },
  { names: ['parma', 'modena', 'reggio emilia', 'ferrara', 'ravenna', 'rimini', 'riccione'], airports: ['BLQ', 'VCE', 'FLR'] },
  { names: ['siena', 'lucca', 'tuscany', 'toscana', 'chianti', 'san gimignano'], airports: ['FLR', 'PSA', 'BLQ'] },
  { names: ['cinque terre', 'la spezia', 'portofino', 'rapallo', 'sanremo'], airports: ['GOA', 'PSA', 'NCE'] },
  { names: ['amalfi', 'sorrento', 'positano', 'capri', 'pompeii', 'salerno'], airports: ['NAP'] },
  { names: ['lecce', 'puglia', 'brindisi', 'ostuni', 'alberobello', 'polignano'], airports: ['BRI'] },
  { names: ['taormina', 'siracusa', 'syracuse', 'noto'], airports: ['CTA', 'PMO'] },
  { names: ['budva', 'kotor', 'herceg novi', 'perast', 'bar', 'ulcinj', 'sveti stefan', 'montenegro'], airports: ['TIV', 'TGD', 'DBV'] },
  { names: ['mostar', 'medjugorje', 'neum'], airports: ['SJJ', 'SPU', 'DBV'] },
  { names: ['hvar', 'brac', 'trogir', 'makarska', 'omis'], airports: ['SPU', 'DBV'] },
  { names: ['korcula', 'cavtat', 'ston'], airports: ['DBV', 'SPU'] },
  { names: ['saranda', 'ksamil', 'vlore', 'durres', 'shkoder', 'albanian riviera'], airports: ['TIA', 'CFU'] },
  { names: ['ohrid'], airports: ['SKP', 'TIA'] },
  { names: ['bled', 'lake bled', 'piran', 'portoroz'], airports: ['LJU', 'TSF', 'ZAG'] },
  { names: ['mykonos', 'paros', 'naxos'], airports: ['JTR', 'ATH'] },
  { names: ['chania', 'rethymno', 'crete', 'kriti'], airports: ['HER'] },
  { names: ['halkidiki', 'chalkidiki'], airports: ['SKG'] },
  { names: ['marmaris', 'fethiye', 'olu deniz', 'oludeniz', 'kas', 'kalkan', 'dalyan', 'icmeler'], airports: ['DLM', 'AYT'] },
  { names: ['alanya', 'side', 'belek', 'kemer', 'lara'], airports: ['AYT'] },
  { names: ['kusadasi', 'ephesus', 'cesme', 'pamukkale', 'selcuk'], airports: ['ADB', 'BJV'] },
  { names: ['cappadocia', 'goreme', 'kapadokya', 'urgup'], airports: ['NAV', 'ASR'] },
  { names: ['bursa', 'yalova', 'sapanca'], airports: ['SAW', 'IST'] },
  { names: ['benidorm', 'torrevieja', 'calpe', 'javea', 'altea', 'costa blanca'], airports: ['ALC', 'VLC'] },
  { names: ['marbella', 'torremolinos', 'fuengirola', 'nerja', 'estepona', 'costa del sol', 'ronda', 'gibraltar'], airports: ['AGP', 'SVQ'] },
  { names: ['cordoba', 'cadiz', 'jerez', 'huelva'], airports: ['SVQ', 'AGP'] },
  { names: ['salou', 'tarragona', 'sitges', 'lloret', 'costa brava', 'girona', 'figueres'], airports: ['BCN'] },
  { names: ['magaluf', 'alcudia', 'pollensa', 'mallorca', 'majorca'], airports: ['PMI'] },
  { names: ['menorca', 'minorca', 'mahon'], airports: ['PMI', 'BCN'] },
  { names: ['lagos portugal', 'albufeira', 'vilamoura', 'portimao', 'tavira', 'algarve'], airports: ['FAO'] },
  { names: ['cascais', 'sintra', 'estoril', 'ericeira'], airports: ['LIS'] },
  { names: ['cannes', 'antibes', 'monaco', 'monte carlo', 'menton', 'saint tropez', 'st tropez'], airports: ['NCE', 'MRS'] },
  { names: ['aix en provence', 'avignon', 'arles', 'cassis'], airports: ['MRS', 'NCE'] },
  { names: ['bruges', 'ghent', 'antwerp'], airports: ['BRU', 'AMS'] },
  { names: ['essaouira', 'ourika', 'ouarzazate', 'atlas'], airports: ['RAK', 'AGA'] },
  { names: ['taghazout', 'tiznit'], airports: ['AGA', 'RAK'] },
  { names: ['chefchaouen', 'tetouan', 'asilah'], airports: ['TNG', 'FEZ'] },
  { names: ['meknes', 'ifrane'], airports: ['FEZ', 'RBA'] },
  { names: ['hammamet', 'sousse', 'monastir', 'nabeul'], airports: ['NBE', 'TUN'] },
  { names: ['giza', 'pyramids', 'alexandria'], airports: ['CAI', 'SPX'] },
  { names: ['el gouna', 'marsa alam', 'safaga', 'soma bay'], airports: ['HRG'] },
  { names: ['dahab', 'nuweiba', 'taba'], airports: ['SSH'] },
  { names: ['aswan', 'abu simbel'], airports: ['LXR'] },
  { names: ['petra', 'wadi rum', 'aqaba', 'dead sea'], airports: ['AMM'] },
  { names: ['mecca', 'makkah', 'umrah', 'hajj', 'taif'], airports: ['JED', 'MED'] },
  { names: ['madina', 'medina'], airports: ['MED', 'JED'] },
  { names: ['ajman', 'ras al khaimah', 'fujairah', 'al ain'], airports: ['DXB', 'SHJ', 'AUH'] },
  { names: ['diani', 'malindi', 'watamu', 'kilifi', 'lamu'], airports: ['MBA', 'NBO'] },
  { names: ['masai mara', 'maasai mara', 'nakuru', 'naivasha', 'kisumu', 'eldoret'], airports: ['NBO'] },
  { names: ['arusha', 'moshi', 'kilimanjaro', 'serengeti', 'ngorongoro'], airports: ['JRO', 'NBO'] },
  { names: ['stone town', 'nungwi', 'paje', 'kendwa'], airports: ['ZNZ'] },
  { names: ['kampala', 'jinja'], airports: ['EBB'] },
  { names: ['bosaso', 'garowe', 'galkayo', 'baidoa', 'kismayo', 'somalia'], airports: ['MGQ', 'HGA', 'NBO'] },
  { names: ['berbera', 'burao', 'borama', 'somaliland'], airports: ['HGA'] },
  { names: ['dire dawa', 'harar', 'bahir dar', 'gondar', 'lalibela'], airports: ['ADD'] },
  { names: ['abeokuta', 'ibadan', 'lekki', 'ikeja'], airports: ['LOS'] },
  { names: ['kumasi', 'cape coast'], airports: ['ACC'] },
  { names: ['pattaya', 'hua hin', 'ayutthaya'], airports: ['BKK'] },
  { names: ['krabi', 'koh samui', 'ko samui', 'phi phi', 'khao lak'], airports: ['HKT', 'BKK'] },
  { names: ['pai', 'chiang rai'], airports: ['CNX'] },
  { names: ['ubud', 'seminyak', 'canggu', 'uluwatu', 'nusa'], airports: ['DPS'] },
  { names: ['langkawi', 'penang', 'malacca', 'melaka'], airports: ['KUL'] },
  { names: ['cambridge', 'oxford', 'brighton', 'reading', 'milton keynes', 'watford', 'croydon', 'kent', 'essex', 'surrey'], airports: ['LON', 'LHR', 'LGW', 'STN', 'LTN'] },
  { names: ['leicester', 'nottingham', 'derby'], airports: ['EMA', 'BHX'] },
  { names: ['sheffield', 'york', 'hull', 'bradford'], airports: ['LBA', 'MAN'] },
  { names: ['cardiff', 'swansea', 'bath', 'exeter', 'cornwall'], airports: ['BRS'] },
  { names: ['blackpool', 'preston', 'lancaster', 'chester', 'stoke'], airports: ['MAN', 'LPL'] },
  { names: ['aberdeen', 'inverness', 'stirling', 'dundee'], airports: ['EDI', 'GLA'] },
  { names: ['galway', 'cork', 'limerick', 'belfast'], airports: ['DUB'] },
];

/** Great-circle distance in km. */
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** The nearest real airports (not metro codes) to a point, with distance. */
export function nearestAirports(
  lat: number,
  lon: number,
  limit = 3,
): Array<{ airport: AirportEntry; km: number }> {
  return AIRPORTS.filter((a) => !a.metro && typeof a.lat === 'number' && typeof a.lon === 'number')
    .map((a) => ({ airport: a, km: Math.round(distanceKm(lat, lon, a.lat as number, a.lon as number)) }))
    .sort((x, y) => x.km - y.km)
    .slice(0, limit);
}

/**
 * A typed place with no airport of its own → the airports that serve it.
 * Returns [] when the query is not a known alias.
 */
export function aliasAirports(query: string): Array<{ airport: AirportEntry; placeName: string }> {
  const q = query
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (q.length < 3) return [];
  for (const alias of PLACE_ALIASES) {
    const hit = alias.names.find((n) => n.startsWith(q) || q.startsWith(n));
    if (hit) {
      return alias.airports
        .map((code) => byCode.get(code))
        .filter((a): a is AirportEntry => !!a)
        .map((airport) => ({ airport, placeName: hit.replace(/\b\w/g, (c) => c.toUpperCase()) }));
    }
  }
  return [];
}

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
