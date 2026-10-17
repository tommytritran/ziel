import { makePreview } from './commute';
import type { Journey } from './commute';
import type { VehicleKind } from './story';

export function makeMultimodalDemo(): Journey[] {
  const start = Date.now() + 5 * 60000;
  const parts = [
    { mode: 'foot', from: 'Bjørvika', to: 'Bjørvika bus stop', minutes: 3, gap: 0, code: '' },
    { mode: 'bus', from: 'Bjørvika bus stop', to: 'Jernbanetorget', minutes: 6, gap: 2, code: '31' },
    { mode: 'foot', from: 'Jernbanetorget', to: 'Jernbanetorget tram stop', minutes: 2, gap: 0, code: '' },
    { mode: 'tram', from: 'Jernbanetorget tram stop', to: 'Stortinget', minutes: 7, gap: 2, code: '12' },
    { mode: 'foot', from: 'Stortinget', to: 'Stortinget metro', minutes: 3, gap: 0, code: '' },
    { mode: 'metro', from: 'Stortinget metro', to: 'Majorstuen', minutes: 8, gap: 2, code: '2' },
    { mode: 'foot', from: 'Majorstuen', to: 'Frognerparken', minutes: 5, gap: 0, code: '' },
  ];
  let cursor = start;
  const legs = parts.map(part => {
    cursor += part.gap * 60000;
    const departure = cursor; cursor += part.minutes * 60000;
    return { mode: part.mode, fromPlace: { name: part.from }, toPlace: { name: part.to }, duration: part.minutes * 60, expectedStartTime: new Date(departure).toISOString(), expectedEndTime: new Date(cursor).toISOString(), line: part.code ? { publicCode: part.code, name: part.to } : null };
  });
  return [{ duration: (cursor - start) / 1000, walkDistance: 950, legs }];
}

export const DEMO_MODES: { kind: Exclude<VehicleKind, 'wait'>; label: string; mode: string; code: string }[] = [
  { kind: 'tram', label: 'Tram', mode: 'tram', code: '12' },
  { kind: 'bus', label: 'Bus', mode: 'bus', code: '31' },
  { kind: 'metro', label: 'Metro', mode: 'metro', code: '2' },
  { kind: 'train', label: 'Train', mode: 'rail', code: 'R10' },
  { kind: 'ferry', label: 'Ferry', mode: 'water', code: 'B1' },
  { kind: 'plane', label: 'Flight', mode: 'air', code: 'SK' },
  { kind: 'bike', label: 'Bicycle', mode: 'bicycle', code: '' },
  { kind: 'cable', label: 'Cable car', mode: 'cableway', code: '' },
  { kind: 'walk', label: 'Walking', mode: 'foot', code: '' },
  { kind: 'transit', label: 'Other transit', mode: 'other', code: 'T' },
];

export function makeDemoJourneys(kind: VehicleKind): Journey[] {
  const config = DEMO_MODES.find(option => option.kind === kind) ?? DEMO_MODES[0];
  return makePreview().map((journey, index) => {
    if (kind === 'walk') return { ...journey, walkDistance: 1500 + index * 200, legs: [{ ...journey.legs[0], toPlace: journey.legs.at(-1)!.toPlace, duration: journey.duration, expectedEndTime: journey.legs.at(-1)!.expectedEndTime }] };
    return { ...journey, legs: journey.legs.map((leg, legIndex) => legIndex === 1 ? { ...leg, mode: config.mode, line: config.code ? { publicCode: config.code, name: `${config.label} demonstration` } : null } : leg) };
  });
}
