import type { Place } from './commute';
import { validPlace } from './commute';

export interface RouteRequest { from: Place; to: Place; dateTime?: string; arriveBy?: boolean }
export const RECENT_ROUTE_KEY = 'ziel.recent-route.v1';
export const exampleRoute: RouteRequest = {
  from: { id: 'example-from', name: 'Bjørvika', label: 'Bjørvika, Oslo', latitude: 59.9079, longitude: 10.7573 },
  to: { id: 'example-to', name: 'Grünerløkka', label: 'Grünerløkka, Oslo', latitude: 59.9219, longitude: 10.7617 },
};
export function loadRecentRoute(): RouteRequest | null {
  try {
    const raw = localStorage.getItem(RECENT_ROUTE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || !('from' in value) || !('to' in value) || !validPlace(value.from) || !validPlace(value.to)) return null;
    return { from: value.from, to: value.to };
  } catch { return null; }
}
