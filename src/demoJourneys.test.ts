import { describe, expect, it } from 'vitest';
import { DEMO_MODES, makeDemoJourneys, makeMultimodalDemo } from './demoJourneys';
import { buildStory, vehicleKind } from './story';
describe('transport showcase', () => {
  it('defaults to one connected bus, tram and metro route with transfer walks and waits', () => {
    const journeys = makeMultimodalDemo(); expect(journeys).toHaveLength(1);
    expect(journeys[0].legs.filter(leg=>leg.mode!=='foot').map(leg=>leg.mode)).toEqual(['bus','tram','metro']);
    expect(buildStory(journeys[0]).filter(stage=>stage.kind==='wait')).toHaveLength(3);
    expect(journeys[0].legs[0].fromPlace.name).toBe('Bjørvika');
    expect(journeys[0].legs.at(-1)!.toPlace.name).toBe('Frognerparken');
    const elapsed=(Date.parse(journeys[0].legs.at(-1)!.expectedEndTime)-Date.parse(journeys[0].legs[0].expectedStartTime))/1000;
    expect(journeys[0].duration).toBe(elapsed);
  });
  it('offers every rendered mode except the non-vehicle wait stage', () => {
    expect(DEMO_MODES.map(option => option.kind).sort()).toEqual(['bike','bus','cable','ferry','metro','plane','train','tram','transit','walk'].sort());
    for (const option of DEMO_MODES) {
      const journeys = makeDemoJourneys(option.kind);
      expect(journeys).toHaveLength(3);
      expect(journeys[0].legs.some(leg => vehicleKind(leg.mode) === option.kind)).toBe(true);
      const stages = buildStory(journeys[0]);
      expect(stages.at(-1)?.end).toBe(1);
      if (option.kind === 'walk') expect(stages.every(stage => stage.kind === 'walk')).toBe(true);
      else expect(stages.some(stage => stage.kind === 'wait')).toBe(true);
    }
  });
});
