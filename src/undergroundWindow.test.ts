import { describe, expect, it } from 'vitest';
import { overlapsUndergroundWindow, WINDOW_HALF_LENGTH, WINDOW_LATERAL } from './undergroundWindow';

describe('surface scenery around the underground window', () => {
  it('hides props inside the window and includes their footprint at the edge', () => {
    const window = { center: 20, active: true };
    expect(overlapsUndergroundWindow(window, 20, 4, .8)).toBe(true);
    expect(overlapsUndergroundWindow(window, 20 + WINDOW_HALF_LENGTH + .3, WINDOW_LATERAL, .8)).toBe(true);
    expect(overlapsUndergroundWindow(window, 40, 4, .8)).toBe(false);
  });
  it('restores props after the window passes and on return to the surface', () => {
    expect(overlapsUndergroundWindow({ center: 20, active: true }, 20, 4, 1)).toBe(true);
    expect(overlapsUndergroundWindow({ center: 35, active: true }, 20, 4, 1)).toBe(false);
    expect(overlapsUndergroundWindow({ center: 20, active: false }, 20, 4, 1)).toBe(false);
    expect(overlapsUndergroundWindow({ center: 20, active: true }, 20, 4, 1)).toBe(true);
  });
});
