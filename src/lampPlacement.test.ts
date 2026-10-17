import { describe, expect, it } from 'vitest';
import { makePreview } from './commute';
import { buildStory } from './story';
import { buildIllustratedRoute } from './routeGeometry';
import { placeStreetLights } from './lampPlacement';

describe('streetlamp clearance', () => {
  it('avoids transit stops and overlapping lamps', () => {
    const stages = buildStory(makePreview()[0]);
    const route = buildIllustratedRoute(stages);
    const lamps = placeStreetLights(route, stages);
    expect(lamps.length).toBeGreaterThan(0);
    const transit = stages.find(stage => stage.kind === 'tram')!;
    for (const lamp of lamps) {
      for (const distance of [transit.xStart, transit.xEnd]) { const stop = route.sample(distance, -1.1); expect(Math.hypot(lamp.x - stop.x, lamp.z - stop.z)).toBeGreaterThan(3.55); }
    }
    for (let i = 1; i < lamps.length; i++) for (let j = 0; j < i; j++) expect(Math.hypot(lamps[i].x - lamps[j].x, lamps[i].z - lamps[j].z)).toBeGreaterThanOrEqual(4);
  });
  it('keeps metro-road lamps clear of setback buildings', () => {
    const journey = makePreview()[0]; journey.legs[1].mode = 'metro';
    const stages = buildStory(journey); const route = buildIllustratedRoute(stages);
    for (const lamp of placeStreetLights(route, stages)) for (let i = 0; i < Math.ceil(stages.at(-1)!.xEnd / 9); i++) {
      const building = route.sample(7 + i * 9, -5.5 - i % 2 * 1.5);
      expect(Math.hypot(lamp.x - building.x, lamp.z - building.z)).toBeGreaterThan(2.95);
    }
  });
});
