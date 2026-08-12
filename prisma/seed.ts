import { Prisma, PrismaClient } from '@prisma/client';
import { SEED_GUIDES } from './seed/guides';
import { SEED_HOTELS } from './seed/hotels';

const prisma = new PrismaClient();

/**
 * Working-hours SLA maths lives in src/lib/workingHours.ts, but the seed runs
 * outside Next's module resolution, so the sample enquiry's deadlines are set
 * to fixed past/future points instead. The real deadlines are computed
 * properly whenever an enquiry is created through the app.
 */
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

async function main() {
  // ── destination guides: the homepage scenes, bands and offer cards ──
  for (const guide of SEED_GUIDES) {
    const data = {
      title: guide.title,
      city: guide.city,
      country: guide.country,
      heroImage: guide.heroImage,
      imageCredit: guide.imageCredit,
      imageLicence: guide.imageLicence,
      bookingWindow: guide.bookingWindow,
      visaNotes: guide.visaNotes,
      budgetBands: guide.budgetBands as unknown as Prisma.InputJsonValue,
      bodyMdx: guide.bodyMdx,
      published: true,
      onHomepage: true,
      sortOrder: guide.sortOrder,
      chipLabel: guide.chipLabel,
      heroKicker: guide.heroKicker,
      heroHeadline: guide.heroHeadline,
      heroSub: guide.heroSub,
      bandTag: guide.bandTag,
      bandTagTone: guide.bandTagTone,
      bandBody: guide.bandBody,
      bandNote: guide.bandNote,
      // Prisma types JSON columns as InputJsonValue; these are arrays of
      // plain objects, which satisfy that at runtime but need the cast.
      featuredOffers: guide.offers as unknown as Prisma.InputJsonValue,
      gettingAround: guide.around as unknown as Prisma.InputJsonValue,
    };

    await prisma.destinationGuide.upsert({
      where: { slug: guide.slug },
      update: data,
      create: { slug: guide.slug, ...data },
    });
  }

  // ── hotel registry: every rate a PLACEHOLDER until verified ──
  for (const hotel of SEED_HOTELS) {
    const existing = await prisma.hotel.findFirst({
      where: { name: hotel.name, city: hotel.city },
    });

    if (existing === null) {
      await prisma.hotel.create({
        data: {
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          starRating: hotel.starRating,
          distanceNote: hotel.distanceNote,
          supplier: hotel.supplier,
          bookingUrl: hotel.bookingUrl,
          imageUrls: hotel.imageUrls,
          notes: hotel.notes,
          active: true,
          rates: {
            create: hotel.rates.map((rate) => ({
              roomType: rate.roomType,
              board: rate.board,
              costMinor: rate.costMinor,
              sellMinor: rate.sellMinor,
              currency: 'GBP',
              source: 'Seeded illustrative figure — not a quote',
              // NULL = PLACEHOLDER. Withheld from the public site, badged
              // loudly in admin, and blocked from a live sale.
              verifiedAt: null,
            })),
          },
        },
      });
    } else {
      // Keep imagery and notes in step with the seed on re-run — this is what
      // propagates the removal of the watermarked Eko image to a DB that was
      // seeded before it was deleted. Rates are left alone so a verified rate
      // is never silently reset to a placeholder.
      await prisma.hotel.update({
        where: { id: existing.id },
        data: { imageUrls: hotel.imageUrls, notes: hotel.notes },
      });
    }
  }

  // ── a sample enquiry, deliberately past its quote SLA ──
  const existingEnquiry = await prisma.enquiry.findUnique({
    where: { reference: 'ENQ-SAMPLE' },
  });
  if (existingEnquiry === null) {
    await prisma.enquiry.create({
      data: {
        reference: 'ENQ-SAMPLE',
        name: 'Amara Okafor',
        email: 'amara@example.com',
        phone: '+447700900123',
        whatsappOptIn: true,
        tripType: 'flight_hotel',
        origin: 'London LON',
        destination: 'Lagos LOS',
        paxAdults: 4,
        budgetBand: '800_plus',
        message:
          'Four of us to Lagos over Christmas — 20 Dec out, 3 Jan back, from Gatwick or Heathrow, whichever is cheaper. Two of us can be flexible by a day either side. What are we realistically looking at?',
        source: 'instagram',
        stage: 'enquiry',
        createdAt: hoursAgo(30),
        // Already past, so the overdue highlighting is visible immediately.
        quoteDueAt: hoursAgo(26),
        followUp1DueAt: daysFromNow(1),
        followUp2DueAt: daysFromNow(4),
        events: {
          create: {
            toStage: 'enquiry',
            note: 'Enquiry received via instagram',
            actor: 'system',
          },
        },
      },
    });
  }

  const guides = await prisma.destinationGuide.count();
  const hotels = await prisma.hotel.count();
  const rates = await prisma.hotelRate.count();
  const placeholders = await prisma.hotelRate.count({ where: { verifiedAt: null } });

  console.log('Seed complete:');
  console.log(`  ${guides} destination guides (homepage scenes, bands and offer cards)`);
  console.log(`  ${hotels} hotels, ${rates} rates — ${placeholders} PLACEHOLDER (verifiedAt null)`);
  console.log('  1 sample enquiry, ENQ-SAMPLE, already past its 4-working-hour quote SLA');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
