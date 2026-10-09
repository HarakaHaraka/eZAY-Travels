import type { Scene } from './homepage';

/**
 * City breaks that do not yet have a photographed destination guide in the
 * database. They ride in the SAME rotating hero as the photographed ones, as
 * a colour wash in the city's palette, until licensed panoramic imagery is
 * recorded for each (see design/images/README.md). Rome, Zanzibar and Nairobi
 * are deliberately absent — they have guides with photography, and one city
 * must appear once.
 */
export interface CityBreak {
  city: string;
  country: string;
  nights: string;
  airport: string;
  hook: string;
  story: string;
  do1: string;
  do2: string;
  do3: string;
  when: string;
  wash: string;
}

export const CITY_BREAKS: CityBreak[] = [
  {
    city: 'Marrakech',
    country: 'Morocco',
    nights: '4 nights',
    airport: 'from Gatwick or Luton, 3h 40m',
    hook: 'The souk at dusk, then a rooftop with the Atlas behind it',
    story:
      'Land before lunch. By four you are lost in the medina in the best way, following the smell of cumin and leather. Your riad has a courtyard with a fountain and a cat that owns it. Mint tea is a reflex here, and nobody hurries.',
    do1: 'Jemaa el-Fnaa at sunset, when the storytellers arrive',
    do2: 'A hammam the morning after, because you earned it',
    do3: 'A day trip to the Ourika valley, back by evening',
    when: 'October to April. Warm days, cool nights.',
    wash: 'linear-gradient(135deg, #c2410c 0%, #e8792d 50%, #f6c28b 100%)',
  },
  {
    city: 'Istanbul',
    country: 'Türkiye',
    nights: '3 nights',
    airport: 'from Heathrow, Gatwick or Stansted, 4h',
    hook: 'Two continents, one breakfast table',
    story:
      'Wake to the call to prayer rolling across the Golden Horn. Breakfast is twelve small plates and you will want all of them. Take the ferry to Kadıköy for lunch on the Asian side and come back as the lights go on over the Bosphorus.',
    do1: 'Ferry to Kadıköy, fish sandwich on the quay',
    do2: 'Süleymaniye at golden hour, quieter than the Blue Mosque',
    do3: 'Kadıköy market, then baklava at Karaköy Güllüoğlu',
    when: 'April to June and September to November.',
    wash: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a8f 55%, #9ad0e8 100%)',
  },
  {
    city: 'Lisbon',
    country: 'Portugal',
    nights: '3 nights',
    airport: 'from all London airports, 2h 45m',
    hook: 'Yellow trams, custard tarts and a river that looks like the sea',
    story:
      'The hills are real, so is the tram 28. Mornings are for Alfama, tiled and sleepy. Afternoons for the miradouros, where someone is always playing guitar. Evenings for grilled sardines on a plastic chair and the feeling you should have come sooner.',
    do1: 'Pastéis de Belém, warm, with cinnamon',
    do2: 'LX Factory on Sunday for the market',
    do3: 'Train to Cascais, 40 minutes, for the Atlantic',
    when: 'All year. Light jacket in winter.',
    wash: 'linear-gradient(135deg, #0e7490 0%, #22b8cf 50%, #fde68a 100%)',
  },
  {
    city: 'Dubai',
    country: 'UAE',
    nights: '4 nights',
    airport: 'from Heathrow, Gatwick or Stansted, 7h',
    hook: 'Old Dubai by abra in the morning, the desert by night',
    story:
      'Cross the creek on a wooden abra for one dirham and walk the gold and spice souks before the heat. Spend the afternoon somewhere air-conditioned and absurd. Then drive out into the dunes for a dinner you will talk about for years.',
    do1: 'Al Fahidi and the abra ride, early',
    do2: 'Desert evening with dune drive and dinner under the stars',
    do3: 'Jumeirah beach at sunset, the Burj behind you',
    when: 'November to March. Summer is for the brave.',
    wash: 'linear-gradient(135deg, #92400e 0%, #d97706 45%, #fcd34d 100%)',
  },
  {
    city: 'Cairo',
    country: 'Egypt',
    nights: '4 nights',
    airport: 'from Heathrow direct, 5h; Luton from 31 Oct',
    hook: 'Five thousand years before lunch',
    story:
      'The pyramids are bigger than the photos and closer to the city than you think. Give Giza a morning, the Grand Egyptian Museum a full day, and Khan el-Khalili an evening with koshari and shisha. Cairo is loud, warm and completely unbothered.',
    do1: 'Giza at opening time, camel optional',
    do2: 'Grand Egyptian Museum, allow the whole day',
    do3: 'Felucca on the Nile at sunset',
    when: 'October to April.',
    wash: 'linear-gradient(135deg, #78350f 0%, #c2410c 50%, #fed7aa 100%)',
  }
];

/** Fold the city breaks into hero scenes. Click goes to a WhatsApp quote. */
export function cityBreakScenes(whatsappNumber: string): Scene[] {
  return CITY_BREAKS.map((b) => ({
    slug: `break-${b.city.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    chip: b.city,
    image: '',
    wash: b.wash,
    credit: null,
    kicker: `${b.city}, ${b.country} · ${b.nights} · ${b.airport}`,
    headline: b.hook,
    sub: b.story,
    offerId: null,
    href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      `Hi eZAY — I'd like a quote for a ${b.nights} city break to ${b.city}. Dates: `
    )}`,
    external: true,
    stays: [],
  }));
}
