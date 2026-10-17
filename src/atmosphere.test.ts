import { describe, expect, it } from 'vitest';
import { journeyAtmosphere } from './atmosphere';
describe('Norway-local journey atmosphere', () => {
  it('blends from day to night along selected journey times', () => {
    const from = '2026-10-17T17:00:00+02:00'; const to = '2026-10-17T21:00:00+02:00';
    expect(journeyAtmosphere(from,to,0).period).toBe('day');
    expect(journeyAtmosphere(from,to,.5).darkness).toBeCloseTo(.5);
    expect(journeyAtmosphere(from,to,1).period).toBe('night');
  });
  it('handles midnight and dawn without depending on browser timezone', () => {
    expect(journeyAtmosphere('2026-10-17T23:00:00+02:00','2026-10-18T02:00:00+02:00',.5).period).toBe('night');
    expect(journeyAtmosphere('2026-10-18T07:00:00+02:00','2026-10-18T09:00:00+02:00',0).period).toBe('dawn');
  });
});
