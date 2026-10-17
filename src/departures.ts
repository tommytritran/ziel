import type { Journey } from './commute';
import { isWalking } from './commute';
import { modeName, vehicleKind } from './story';
import type { VehicleKind } from './story';

export interface Departure { id: string; kind: VehicleKind; line: string; destination: string; stop: string; time: string; journeyIndices: number[] }
export function upcomingDepartures(journeys: Journey[]): Departure[] {
  const departures = journeys.flatMap((journey, journeyIndex) => {
    const leg = journey.legs.find(part => !isWalking(part.mode));
    if (!leg) return [];
    const kind = vehicleKind(leg.mode);
    return [{ id: `${leg.expectedStartTime}-${leg.line?.publicCode ?? leg.mode}-${leg.fromPlace.name}-${leg.toPlace.name}`, kind, line: leg.line?.publicCode || modeName(kind), destination: leg.toPlace.name, stop: leg.fromPlace.name, time: leg.expectedStartTime, journeyIndices: [journeyIndex] }];
  });
  const unique = new Map<string, Departure>();
  for (const departure of departures) {
    const existing = unique.get(departure.id);
    if (existing) existing.journeyIndices.push(...departure.journeyIndices);
    else unique.set(departure.id, departure);
  }
  return [...unique.values()].sort((a, b) => Date.parse(a.time) - Date.parse(b.time)).slice(0, 3);
}

export function leaveStatus(journey: Journey, now: number) {
  const leaveAt = Date.parse(journey.legs[0].expectedStartTime);
  const seconds = Math.ceil((leaveAt - now) / 1000);
  const transit = journey.legs.find(leg => !isWalking(leg.mode));
  const passed = transit ? Date.parse(transit.expectedStartTime) <= now : seconds < -60;
  const state = passed || seconds < -60 ? 'missed' : seconds <= 0 ? 'leave' : seconds <= 60 ? 'ready' : 'waiting';
  return { leaveAt, seconds, state, walkingSeconds: journey.legs.slice(0, transit ? journey.legs.indexOf(transit) : journey.legs.length).filter(leg => isWalking(leg.mode)).reduce((sum, leg) => sum + leg.duration, 0) };
}
