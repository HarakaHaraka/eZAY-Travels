/**
 * Homepage scenes, destination bands and offer cards.
 *
 * This content was hardcoded in design/index.html. It lives here only to be
 * loaded into DestinationGuide — once seeded it is editable in the database,
 * which is the point of moving it.
 *
 * Prices are integer minor units (pence), as everywhere.
 */

export interface SeedOffer {
  id: string;
  route: string;
  totalMinor: number;
  city: string;
  out: string;
  back: string;
  badge: string;
  badgeTone: string;
  detail: string;
  breakdown: string;
}

export interface SeedAround {
  name: string;
  note: string;
  price: string;
  thumb: string;
}

export interface SeedGuide {
  slug: string;
  title: string;
  city: string;
  country: string;
  heroImage: string;
  imageCredit: string | null;
  imageLicence: string;
  sortOrder: number;
  chipLabel: string;
  heroKicker: string;
  heroHeadline: string;
  heroSub: string;
  bandTag: string;
  bandTagTone: string;
  bandBody: string;
  bandNote: string;
  bookingWindow: string;
  visaNotes: string;
  budgetBands: Record<string, string>;
  bodyMdx: string;
  offers: SeedOffer[];
  around: SeedAround[];
}

const THUMB = (name: string) => `/images/thumb-${name}.jpg`;

