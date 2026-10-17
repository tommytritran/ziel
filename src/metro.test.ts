import { describe, expect, it } from 'vitest';
import { makePreview } from './commute';
import { buildStory } from './story';
import { METRO_DEPTH, metroJourney } from './metro';
describe('illustrative underground metro', () => {
  it('descends before metro, waits underground, rides below street and ascends at exit', () => {
    const journey = makePreview()[0]; journey.legs[1].mode = 'metro';
    const stages = buildStory(journey);
    expect(metroJourney(stages, 0, .8).phase).toBe('descending');
    expect(metroJourney(stages, 0, 1).depth).toBe(METRO_DEPTH);
    expect(metroJourney(stages, 1, .5).depth).toBe(METRO_DEPTH);
    expect(metroJourney(stages, 2, .5).depth).toBe(METRO_DEPTH);
    expect(metroJourney(stages, 2, .95).phase).toBe('ascending');
    expect(metroJourney(stages, 2, 1).depth).toBeCloseTo(0);
    expect(metroJourney(stages, 3, 0).depth).toBe(0);
  });
  it('does not put other transport underground', () => { expect(metroJourney(buildStory(makePreview()[0]), 2, .5).depth).toBe(0); });
  it('finishes a metro-only ascent before destination entry starts', () => {
    const journey = makePreview()[0]; journey.legs = [{ ...journey.legs[1], mode: 'metro' }];
    const stages = buildStory(journey);
    expect(metroJourney(stages, 0, 0).depth).toBe(0);
    expect(metroJourney(stages, 0, .5).depth).toBe(METRO_DEPTH);
    expect(metroJourney(stages, 0, .959).depth).toBeCloseTo(0);
  });
  it('stays underground between consecutive metro services', () => {
    const journey = makePreview()[0];
    journey.legs = [{ ...journey.legs[1], mode: 'metro' }, { ...journey.legs[2], mode: 'metro' }];
    const stages = buildStory(journey);
    expect(metroJourney(stages, 0, 1).depth).toBe(METRO_DEPTH);
    expect(metroJourney(stages, 1, 0).depth).toBe(METRO_DEPTH);
    expect(metroJourney(stages, 1, .06).phase).toBe('underground');
  });
  it('stops, opens, boards, closes, then moves in order', () => {
    const journey = makePreview()[0]; journey.legs[1].mode = 'metro'; const stages = buildStory(journey);
    expect(metroJourney(stages, 2, .18).sequence).toBe('arriving');
    expect(metroJourney(stages, 2, .27).sequence).toBe('opening');
    expect(metroJourney(stages, 2, .34).sequence).toBe('boarding');
    expect(metroJourney(stages, 2, .34).door).toBe(1);
    expect(metroJourney(stages, 2, .4).sequence).toBe('closing');
    expect(metroJourney(stages, 2, .4).travel).toBe(0);
    expect(metroJourney(stages, 2, .5).door).toBe(0);
    expect(metroJourney(stages, 2, .5).travel).toBeGreaterThan(0);
  });
  it('keeps a platform transfer wait below ground and descends into a surface transfer', () => {
    const journey = makePreview()[0]; journey.legs[1].mode = 'metro';
    const stages = buildStory(journey);
    stages[0].kind = 'bus';
    expect(metroJourney(stages, 1, 0).depth).toBe(0);
    expect(metroJourney(stages, 1, .15).depth).toBeCloseTo(METRO_DEPTH / 2);
    expect(metroJourney(stages, 1, 0).platformOffset).toBe(0);
    expect(metroJourney(stages, 1, 1).platformOffset).toBe(3);
    expect(metroJourney(stages, 2, 0).platformOffset).toBe(3);
    stages[0].kind = 'metro';
    expect(metroJourney(stages, 1, 0).depth).toBe(METRO_DEPTH);
  });
});
