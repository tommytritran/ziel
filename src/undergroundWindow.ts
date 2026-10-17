export interface UndergroundWindow { center: number; active: boolean; lateral?: number }
export const WINDOW_HALF_LENGTH = 8.6;
export const WINDOW_LATERAL = 3.6;
export const WINDOW_HALF_DEPTH = 6.4;

export function overlapsUndergroundWindow(window: UndergroundWindow, distance: number, lateral: number, radius = 0): boolean {
  if (!window.active) return false;
  const along = (distance - window.center) / (WINDOW_HALF_LENGTH + radius);
  const across = (lateral - (window.lateral ?? WINDOW_LATERAL)) / (WINDOW_HALF_DEPTH + radius);
  return along * along + across * across <= 1;
}