export const SEED_GUIDES: SeedGuide[] = [
  {
    slug: 'lagos',
    title: 'Lagos: Detty December, and the fare curve that comes with it',
    city: 'Lagos',
    country: 'Nigeria',
    heroImage: '/images/lagos.jpg',
    imageCredit: 'Seun Idowu',
    imageLicence: 'Unsplash Licence',
    sortOrder: 1,
    chipLabel: 'Lagos lights',
    heroKicker: 'Lagos · Detty December',
    heroHeadline: 'December, and the city is up all night.',
    heroSub:
      'Fares climb from mid-October. Sorted now, £547 return — with the hotel quoted in the same message.',
    bandTag: 'Detty December · book by September',
    bandTagTone: 'tag-accent',
    bandBody:
      'Fares climb hard from mid-October. Consolidator pricing here beats anything on a public search — this is where our long-haul margin lives, and where yours does too.',
    bandNote:
      'We prebook the car. Lagos arrivals at 4am is not where you want to be negotiating a fare.',
    bookingWindow: 'Book by September for December travel. 10–14 weeks out the rest of the year.',
    visaNotes:
      'UK passport holders need a visa in advance. Do not rely on visa-on-arrival — allow three weeks.',
    budgetBands: {
      'Low season': '£520–£780 return',
      December: '£900–£1,400 return',
      'Hotel, per night': 'from £58',
    },
    bodyMdx: `## The one thing that sets your Lagos fare

December. Nigerian diaspora travel peaks so hard that the fare curve stops behaving like a normal route. A seat that costs £560 in February costs well over £1,000 in the third week of December, and it does not soften closer to the date — it hardens.

If you are going for Christmas, treat September as your deadline. Not a suggestion, a deadline.

## Where we usually beat the public price

This is a consolidator route. The trade net fares available on Lagos are meaningfully better than anything on a comparison site, particularly in the December band. We check the live search and the consolidator on every Lagos enquiry and quote whichever wins — and tell you which it was.

## Getting in

Arrivals can be slow and the traffic out of the airport is worse. We prebook a car that meets you inside arrivals, because 4am at Murtala Muhammed is not where you want to start negotiating.`,
    offers: [
      {
        id: 'lagos-a',
        route: 'LHR → LOS',
        totalMinor: 68_400,
        city: 'Lagos LOS',
        out: '18 Dec',
        back: '3 Jan',
        badge: 'Direct',
        badgeTone: 'tag-accent-2',
        detail: '18 Dec — 3 Jan · Virgin Atlantic · 6h 30m',
        breakdown: 'Fare £612 + taxes · our fee £31 · hotel from £58/night',
      },
      {
        id: 'lagos-b',
        route: 'LGW → LOS',
        totalMinor: 54_700,
        city: 'Lagos LOS',
        out: '17 Dec',
        back: '4 Jan',
        badge: '1 stop',
        badgeTone: 'tag-neutral',
        detail: '17 Dec — 4 Jan · Royal Air Maroc · 11h 05m',
        breakdown: 'Fare £489 + taxes · our fee £28 · hotel from £58/night',
      },
    ],
    around: [
      {
        name: 'Private car, LOS → island',
        note: 'Meets you inside arrivals · 45–90 min',
        price: '£24 each way',
        thumb: THUMB('car'),
      },
    ],
  },

  {
    slug: 'cappadocia',
    title: 'Cappadocia: book the balloon slot before you book the flight',
    city: 'Cappadocia',
    country: 'Türkiye',
    heroImage: '/images/cappadocia.jpg',
    imageCredit: null,
    imageLicence: 'Owned',
    sortOrder: 2,
    chipLabel: 'Cappadocia',
    heroKicker: 'Cappadocia · balloons at first light',
    heroHeadline: 'Up before the sun, and above it by seven.',
    heroSub:
      'Fly midweek into Kayseri, two nights in a cave room, and the balloon slot booked before you land. £389 return in the shoulder window.',
    bandTag: 'Balloons · book the slot before you fly',
    bandTagTone: 'tag-accent',
    bandBody:
      'The balloon slot is the trip, and it sells out weeks before the flight does. We book it with the fare so you are not refreshing a Turkish website at midnight. Shoulder season is October and April.',
    bandNote:
      'Flights get cancelled for wind roughly one morning in five. Book three nights, not two, and you get a second chance.',
    bookingWindow: 'Shoulder season is October and April. Book the balloon slot with the flight.',
    visaNotes: 'No visa for UK passport holders for stays under 90 days. Passport needs 150 days validity.',
    budgetBands: {
      'Flights, shoulder': '£350–£450 return',
      'Cave room, per night': 'from £64',
      'Balloon slot': '£168 per person',
    },
    bodyMdx: `## The slot is the trip

Balloon slots sell out weeks before the flights do, and they are the reason you are going. We book the slot alongside the fare rather than leaving you refreshing a Turkish booking site at midnight.

## Book three nights, not two

Flights are cancelled for wind roughly one morning in five. On a two-night trip a cancellation means you go home without flying. On three nights you get a second chance, and the extra night in Göreme costs less than the balloon slot you would forfeit.

## When to go

October and April are the shoulder windows: mild, clear, and cheaper than high summer.`,
    offers: [
      {
        id: 'cap-a',
        route: 'STN → ASR',
        totalMinor: 38_900,
        city: 'Kayseri ASR',
        out: '6 Oct',
        back: '11 Oct',
        badge: 'Best value',
        badgeTone: 'tag-accent',
        detail: '6 Oct — 11 Oct · Pegasus via SAW · 6h 40m',
        breakdown: 'Fare £352 + taxes · our fee £22 · cave room from £64/night',
      },
      {
        id: 'cap-b',
        route: 'LHR → IST',
        totalMinor: 45_200,
        city: 'Istanbul IST',
        out: '6 Oct',
        back: '13 Oct',
        badge: 'Two cities',
        badgeTone: 'tag-accent-2',
        detail: '6 Oct — 13 Oct · Turkish Airlines · 3h 55m + domestic',
        breakdown: 'Fare £408 + taxes · our fee £26 · balloon slot £168pp',
      },
    ],
    around: [
      {
        name: 'Private car, ASR → Göreme',
        note: '1h 15m · meets your flight',
        price: '£38 each way',
        thumb: THUMB('car'),
      },
      {
        name: 'Balloon slot, sunrise',
        note: 'Booked with the flight, not after',
        price: '£168pp',
        thumb: THUMB('pass'),
      },
    ],
  },

  {
    slug: 'nairobi',
    title: 'Nairobi: a game park inside the city boundary',
    city: 'Nairobi',
    country: 'Kenya',
    heroImage: '/images/nairobi.jpg',
    imageCredit: 'Grace Nandi',
    imageLicence: 'Unsplash Licence',
    sortOrder: 3,
    chipLabel: 'Nairobi',
    heroKicker: 'Nairobi · game park at the city limit',
    heroHeadline: 'A skyline behind the acacia.',
    heroSub:
      'The only capital on earth with a national park inside it. Fly overnight, be on a morning game drive, and still make dinner in Westlands. £498 return.',
    bandTag: 'City and safari · one flight',
    bandTagTone: 'tag-accent-2',
    bandBody:
      'The only capital on earth with a national park inside the city boundary. You can land at six, be watching giraffe against the skyline by eight, and still be back for dinner. Fly it as a city break, or bolt the Mara on for a week that costs less than most people assume.',
    bandNote:
      'Traffic decides your day here. We build the transfers around it rather than pretending Nairobi is a 20-minute city.',
    bookingWindow: '10–14 weeks out. Migration season (Jul–Sep) needs longer and costs more.',
    visaNotes: 'UK passport holders need an electronic travel authorisation in advance. Apply at least a week ahead.',
    budgetBands: {
      'Flights, low season': '£450–£560 return',
      'Migration season': '£520–£700 return',
      'Lodge, per night': 'from £64',
    },
    bodyMdx: `## A safari before breakfast

Nairobi National Park runs right up to the city boundary. Land at six, be watching giraffe against the skyline by eight, and be back in Westlands for lunch. No other capital offers that.

## City break or Mara add-on

Flown as a city break it is a short-notice, good-value long-haul. Bolt the Mara onto the end and the week costs less than most people assume — the internal flight is the expensive part, so book it with the international leg.

## Traffic decides your day

Nairobi traffic is not a rounding error. We build transfer times around it rather than pretending the airport is twenty minutes from town, because on a bad afternoon it is two hours.`,
    offers: [
      {
        id: 'nbo-a',
        route: 'LHR → NBO',
        totalMinor: 49_800,
        city: 'Nairobi NBO',
        out: '11 Feb',
        back: '22 Feb',
        badge: 'Best value',
        badgeTone: 'tag-accent',
        detail: '11 Feb — 22 Feb · Kenya Airways · 8h 45m',
        breakdown: 'Fare £449 + taxes · our fee £30 · lodge from £64/night',
      },
      {
        id: 'nbo-b',
        route: 'LHR → NBO',
        totalMinor: 57_200,
        city: 'Nairobi NBO',
        out: '26 Jul',
        back: '9 Aug',
        badge: 'Migration season',
        badgeTone: 'tag-accent-2',
        detail: '26 Jul — 9 Aug · Qatar Airways · 13h 10m',
        breakdown: 'Fare £518 + taxes · our fee £34 · Mara add-on from £310',
      },
    ],
    around: [
      {
        name: 'Private car, NBO → Westlands',
        note: '45–90 min depending on traffic',
        price: '£22 each way',
        thumb: THUMB('car'),
      },
      {
        name: 'Half-day park game drive',
        note: 'Guide and vehicle, early start',
        price: '£78pp',
        thumb: THUMB('van'),
      },
    ],
  },

  {
    slug: 'zanzibar',
    title: 'Zanzibar: Stone Town and the north coast, priced as one trip',
    city: 'Zanzibar',
    country: 'Tanzania',
    heroImage: '/images/zanzibar.jpg',
    imageCredit: null,
    imageLicence: 'Owned',
    sortOrder: 4,
    chipLabel: 'Zanzibar',
    heroKicker: 'Zanzibar · dry season',
    heroHeadline: 'White sand, and a dhow at six.',
    heroSub:
      'Fly via the Gulf in the June–October dry window. £612 return, and we price Stone Town and the north coast as one trip.',
    bandTag: 'Dry season · June to October',
    bandTagTone: 'tag-accent-2',
    bandBody:
      'Two trips in one: Stone Town for the history and the north coast for the water. Book them as one itinerary or you will pay twice for the transfer across the island. Long-haul, so the saving is real.',
    bandNote:
      'Tide matters more than the hotel. Nungwi and Kendwa stay swimmable; most of the east coast does not. We will say so before you book.',
    bookingWindow: 'June to October is the dry window. Book 12–16 weeks out.',
    visaNotes: 'UK passport holders need a visa. Available on arrival, but applying online first is faster.',
    budgetBands: {
      Flights: '£560–£700 return',
      'Beach room, per night': 'from £71',
      'Stone Town, per night': 'from £54',
    },
    bodyMdx: `## Two places, one itinerary

Stone Town and the north coast are different holidays. Most people want both, and booking them separately means paying twice for the transfer across the island. We price it as one trip.

## Tide beats hotel

This is the thing nobody tells you: on much of the east coast the sea goes out so far at low tide that swimming is not an option. Nungwi and Kendwa stay swimmable. We will tell you which side you are booking before you commit.`,
    offers: [
      {
        id: 'znz-a',
        route: 'LHR → ZNZ',
        totalMinor: 61_200,
        city: 'Zanzibar ZNZ',
        out: '12 Jul',
        back: '26 Jul',
        badge: 'Best value',
        badgeTone: 'tag-accent',
        detail: '12 Jul — 26 Jul · Qatar Airways · 14h 20m',
        breakdown: 'Consolidator fare · our fee £38 · beach room from £71/night',
      },
      {
        id: 'znz-b',
        route: 'LGW → ZNZ',
        totalMinor: 69_800,
        city: 'Zanzibar ZNZ',
        out: '3 Aug',
        back: '17 Aug',
        badge: '1 stop',
        badgeTone: 'tag-neutral',
        detail: '3 Aug — 17 Aug · Emirates · 16h 05m',
        breakdown: 'Consolidator fare · our fee £38 · Stone Town from £54/night',
      },
    ],
    around: [
      {
        name: 'Private car, ZNZ → Nungwi',
        note: '1h 20m · meets your flight',
        price: '£32 each way',
        thumb: THUMB('car'),
      },
    ],
  },

  {
    slug: 'thailand',
    title: 'Thailand: book the domestic hop with the long-haul',
    city: 'Chiang Mai',
    country: 'Thailand',
    heroImage: '/images/thailand.jpg',
    imageCredit: null,
    imageLicence: 'Owned',
    sortOrder: 5,
    chipLabel: 'Thailand',
    heroKicker: 'Thailand · cool season',
    heroHeadline: 'Chiang Mai first, islands after.',
    heroSub:
      'November to February is the window. Elephants in the morning, night market after, and the domestic hop booked with the long-haul so it actually connects. £624 return.',
    bandTag: 'Cool season · November to February',
    bandTagTone: 'tag-accent-2',
    bandBody:
      'Chiang Mai for the north, then the islands. The domestic hop has to be booked with the long-haul or the connection does not protect — that single detail is why people miss flights here.',
    bandNote:
      'Ethical elephant sanctuaries only — no riding, no shows. We will name the ones we actually send people to.',
    bookingWindow: '14–20 weeks out. Christmas and New Year need booking by September.',
    visaNotes: 'No visa for UK passport holders staying under 60 days. Proof of onward travel is occasionally checked.',
    budgetBands: {
      'Flights, shoulder': '£480–£700 return',
      'Guesthouse, per night': 'from £29',
      'Beach bungalow, per night': 'from £46',
    },
    bodyMdx: `## The connection trap

If you book the Bangkok–Chiang Mai hop separately from the long-haul, the connection is not protected. A delayed inbound means you buy a new internal ticket at the airport, at the counter, at whatever the walk-up fare is. Booked on one ticket, that is the airline's problem rather than yours.

This is the single most common way people lose money on a Thailand trip.

## When to go

November to February: dry, cooler, and comfortably the best time to be there. March to May is punishingly hot. The wet season is cheaper and less bad than it sounds — rain arrives hard and briefly rather than settling in.`,
    offers: [
      {
        id: 'tha-a',
        route: 'LHR → CNX',
        totalMinor: 62_400,
        city: 'Chiang Mai CNX',
        out: '9 Nov',
        back: '25 Nov',
        badge: 'Best value',
        badgeTone: 'tag-accent',
        detail: '9 Nov — 25 Nov · Emirates via DXB · 17h 30m',
        breakdown: 'Consolidator fare · our fee £36 · guesthouse from £29/night',
      },
      {
        id: 'tha-b',
        route: 'LHR → BKK',
        totalMinor: 57_100,
        city: 'Bangkok BKK',
        out: '14 Jan',
        back: '1 Feb',
        badge: '1 stop',
        badgeTone: 'tag-neutral',
        detail: '14 Jan — 1 Feb · Etihad · 15h 45m',
        breakdown: 'Consolidator fare · our fee £34 · domestic hop £48 each way',
      },
    ],
    around: [
      {
        name: 'Domestic hop, BKK → CNX',
        note: 'Booked on the same ticket',
        price: '£48 each way',
        thumb: THUMB('pass'),
      },
      {
        name: 'Airport car, CNX → Old City',
        note: '20 min · fixed price',
        price: '£11',
        thumb: THUMB('car'),
      },
    ],
  },

  {
    slug: 'rome',
    title: 'Rome: shoulder season, and the Colosseum without the queue',
    city: 'Rome',
    country: 'Italy',
    heroImage: '/images/rome.jpg',
    imageCredit: null,
    imageLicence: 'Owned',
    sortOrder: 6,
    chipLabel: 'Rome by night',
    heroKicker: 'Rome · shoulder season',
    heroHeadline: 'The Colosseum, minus the queue.',
    heroSub:
      'Late September, midweek, direct from Gatwick. £164 return and the evening light does the rest.',
    bandTag: 'Long weekend · shoulder season',
    bandTagTone: 'tag-accent',
    bandBody:
      'Go late September or February — same city, half the crowd, and the Colosseum at night with nobody in your photo. Short-haul, so our margin is thin and we say so.',
    bandNote:
      'Flying into Ciampino instead? Coach only — 40 minutes, about £6. We will say which airport is actually cheaper once fees are in.',
    bookingWindow: '6–10 weeks out. Avoid Easter and the first week of May.',
    visaNotes: 'No visa for UK passport holders. Passport must be under 10 years old with 3 months validity beyond return.',
    budgetBands: {
      Flights: '£110–£190 return',
      'Guesthouse, per night': 'from £88',
      'Apartment, per night': 'from £102',
    },
    bodyMdx: `## Go in the shoulder

Late September or February is the same city with half the crowd. The Colosseum at night, in particular, is a completely different experience from the same building at eleven in the morning in July.

## We make less here, and we will say so

Short-haul European fares are price-transparent and competitive. Our margin on a Rome flight is thin, and the breakdown line on every offer shows you exactly what it is. If you are better off booking it yourself, we will tell you.`,
    offers: [
      {
        id: 'rom-a',
        route: 'LGW → FCO',
        totalMinor: 16_400,
        city: 'Rome FCO',
        out: '24 Sep',
        back: '28 Sep',
        badge: 'Direct',
        badgeTone: 'tag-accent-2',
        detail: '24 Sep — 28 Sep · ITA Airways · 2h 40m',
        breakdown: 'Fare £149 + taxes · our fee £15 · hotel from £88/night',
      },
      {
        id: 'rom-b',
        route: 'STN → CIA',
        totalMinor: 11_200,
        city: 'Rome CIA',
        out: '24 Sep',
        back: '28 Sep',
        badge: 'Hand bag only',
        badgeTone: 'tag-neutral',
        detail: '24 Sep — 28 Sep · Ryanair · 2h 45m',
        breakdown: 'Fare £97 + taxes · our fee £15 · hotel from £88/night',
      },
    ],
    around: [
      {
        name: 'Leonardo Express, FCO → Termini',
        note: 'Every 15 min · 32 min',
        price: '£13',
        thumb: THUMB('rail'),
      },
    ],
  },

  {
    slug: 'alps-ski',
    title: 'Alps and ski weeks: the January value window',
    city: 'Geneva',
    country: 'Switzerland',
    heroImage: '/images/alps.jpg',
    imageCredit: null,
    imageLicence: 'Owned',
    sortOrder: 7,
    chipLabel: 'Alps & ski',
    heroKicker: 'The Alps · January value window',
    heroHeadline: 'First lift, and the piste is yours.',
    heroSub:
      'Fly the second week of January, dodge New Year and half-term, and we book the transfer and the pass that everyone forgets. £186 return.',
    bandTag: 'Ski season · January value window',
    bandTagTone: 'tag-accent-2',
    bandBody:
      'Fly Zurich, Geneva or Innsbruck mid-January and you dodge both the New Year spike and half-term. Flight, coach, lift pass and boot fitting quoted as one number — because that is how the week actually costs. Ski weeks sell out by early November.',
    bandNote:
      'Book the transfer with the flight. Same-day taxis in the valley run three times this, and the Saturday coaches fill first.',
    bookingWindow: 'Book by early November for a January week. Transfers fill before flights do.',
    visaNotes: 'No visa for UK passport holders. Check your EHIC/GHIC and that your insurance covers off-piste.',
    budgetBands: {
      Flights: '£170–£220 return',
      'Coach transfer': '£68 return',
      '6-day lift pass': '£258',
    },
    bodyMdx: `## The week costs more than the flight

A ski week is a flight, a transfer, a lift pass and boot hire. Quoting only the flight is how people end up £400 over what they planned. We price the four together, because that is what the week actually costs.

## Mid-January is the window

The second week of January dodges both the New Year spike and February half-term. Same mountain, materially cheaper.

## Book the transfer first

Saturday coaches fill before the flights do, and a same-day taxi in the valley runs about three times the coach fare.`,
    offers: [
      {
        id: 'ski-a',
        route: 'LGW → GVA',
        totalMinor: 18_600,
        city: 'Geneva GVA',
        out: '17 Jan',
        back: '24 Jan',
        badge: 'Best value',
        badgeTone: 'tag-accent',
        detail: '17 Jan — 24 Jan · easyJet · 1h 40m',
        breakdown: 'Fare £164 + taxes · our fee £22 · coach £68 return · pass £258',
      },
      {
        id: 'alp-a',
        route: 'LHR → ZRH',
        totalMinor: 19_800,
        city: 'Zurich ZRH',
        out: '10 Jan',
        back: '17 Jan',
        badge: 'Direct',
        badgeTone: 'tag-accent-2',
        detail: '10 Jan — 17 Jan · SWISS · 1h 50m',
        breakdown: 'Fare £176 + taxes · our fee £22 · transfer from £46 return',
      },
    ],
    around: [
      {
        name: 'Shared coach, GVA → Val Thorens',
        note: 'Saturday transfers · 3h 10m',
        price: '£68 return',
        thumb: THUMB('van'),
      },
      {
        name: '6-day lift pass',
        note: 'Quoted with the flight, not after',
        price: '£258',
        thumb: THUMB('pass'),
      },
    ],
  },

  {
    slug: 'palawan',
    title: 'Palawan: book the long-haul first, the island hop second',
    city: 'Palawan',
    country: 'Philippines',
    heroImage: '/images/palawan.jpg',
    imageCredit: null,
    imageLicence: 'Owned',
    sortOrder: 8,
    chipLabel: 'Coastline',
    heroKicker: 'Palawan · long-haul window open',
    heroHeadline: 'Somewhere you can hear the water.',
    heroSub:
      'Book the long-haul leg four months out and the island hop three weeks out — in that order, it is £689 return.',
    bandTag: 'Long-haul · two weeks minimum',
    bandTagTone: 'tag-accent-2',
    bandBody:
      'Book the long-haul leg 4–5 months out, the island hop three weeks out. Do it the other way round and you pay twice. Budget £95–£140 a night on the coast.',
    bandNote:
      'The 10kg limit on the light aircraft catches people out. Tell us your bags and we will price the van option too.',
    bookingWindow: 'Long-haul leg 4–5 months out; the island hop about three weeks out.',
    visaNotes: 'No visa for UK passport holders for stays under 30 days. Onward ticket required.',
    budgetBands: {
      Flights: '£690–£760 return',
      'Beachfront, per night': 'from £96',
      'Guesthouse, per night': 'from £52',
    },
    bodyMdx: `## Order matters

Book the long-haul leg four to five months out and the island hop about three weeks out. Do it the other way round and you pay twice — the domestic carriers price late, the international ones price early.

## The 10kg limit

The light aircraft into El Nido has a hard 10kg limit, and it catches people out constantly. Tell us what you are carrying and we will price the van from Puerto Princesa alongside it — it is cheap, and five hours long.`,
    offers: [
      {
        id: 'pal-b',
        route: 'LHR → MNL',
        totalMinor: 68_900,
        city: 'Manila MNL',
        out: '18 Feb',
        back: '4 Mar',
        badge: 'Best value',
        badgeTone: 'tag-accent',
        detail: '18 Feb — 4 Mar · Emirates · 20h 25m',
        breakdown: 'Consolidator fare · our fee built in · hotel from £96/night',
      },
      {
        id: 'pal-a',
        route: 'LHR → MNL',
        totalMinor: 74_200,
        city: 'Manila MNL',
        out: '14 Feb',
        back: '28 Feb',
        badge: '1 stop',
        badgeTone: 'tag-neutral',
        detail: '14 Feb — 28 Feb · Qatar Airways · 18h 10m',
        breakdown: 'Consolidator fare · our fee built in · hotel from £96/night',
      },
    ],
    around: [
      {
        name: 'Light aircraft, MNL → El Nido',
        note: '1h 15m · 10kg limit',
        price: '£118 each way',
        thumb: THUMB('pass'),
      },
      {
        name: 'Van from Puerto Princesa',
        note: 'Cheap, long · 5h',
        price: '£14',
        thumb: THUMB('van'),
      },
    ],
  },

  {
    slug: 'paris',
    title: 'Paris: the one route where the train usually wins',
    city: 'Paris',
    country: 'France',
    heroImage: '/images/paris.jpg',
    imageCredit: null,
    imageLicence: 'Owned',
    sortOrder: 9,
    chipLabel: 'Paris',
    heroKicker: 'Paris · two nights, no flight needed',
    heroHeadline: 'Close enough to go on a Friday.',
    heroSub:
      'Eurostar or a 70-minute hop, out Friday evening, back Sunday night. £118 return and we price the hotel with it.',
    bandTag: 'Two nights · leave Friday after work',
    bandTagTone: 'tag-accent-2',
    bandBody:
      'The one city where the train usually beats the plane once you count the transfer, the bag and the two hours at the gate. We price both and tell you which actually wins for your dates.',
    bandNote:
      'Eurostar lands you in the middle of the city with no transfer. On a two-night trip that is usually two hours and £20 better than flying, even when the fare looks higher.',
    bookingWindow: '4–8 weeks out. Eurostar prices climb steadily, so earlier is genuinely better.',
    visaNotes: 'No visa for UK passport holders. Passport must be under 10 years old with 3 months validity beyond return.',
    budgetBands: {
      Flights: '£110–£150 return',
      Eurostar: 'from £134 return',
      'Hotel, per night': 'from £84',
    },
    bodyMdx: `## Count the whole journey, not the fare

A £104 flight to CDG plus an RER ticket, a bag, and two hours at the gate is not cheaper than a £134 Eurostar that puts you in the tenth arrondissement. On a two-night trip the train usually wins on both time and money.

We price both and tell you which one actually wins for your dates, rather than quoting whichever pays us better.`,
    offers: [
      {
        id: 'par-a',
        route: 'LGW → CDG',
        totalMinor: 11_800,
        city: 'Paris CDG',
        out: '14 Nov',
        back: '16 Nov',
        badge: 'Direct',
        badgeTone: 'tag-accent-2',
        detail: '14 Nov — 16 Nov · easyJet · 1h 15m',
        breakdown: 'Fare £104 + taxes · our fee £15 · hotel from £96/night',
      },
      {
        id: 'par-b',
        route: 'STP → PAR',
        totalMinor: 14_900,
        city: 'Paris Nord',
        out: '12 Dec',
        back: '14 Dec',
        badge: 'Eurostar',
        badgeTone: 'tag-accent',
        detail: '12 Dec — 14 Dec · Eurostar · 2h 16m city centre to city centre',
        breakdown: 'Fare £134 · our fee £15 · no airport transfer needed',
      },
    ],
    around: [
      {
        name: 'Nothing needed on Eurostar',
        note: 'Gare du Nord is already in the centre',
        price: '£0',
        thumb: THUMB('rail'),
      },
      {
        name: 'RER B, CDG → centre',
        note: 'Every 10 min · 35 min',
        price: '£10',
        thumb: THUMB('rail'),
      },
    ],
  },
];
