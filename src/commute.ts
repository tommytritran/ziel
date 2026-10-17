import type { RouteRequest } from './planner';
export interface Place { id: string; name: string; label: string; latitude: number; longitude: number }
export interface Coordinates { latitude: number; longitude: number }
export interface Leg { mode: string; fromPlace: { name: string }; toPlace: { name: string }; expectedStartTime: string; expectedEndTime: string; duration: number; line: { publicCode: string; name: string } | null; pointsOnLink?: { points?: string | null; length?: number } | null }
export interface Journey { duration: number; walkDistance: number; legs: Leg[] }
export const CLIENT = 'ziel-commute';
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
export function validPlace(value: unknown): value is Place {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.name === 'string' && value.name.length > 0 && typeof value.label === 'string' && typeof value.latitude === 'number' && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 && typeof value.longitude === 'number' && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}
export function parseFeatures(value: unknown): Place[] {
  if (!isRecord(value) || !Array.isArray(value.features)) return [];
  return value.features.flatMap((feature: unknown) => {
    if (!isRecord(feature) || !isRecord(feature.geometry) || !Array.isArray(feature.geometry.coordinates) || !isRecord(feature.properties)) return [];
    const [longitude, latitude] = feature.geometry.coordinates;
    const p = feature.properties;
    const names = isRecord(p.names) ? p.names : {};
    const name = names.default ?? p.name ?? p.label;
    const label = names.display ?? p.label ?? name;
    const place = { id: p.id ?? p.gid, name, label, latitude, longitude };
    return validPlace(place) ? [place] : [];
  });
}
export async function searchPlaces(query: string, signal: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, lang: 'no', limit: '5' });
  const response = await fetch(`https://api.entur.io/geocoder/v3/autocomplete?${params}`, { headers: { 'ET-Client-Name': CLIENT }, signal });
  if (!response.ok) throw new Error(response.status === 429 ? 'Too many searches. Try again in a moment.' : 'Address search is unavailable. Please try again.');
  return parseFeatures(await response.json());
}
function isLeg(value: unknown): value is Leg {
  if (!isRecord(value) || !isRecord(value.fromPlace) || !isRecord(value.toPlace)) return false;
  return typeof value.mode === 'string' && typeof value.duration === 'number' && value.duration >= 0 && typeof value.fromPlace.name === 'string' && typeof value.toPlace.name === 'string' && typeof value.expectedStartTime === 'string' && Number.isFinite(Date.parse(value.expectedStartTime)) && typeof value.expectedEndTime === 'string' && Number.isFinite(Date.parse(value.expectedEndTime)) && (value.line === null || (isRecord(value.line) && typeof value.line.publicCode === 'string' && typeof value.line.name === 'string'));
}
export async function fetchJourneys(request: RouteRequest, signal: AbortSignal): Promise<Journey[]> {
  const { from, to } = request;
  const point = (p: Place) => `{coordinates:{latitude:${p.latitude},longitude:${p.longitude}}}`;
  const response = await fetch('https://api.entur.io/journey-planner/v3/graphql', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'ET-Client-Name': CLIENT }, signal,
    body: JSON.stringify({ query: `{trip(from:${point(from)},to:${point(to)},numTripPatterns:3${request.dateTime ? `,dateTime:${JSON.stringify(request.dateTime)},arriveBy:${Boolean(request.arriveBy)}` : ''}){tripPatterns{duration walkDistance legs{mode fromPlace{name} toPlace{name} expectedStartTime expectedEndTime duration line{publicCode name} pointsOnLink{points length}}}}}` }),
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'Entur is busy. Please wait a minute and retry.' : 'We couldn’t reach Entur. Check your connection and retry.');
  const result: unknown = await response.json();
  if (!isRecord(result) || result.errors) throw new Error('Entur couldn’t plan this journey. Please try again.');
  const data = result.data;
  if (!isRecord(data) || !isRecord(data.trip) || !Array.isArray(data.trip.tripPatterns)) throw new Error('Unexpected journey response from Entur. Please retry.');
  const journeys = data.trip.tripPatterns.filter((j: unknown): j is Journey => isRecord(j) && typeof j.duration === 'number' && j.duration > 0 && Number.isFinite(j.duration) && typeof j.walkDistance === 'number' && Array.isArray(j.legs) && j.legs.length > 0 && j.legs.every(isLeg));
  if (!journeys.length) throw new Error('No journeys found. Try a different time or nearby starting point and destination.');
  return journeys;
}
export function minutes(seconds: number): number { return Math.max(1, Math.round(seconds / 60)); }
export function timeLabel(iso: string): string { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo' }); }
export function dateLabel(iso: string): string { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/Oslo' }); }
export function makePreview(): Journey[] {
  const now = Date.now();
  return [0, 1, 2].map(index => {
    const start = now + (4 + index * 8) * 60000;
    const names = ['Bjørvika', 'Bjørvika', 'Schous plass', 'Grünerløkka'];
    return { duration: (21 + index * 3) * 60, walkDistance: 480 + index * 60, legs: [
      { mode: 'foot', fromPlace: { name: names[0] }, toPlace: { name: names[1] }, expectedStartTime: new Date(start).toISOString(), expectedEndTime: new Date(start + 4 * 60000).toISOString(), duration: 240, line: null },
      { mode: 'tram', fromPlace: { name: names[1] }, toPlace: { name: names[2] }, expectedStartTime: new Date(start + 5 * 60000).toISOString(), expectedEndTime: new Date(start + (17 + index * 3) * 60000).toISOString(), duration: (12 + index * 3) * 60, line: { publicCode: index === 1 ? '12' : '11', name: 'Kjelsås' } },
      { mode: 'foot', fromPlace: { name: names[2] }, toPlace: { name: names[3] }, expectedStartTime: new Date(start + (17 + index * 3) * 60000).toISOString(), expectedEndTime: new Date(start + (21 + index * 3) * 60000).toISOString(), duration: 240, line: null },
    ] };
  });
}
export function isWalking(mode: string) { return ['walk', 'foot'].includes(mode.toLowerCase()); }
