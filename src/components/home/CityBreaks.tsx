'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Auto-rotating city-break stories. Replaces the old "3 sources / 4 hours /
 * One number" proof strip.
 *
 * Deliberately no prices: CLAUDE.md rule 5 forbids a placeholder price on the
 * public site, and a city break is sold on the feeling first. Each card ends
 * in a WhatsApp opener with the city pre-filled, so the next click is a quote.
 * No photography: images need a recorded licence, so each card is a colour
 * wash in the city's own palette instead.
 */
interface CityBreak {
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

const BREAKS: CityBreak[] = [
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
    city: 'Rome',
    country: 'Italy',
    nights: '3 nights',
    airport: 'from all London airports, 2h 30m',
    hook: 'Every corner has a fountain and an opinion',
    story:
      'You will not see everything, so do not try. Pick one ruin, one church, one museum, and spend the rest of the time eating carbonara in Trastevere and walking home over the river. Rome rewards wandering more than planning.',
    do1: 'Colosseum first thing, before the coaches',
    do2: 'Trastevere for dinner, no reservation, follow the queue',
    do3: 'Gelato at Giolitti, then the Pantheon by night',
    when: 'March to May, September to October.',
    wash: 'linear-gradient(135deg, #7f1d1d 0%, #b45309 50%, #fbbf24 100%)',
  },
  {
    city: 'Zanzibar',
    country: 'Tanzania',
    nights: '7 nights',
    airport: 'from Heathrow via Doha or Istanbul, 12h',
    hook: 'Stone Town stories, then a week on the Indian Ocean',
    story:
      'Two days in Stone Town for the carved doors, the spice tour and sunset at Forodhani with grilled octopus. Then north to Nungwi, where the water is the colour you thought only existed in adverts and the dhows go out at dawn.',
    do1: 'Spice farm tour and a Swahili lunch',
    do2: 'Sunset dhow sail from Nungwi',
    do3: 'The Rock restaurant at low tide, walk out',
    when: 'June to October and December to February.',
    wash: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #a7f3d0 100%)',
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
  },
  {
    city: 'Nairobi',
    country: 'Kenya',
    nights: '5 nights',
    airport: 'from Heathrow direct, 8h 30m',
    hook: 'Giraffes at breakfast, a city that never sleeps at night',
    story:
      'Nairobi is the only capital with a national park inside its borders, so your first morning is lions with skyscrapers behind them. Feed the giraffes at Langata, eat nyama choma in Kilimani, and if you have two more days, the Mara is a short flight away.',
    do1: 'Nairobi National Park at dawn',
    do2: 'Giraffe Centre and the Karen Blixen house',
    do3: 'Nyama choma and a Tusker at Carnivore or Kilimani',
    when: 'All year. July to October for the migration.',
    wash: 'linear-gradient(135deg, #365314 0%, #65a30d 50%, #fef08a 100%)',
  },
];

const ROTATE_MS = 6000;

export function CityBreaks({ whatsappNumber }: { whatsappNumber: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    timer.current = window.setTimeout(() => setIndex((i) => (i + 1) % BREAKS.length), ROTATE_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, paused]);

  const b = BREAKS[index];
  const wa = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi eZAY — I'd like a quote for a ${b.nights} city break to ${b.city}. Dates: `
  )}`;

  return (
    <section
      className="citybreaks wrap"
      id="city-breaks"
      aria-roledescription="carousel"
      aria-label="City break ideas"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="cb-head">
        <h3>City breaks worth the airport</h3>
        <p>One idea at a time. It changes every few seconds; hover to hold it.</p>
      </div>

      <article className="cb-card" style={{ background: b.wash }} aria-live="polite">
        <div className="cb-text">
          <span className="cb-kicker">
            {b.city}, {b.country} · {b.nights} · {b.airport}
          </span>
          <h4>{b.hook}</h4>
          <p>{b.story}</p>
          <ul>
            <li>{b.do1}</li>
            <li>{b.do2}</li>
            <li>{b.do3}</li>
          </ul>
          <span className="cb-when">Best time: {b.when}</span>
          <div className="cb-actions">
            <a className="btn btn-primary" href={wa} target="_blank" rel="noopener">
              Quote me {b.city}
            </a>
            <a className="btn btn-secondary" href="#enquiry">
              Use the form instead
            </a>
          </div>
        </div>
      </article>

      <div className="cb-nav" role="tablist" aria-label="Choose a city">
        <button
          type="button"
          className="cb-arrow"
          aria-label="Previous city"
          onClick={() => setIndex((i) => (i - 1 + BREAKS.length) % BREAKS.length)}
        >
          ‹
        </button>
        {BREAKS.map((item, i) => (
          <button
            key={item.city}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`cb-dot${i === index ? ' on' : ''}`}
            onClick={() => setIndex(i)}
          >
            {item.city}
          </button>
        ))}
        <button
          type="button"
          className="cb-arrow"
          aria-label="Next city"
          onClick={() => setIndex((i) => (i + 1) % BREAKS.length)}
        >
          ›
        </button>
      </div>
    </section>
  );
}
