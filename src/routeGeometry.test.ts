import { describe, expect, it } from 'vitest';
import { buildIllustratedRoute, decodePolyline, stylizeRoute } from './routeGeometry';
import { makePreview } from './commute';
import { buildStory } from './story';

describe('Entur route geometry', () => {
  it('interprets zigzags and U-turns as broad forward bends without folded roads', () => {
    const raw = [{ x: 0, z: 0 }, { x: 2, z: -8 }, { x: -4, z: 5 }, { x: 1, z: -4 }, { x: -6, z: 0 }];
    const points = stylizeRoute(raw, 35, { x: 0, z: 0 }, 0);
    let previousYaw = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dz = points[i].z - points[i - 1].z;
      const length = Math.hypot(dx, dz);
      const yaw = Math.atan2(-dz, dx);
      expect(dx).toBeGreaterThan(0);
      expect(Math.abs(yaw)).toBeLessThanOrEqual(.651);
      expect(Math.abs(yaw - previousYaw)).toBeLessThanOrEqual(length * .036 + .00001);
      previousYaw = yaw;
    }
  });
  it('decodes polyline5 latitude/longitude ordering', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([{ latitude: 38.5, longitude: -120.2 }, { latitude: 40.7, longitude: -120.95 }, { latitude: 43.252, longitude: -126.453 }]);
  });
  it('rejects malformed, oversized and degenerate polylines without throwing', () => {
    for (const value of [null, '', '!!!!', '~~~~~~', '_p~iF', 'a'.repeat(200001), '????']) expect(decodePolyline(value)).toEqual([]);
  });
  it('preserves fallback coordinates when geometry is absent', () => {
    const story = buildStory(makePreview()[0]);
    const route = buildIllustratedRoute(story);
    expect(route.hasGeometry).toBe(false);
    expect(route.sample(10, 1)).toEqual({ x: 10, z: 1, yaw: 0 });
    expect(route.sample(-4).x).toBe(-4);
  });
  it('bends and rotates actors based on geographic points and is deterministic', () => {
    const journey = makePreview()[0];
    journey.legs = [{ ...journey.legs[0], pointsOnLink: { points: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' } }];
    const story = buildStory(journey);
    const route = buildIllustratedRoute(story);
    expect(route.hasGeometry).toBe(true);
    expect(Math.abs(route.sample(story[0].xEnd).z)).toBeGreaterThan(1);
    expect(Math.abs(route.sample(story[0].xEnd * .9).yaw)).toBeGreaterThan(.1);
    const end = route.sample(story[0].xEnd);
    const extended = route.sample(story[0].xEnd + 1);
    expect(Math.hypot(extended.x - end.x, extended.z - end.z)).toBeCloseTo(1);
    expect(route.sample(5)).toEqual(route.sample(5));
  });
  it('keeps lateral character offsets continuous across a right-angle leg join', () => {
    const journey = makePreview()[0];
    const story = buildStory(journey);
    // Two different headings from known encoded polylines meet at the stop.
    story[0].leg = { ...story[0].leg, pointsOnLink: { points: '_p~iF~ps|U_ulLnnqC_mqNvxq`@' } };
    story[2].leg = { ...story[2].leg, pointsOnLink: { points: '_p~iF~ps|U??_ulL?' } };
    const route = buildIllustratedRoute(story);
    const join = story[0].xEnd;
    const before = route.sample(join - .000001, 1.05);
    const after = route.sample(join + .000001, 1.05);
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeLessThan(.001);
    expect(Math.abs(after.yaw - before.yaw)).toBeLessThan(.001);
  });
});
