import { describe, expect, it } from 'vitest';
import { makePreview } from './commute';
import { leaveStatus, upcomingDepartures } from './departures';

describe('origin departure board', () => {
  it('uses the first transit departure, not the walking start time', () => {
    const journeys = makePreview();
    const departures = upcomingDepartures(journeys);
    expect(departures).toHaveLength(3);
    expect(departures[0].time).toBe(journeys[0].legs[1].expectedStartTime);
    expect(departures[0].time).not.toBe(journeys[0].legs[0].expectedStartTime);
    expect(departures[0].stop).toBe('Bjørvika');
    expect(departures[0].destination).toBe('Schous plass');
  });
  it('sorts and deduplicates the same departures across alternatives', () => {
    const journeys = makePreview();
    expect(upcomingDepartures([journeys[2], journeys[0], journeys[0], journeys[1]]).map(d => d.time)).toEqual(journeys.map(j => j.legs[1].expectedStartTime));
  });
  it('does not invent transit departures for walking-only journeys', () => {
    const journey = makePreview()[0];
    expect(upcomingDepartures([{ ...journey, legs: [journey.legs[0]] }])).toEqual([]);
  });
  it('keeps original journey indices after sorting and deduplication', () => {
    const journeys = makePreview();
    const result = upcomingDepartures([journeys[2], journeys[0], journeys[0], journeys[1]]);
    expect(result.map(d => d.journeyIndices)).toEqual([[1, 2], [3], [0]]);
  });
  it('bases leave cues on the walking start and handles boundaries honestly', () => {
    const journey = makePreview()[0];
    const start = Date.parse(journey.legs[0].expectedStartTime);
    expect(leaveStatus(journey, start - 61000).state).toBe('waiting');
    expect(leaveStatus(journey, start - 60000).state).toBe('ready');
    expect(leaveStatus(journey, start).state).toBe('leave');
    expect(leaveStatus(journey, start + 60000).state).toBe('leave');
    expect(leaveStatus(journey, start + 61000).state).toBe('missed');
    expect(leaveStatus(journey, start).walkingSeconds).toBe(240);
    expect(leaveStatus(journey, start).leaveAt).toBe(start);
  });
});
