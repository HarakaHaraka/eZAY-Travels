import { describe, expect, it } from 'vitest';
import { toPublicImagePath } from '@/lib/imagePath';

describe('toPublicImagePath', () => {
  it('leaves a public-folder absolute path untouched', () => {
    expect(toPublicImagePath('/images/lagos.jpg')).toBe('/images/lagos.jpg');
    expect(toPublicImagePath('/images/thumb-car.jpg')).toBe('/images/thumb-car.jpg');
  });

  it('coerces a legacy relative path to the public root so next/image can serve it', () => {
    // The design used `images/<name>.jpg` (no leading slash). A DestinationGuide
    // or Hotel row seeded that way makes next/image throw and blanks the panel —
    // the "photos exist but nothing shows" symptom this guards against.
    expect(toPublicImagePath('images/lagos.jpg')).toBe('/images/lagos.jpg');
    expect(toPublicImagePath('./images/thumb-stay-1.jpg')).toBe('/images/thumb-stay-1.jpg');
  });

  it('passes a full URL through untouched', () => {
    expect(toPublicImagePath('https://cdn.example.com/x.jpg')).toBe(
      'https://cdn.example.com/x.jpg'
    );
  });

  it('keeps a blank string blank so the caller can apply its own fallback', () => {
    expect(toPublicImagePath('')).toBe('');
    expect(toPublicImagePath('   ')).toBe('');
  });
});
