import { describe, expect, it } from 'vitest';
import { makePreview } from './commute';
import { buildStory, destinationEntry, formatElapsed, storyPosition, transitMotion, vehicleKind, waitingVehicle } from './story';

describe('scroll journey model', () => {
  it('walks into the destination and closes the door at completion', () => {
    expect(destinationEntry(.9, 40).active).toBe(false);
    expect(destinationEntry(.98, 40).door).toBe(1);
    expect(destinationEntry(.99, 40).z).toBeLessThan(0);
    expect(destinationEntry(1, 40).inside).toBe(true);
    expect(destinationEntry(1, 40).door).toBeCloseTo(0);
    expect(destinationEntry(1, 40).x).toBeCloseTo(43.1);
  });
  it('includes transfer waits and preserves actual elapsed time', () => {
    const story = buildStory(makePreview()[0]);
    expect(story.map(s => s.kind)).toEqual(['walk', 'wait', 'tram', 'walk']);
    expect(story.reduce((sum, s) => sum + s.seconds, 0)).toBe(1260);
    expect(story[0].end).toBeCloseTo(240 / 1260);
    expect(story.at(-1)?.end).toBe(1);
    expect(story[1].xStart).toBe(story[1].xEnd);
  });
  it('scrubs deterministically in both directions and clamps endpoints', () => {
    const story = buildStory(makePreview()[0]);
    expect(storyPosition(story, .5).stage.kind).toBe('tram');
    expect(storyPosition(story, .1).stage.kind).toBe('walk');
    expect(storyPosition(story, -1).local).toBe(0);
    expect(storyPosition(story, 2).local).toBe(1);
    expect(storyPosition(story, story[1].start).stage.kind).toBe('wait');
  });
  it('maps distinct Entur transport modes without inventing a bus fallback', () => {
    expect(['foot', 'bus', 'metro', 'tram', 'rail', 'water', 'air', 'bicycle', 'funicular', 'unknown'].map(vehicleKind)).toEqual(['walk', 'bus', 'metro', 'tram', 'train', 'ferry', 'plane', 'bike', 'cable', 'transit']);
  });
  it('formats elapsed seconds rather than rounding minutes', () => {
    expect(formatElapsed(245)).toBe('04:05');
    expect(formatElapsed(0)).toBe('00:00');
  });
  it('brings the waiting vehicle to the boarding position before opening doors', () => {
    expect(waitingVehicle(0, 10).x).toBeCloseTo(-7.1);
    expect(waitingVehicle(.5, 10).x).toBeGreaterThan(waitingVehicle(.2, 10).x);
    expect(waitingVehicle(.85, 10).x).toBeCloseTo(10.9);
    expect(waitingVehicle(.84, 10).door).toBe(0);
    expect(waitingVehicle(1, 10)).toEqual({ x: 10.9, door: 1, state: 'at-stop' });
    expect(waitingVehicle(.5, 10)).toEqual(waitingVehicle(.5, 10));
    expect(waitingVehicle(.2, 10, true).x).toBe(10.9);
  });
  it('adds an arrival phase for transit-first journeys but not a second arrival after waiting', () => {
    const story = buildStory(makePreview()[0]);
    expect(transitMotion(story, 2, 0).boarding).toBe(true);
    const transitFirst = [story[2]];
    expect(transitMotion(transitFirst, 0, .02).arriving).toBe(true);
    expect(transitMotion(transitFirst, 0, .04).boarding).toBe(true);
    expect(transitMotion(transitFirst, 0, .04).arrival.x).toBeCloseTo(story[2].xStart + .9);
    expect(transitMotion(transitFirst, 0, .5).travel).toBeGreaterThan(0);
  });
});
