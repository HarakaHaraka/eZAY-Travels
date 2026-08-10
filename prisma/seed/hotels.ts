/**
 * Hotel registry seed.
 *
 * EVERY rate here is seeded with verifiedAt: null — that is deliberate. A null
 * verifiedAt means PLACEHOLDER: the public site withholds the price and admin
 * shows a loud badge, until someone enters a real quote from the property.
 *
 * The costMinor/sellMinor figures below are the design's illustrative numbers.
 * They exist so the sell/cost columns are not empty in admin; they are not
 * quotes, which is exactly what verifiedAt: null records.
 *
 * Imagery: only images we hold a licence for. The generic thumb-*.jpg tiles
 * stand in until supplier imagery arrives with the inventory — see
 * design/images/README.md.
 */

export interface SeedRate {
  roomType: string;
  board: string;
  costMinor: number;
  sellMinor: number;
}

export interface SeedHotel {
  name: string;
  city: string;
  country: string;
  starRating: number | null;
  distanceNote: string;
  supplier: string;
  bookingUrl: string | null;
  imageUrls: string[];
  notes: string | null;
  rates: SeedRate[];
}

export const SEED_HOTELS: SeedHotel[] = [
  {
    name: 'Eko Hotel & Suites, Victoria Island',
    city: 'Lagos',
    country: 'Nigeria',
    starRating: 5,
    distanceNote: 'Pool, generator, 20 min to Lekki',
    supplier: 'direct',
    bookingUrl: 'https://www.ekohotels.com',
    // Owned/supplied imagery. hotel-eko-pool.jpg carries a visible
    // photographer watermark and must be replaced with the property's media
    // pack before launch — see design/images/README.md.
    imageUrls: ['/images/hotel-eko-room.jpg', '/images/hotel-eko-pool.jpg'],
    notes:
      'Ask for the media pack when opening the commission conversation — the current pool image is watermarked.',
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 5_200, sellMinor: 5_800 }],
  },
  {
    name: 'Serviced flat, Lekki Phase 1',
    city: 'Lagos',
    country: 'Nigeria',
    starRating: null,
    distanceNote: 'Kitchen, better for two weeks +',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-3.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'room_only', costMinor: 3_600, sellMinor: 4_100 }],
  },
  {
    name: 'Cave room, Göreme',
    city: 'Cappadocia',
    country: 'Türkiye',
    starRating: 4,
    distanceNote: 'Walk to the balloon launch field',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-2.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 5_700, sellMinor: 6_400 }],
  },
  {
    name: 'Boutique hotel, Uçhisar',
    city: 'Cappadocia',
    country: 'Türkiye',
    starRating: 4,
    distanceNote: 'Quieter, best valley view',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-4.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 8_200, sellMinor: 9_200 }],
  },
  {
    name: 'Lodge, Nairobi National Park edge',
    city: 'Nairobi',
    country: 'Kenya',
    starRating: 4,
    distanceNote: 'Wake up to the park, 30 min to town',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-2.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 5_700, sellMinor: 6_400 }],
  },
  {
    name: 'Boutique hotel, Westlands',
    city: 'Nairobi',
    country: 'Kenya',
    starRating: 4,
    distanceNote: 'Best base for the city, safe to walk',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-1.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 5_200, sellMinor: 5_800 }],
  },
  {
    name: 'Beach hotel, Nungwi',
    city: 'Zanzibar',
    country: 'Tanzania',
    starRating: 4,
    distanceNote: 'North coast, swimmable at low tide',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-1.jpg'],
    notes: 'Tide matters more than the property here — confirm the coast before quoting.',
    rates: [{ roomType: 'double', board: 'half_board', costMinor: 6_400, sellMinor: 7_100 }],
  },
  {
    name: 'Riad-style guesthouse, Stone Town',
    city: 'Zanzibar',
    country: 'Tanzania',
    starRating: 3,
    distanceNote: 'Two nights either end of the beach',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-2.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 4_800, sellMinor: 5_400 }],
  },
  {
    name: 'Guesthouse, Old City Chiang Mai',
    city: 'Chiang Mai',
    country: 'Thailand',
    starRating: 3,
    distanceNote: 'Inside the moat, walk everywhere',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-3.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'room_only', costMinor: 2_500, sellMinor: 2_900 }],
  },
  {
    name: 'Beach bungalow, Koh Lanta',
    city: 'Chiang Mai',
    country: 'Thailand',
    starRating: 3,
    distanceNote: 'Quieter than Phi Phi, good for a week',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-1.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'room_only', costMinor: 4_000, sellMinor: 4_600 }],
  },
  {
    name: 'Guesthouse, Monti',
    city: 'Rome',
    country: 'Italy',
    starRating: 3,
    distanceNote: '10 min walk to the Colosseum',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-3.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 7_900, sellMinor: 8_800 }],
  },
  {
    name: 'Apartment, Trastevere',
    city: 'Rome',
    country: 'Italy',
    starRating: null,
    distanceNote: 'Quieter, best for four nights +',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-2.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'room_only', costMinor: 9_100, sellMinor: 10_200 }],
  },
  {
    name: 'Ski-in room, Val Thorens',
    city: 'Geneva',
    country: 'France',
    starRating: 4,
    distanceNote: 'Boots on at the door',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-4.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'half_board', costMinor: 10_600, sellMinor: 11_800 }],
  },
  {
    name: 'Chalet room, Grindelwald',
    city: 'Geneva',
    country: 'Switzerland',
    starRating: 3,
    distanceNote: 'Half board, walk to the station',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-2.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'half_board', costMinor: 8_600, sellMinor: 9_600 }],
  },
  {
    name: 'Beachfront cabana, El Nido',
    city: 'Palawan',
    country: 'Philippines',
    starRating: 3,
    distanceNote: 'Fan or air-con, breakfast in',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-1.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 8_600, sellMinor: 9_600 }],
  },
  {
    name: 'Guesthouse, Coron',
    city: 'Palawan',
    country: 'Philippines',
    starRating: 3,
    distanceNote: 'Best base for the wreck dives',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-3.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'room_only', costMinor: 4_600, sellMinor: 5_200 }],
  },
  {
    name: 'Hotel, 7th arrondissement',
    city: 'Paris',
    country: 'France',
    starRating: 4,
    distanceNote: 'Walk to the tower, quiet at night',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-4.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'breakfast', costMinor: 8_600, sellMinor: 9_600 }],
  },
  {
    name: 'Apartment, Le Marais',
    city: 'Paris',
    country: 'France',
    starRating: null,
    distanceNote: 'Better for four nights and a group',
    supplier: 'direct',
    bookingUrl: null,
    imageUrls: ['/images/thumb-stay-2.jpg'],
    notes: null,
    rates: [{ roomType: 'double', board: 'room_only', costMinor: 7_500, sellMinor: 8_400 }],
  },
];
