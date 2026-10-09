import { describe, expect, it } from 'vitest';
import { aliasAirports, nearestAirports, searchAirports } from '@/lib/airports';
describe('nearest airport', () => {
  it('brescia -> bergamo', () => { expect(aliasAirports('Brescia')[0].airport.code).toBe('BGY'); });
  it('budva -> tivat', () => { expect(aliasAirports('budva')[0].airport.code).toBe('TIV'); });
  it('padova -> venice', () => { expect(aliasAirports('Padova')[0].airport.code).toBe('VCE'); });
  it('geo nearest to Brescia coords', () => { expect(nearestAirports(45.54, 10.22, 2)[0].airport.code).toBe('VBS'); });
  it('still finds real airports', () => { expect(searchAirports('bergamo')[0].code).toBe('BGY'); });
});
