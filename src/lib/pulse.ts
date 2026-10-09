/**
 * "Right now" — the rotating strip under the hero.
 *
 * This is the slot that will carry eZAY's social content (reels, vlogs,
 * trending routes) once the channels are live. Until then it carries
 * timely, TRUE prompts drawn from the destination copy — nothing is
 * described as a video or a post that does not exist. Every card is one
 * click to a guide or a pre-filled quote.
 */
export interface PulseItem {
  id: string;
  /** Short label in the corner: "New route", "Season", "Idea", "Reel" ... */
  kind: string;
  title: string;
  caption: string;
  /** A guide path, or a WhatsApp quote when the city has no guide yet. */
  href: string;
  wash: string;
}

function quote(whatsapp: string, text: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi eZAY — ${text}`)}`;
}

export function pulseItems(whatsapp: string): PulseItem[] {
  return [
    {
      id: 'cairo-luton',
      kind: 'New route',
      title: 'Cairo from Luton from 31 October',
      caption: 'Five thousand years before lunch. Heathrow direct too, 5h.',
      href: quote(whatsapp, "I'd like a quote for Cairo. Dates: "),
      wash: 'linear-gradient(135deg, #78350f, #c2410c 60%, #fed7aa)',
    },
    {
      id: 'marrakech-halfterm',
      kind: 'Half-term',
      title: 'Marrakech, 3h 40m from Gatwick',
      caption: 'Souk at dusk, rooftop with the Atlas behind it. October to April is the time.',
      href: quote(whatsapp, "I'd like a quote for a Marrakech city break. Dates: "),
      wash: 'linear-gradient(135deg, #c2410c, #e8792d 55%, #f6c28b)',
    },
    {
      id: 'zanzibar-season',
      kind: 'In season',
      title: 'Zanzibar: December to February',
      caption: 'Stone Town first, then a week on the Indian Ocean at Nungwi.',
      href: '/guides/zanzibar',
      wash: 'linear-gradient(135deg, #0f766e, #14b8a6 55%, #a7f3d0)',
    },
    {
      id: 'nairobi-park',
      kind: 'Did you know',
      title: 'Lions with skyscrapers behind them',
      caption: 'Nairobi is the only capital with a national park inside it. Direct from Heathrow, 8h 30m.',
      href: '/guides/nairobi',
      wash: 'linear-gradient(135deg, #365314, #65a30d 55%, #fef08a)',
    },
    {
      id: 'istanbul-breakfast',
      kind: 'Idea',
      title: 'Two continents, one breakfast table',
      caption: 'Istanbul, 4h. Ferry to Kadıköy for lunch on the Asian side.',
      href: quote(whatsapp, "I'd like a quote for an Istanbul city break. Dates: "),
      wash: 'linear-gradient(135deg, #1e3a5f, #2d6a8f 55%, #9ad0e8)',
    },
    {
      id: 'cappadocia-balloons',
      kind: 'Bucket list',
      title: 'Cappadocia at sunrise',
      caption: 'Balloons over the valleys, a cave hotel below. Guide and prices inside.',
      href: '/guides/cappadocia',
      wash: 'linear-gradient(135deg, #7c2d12, #ea580c 55%, #fdba74)',
    },
    {
      id: 'lagos-december',
      kind: 'Detty December',
      title: 'Lagos in December',
      caption: 'Book early; the fares move fast from November.',
      href: '/guides/lagos',
      wash: 'linear-gradient(135deg, #14532d, #16a34a 55%, #bbf7d0)',
    },
    {
      id: 'dubai-winter',
      kind: 'Winter sun',
      title: 'Dubai, November to March',
      caption: 'Old Dubai by abra in the morning, the desert by night.',
      href: quote(whatsapp, "I'd like a quote for Dubai. Dates: "),
      wash: 'linear-gradient(135deg, #92400e, #d97706 50%, #fcd34d)',
    },
  ];
}
