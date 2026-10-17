import { describe, expect, it } from 'vitest';
import { distanceMeters, isWalking, makePreview, parseFeatures, validPlace } from './commute';
import { exampleRoute } from './planner';
describe('journey API helpers', () => {
  it('calculates distance in metres for route input validation', () => { expect(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: .001 })).toBeCloseTo(111.195, 2); });
  it('converts geocoder longitude/latitude safely', () => {
    const result = parseFeatures({ features: [{ geometry: { coordinates: [10.7, 59.9] }, properties: { id: 'address:1', names: { default: 'Oslo S', display: 'Oslo S, Oslo' } } }] });
    expect(result[0]).toEqual({ id: 'address:1', name: 'Oslo S', label: 'Oslo S, Oslo', latitude: 59.9, longitude: 10.7 });
  });
  it('rejects malformed places', () => {
    expect(parseFeatures({ features: [null, {}, { geometry: { coordinates: [0, 300] }, properties: { id: 'bad', name: 'Bad' } }] })).toEqual([]);
    expect(validPlace({ ...exampleRoute.from, latitude: NaN })).toBe(false);
    expect(validPlace({ ...exampleRoute.from, longitude: 181 })).toBe(false);
  });
  it('recognizes walking modes and creates a named, explicitly illustrative route', () => {
    expect(isWalking('foot')).toBe(true); expect(isWalking('WALK')).toBe(true); expect(isWalking('tram')).toBe(false);
    expect(makePreview()).toHaveLength(3);
    expect(makePreview()[0].legs[0].fromPlace.name).toBe('Bjørvika');
    expect(makePreview()[0].legs.at(-1)?.toPlace.name).toBe('Grünerløkka');
  });
});
