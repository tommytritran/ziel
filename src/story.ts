import { isWalking } from './commute';
import type { Journey, Leg } from './commute';

export type VehicleKind = 'walk' | 'wait' | 'bus' | 'metro' | 'tram' | 'train' | 'ferry' | 'plane' | 'bike' | 'cable' | 'transit';
export interface StoryStage {
  id: string;
  kind: VehicleKind;
  leg: Leg;
  seconds: number;
  start: number;
  end: number;
  xStart: number;
  xEnd: number;
  label: string;
  color: string;
}
export const modeColors: Record<VehicleKind, string> = {
  walk: '#e99676', wait: '#e2bd71', bus: '#edb644', metro: '#639eae', tram: '#ae8fc3', train: '#7a91c6', ferry: '#68acba', plane: '#899dce', bike: '#9ab16c', cable: '#be8fa8', transit: '#839b9a',
};
export function vehicleKind(mode: string): VehicleKind {
  const name = mode.toLowerCase().replaceAll('_', '');
  if (isWalking(mode)) return 'walk';
  if (['bus', 'coach', 'trolleybus'].includes(name)) return 'bus';
  if (['metro', 'subway'].includes(name)) return 'metro';
  if (['tram', 'lightrail'].includes(name)) return 'tram';
  if (['rail', 'train'].includes(name)) return 'train';
  if (['water', 'ferry', 'boat'].includes(name)) return 'ferry';
  if (['air', 'airplane', 'plane'].includes(name)) return 'plane';
  if (['bike', 'bicycle', 'cycle'].includes(name)) return 'bike';
  if (['cableway', 'cablecar', 'funicular', 'gondola'].includes(name)) return 'cable';
  return 'transit';
}
export function modeName(kind: VehicleKind): string {
  return { walk: 'Walk', wait: 'Wait', bus: 'Bus', metro: 'Metro', tram: 'Tram', train: 'Train', ferry: 'Ferry', plane: 'Flight', bike: 'Cycle', cable: 'Cable car', transit: 'Transit' }[kind];
}
export function buildStory(journey: Journey): StoryStage[] {
  const first = Date.parse(journey.legs[0].expectedStartTime);
  const parts: { leg: Leg; seconds: number; kind: VehicleKind }[] = [];
  let end = first;
  for (const leg of journey.legs) {
    const start = Date.parse(leg.expectedStartTime);
    const gap = Math.max(0, (start - end) / 1000);
    if (gap >= 1) parts.push({ leg, seconds: gap, kind: 'wait' });
    const seconds = Math.max(0, (Date.parse(leg.expectedEndTime) - start) / 1000);
    if (seconds > 0) parts.push({ leg, seconds, kind: vehicleKind(leg.mode) });
    end = Math.max(end, Date.parse(leg.expectedEndTime));
  }
  if (!parts.length) parts.push({ leg: journey.legs[0], seconds: Math.max(1, journey.duration), kind: vehicleKind(journey.legs[0].mode) });
  const total = parts.reduce((sum, part) => sum + part.seconds, 0);
  let cursor = 0;
  let x = 0;
  return parts.map((part, index) => {
    const start = cursor / total;
    cursor += part.seconds;
    const distance = part.kind === 'wait' ? 0 : part.kind === 'walk' ? 7 + part.seconds / total * 10 : 15 + part.seconds / total * 18;
    const stage: StoryStage = {
      id: `${index}-${part.kind}-${part.leg.expectedStartTime}`, kind: part.kind, leg: part.leg, seconds: part.seconds,
      start, end: cursor / total, xStart: x, xEnd: x + distance,
      label: `${modeName(part.kind)}${part.leg.line?.publicCode && part.kind !== 'wait' ? ` ${part.leg.line.publicCode}` : ''}`,
      color: modeColors[part.kind],
    };
    x += distance;
    return stage;
  });
}
export function storyPosition(stages: StoryStage[], progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  const index = stages.findIndex(stage => p < stage.end);
  const activeIndex = index < 0 ? stages.length - 1 : index;
  const stage = stages[activeIndex];
  const local = Math.min(1, Math.max(0, (p - stage.start) / Math.max(.00001, stage.end - stage.start)));
  return { stage, index: activeIndex, local, x: stage.xStart + (stage.xEnd - stage.xStart) * local };
}
export function formatElapsed(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

export function waitingVehicle(local: number, stopX: number, reduced = false) {
  const progress = Math.min(1, Math.max(0, local));
  const approach = Math.min(1, Math.max(0, (progress - .15) / .7));
  const eased = 1 - (1 - approach) ** 3;
  const opening = Math.min(1, Math.max(0, (progress - .85) / .1));
  const door = opening * opening * (3 - 2 * opening);
  return { x: stopX + .9 - (reduced ? 0 : 18 * (1 - eased)), door: reduced ? 1 : door, state: progress < .15 ? 'approaching' : progress < .85 ? 'arriving' : 'at-stop' };
}

export function transitMotion(stages: StoryStage[], index: number, local: number, reduced = false) {
  const previous = stages[index - 1];
  const needsArrival = !previous || !['walk', 'wait'].includes(previous.kind);
  const arrivalEnd = needsArrival ? .04 : 0;
  const boardingEnd = arrivalEnd + .075;
  const arriving = needsArrival && local < arrivalEnd;
  const boarding = !arriving && local < boardingEnd;
  const boardingProgress = Math.min(1, Math.max(0, (local - arrivalEnd) / .075));
  const arrival = waitingVehicle(needsArrival ? local / arrivalEnd : 1, stages[index].xStart, reduced);
  const travel = Math.min(1, Math.max(0, (local - boardingEnd) / (.925 - boardingEnd)));
  return { arriving, boarding, boardingProgress, travel, arrival };
}

export function destinationEntry(progress: number, endX: number) {
  const t = Math.min(1, Math.max(0, (progress - .96) / .04));
  const approach = Math.min(1, t / .45);
  const enter = Math.min(1, Math.max(0, (t - .45) / .55));
  return { active: progress >= .96, x: endX + 3.1 * approach, z: 1.05 - enter * 4, rotation: enter > 0 ? Math.PI / 2 : 0, door: Math.min(1, t / .35) * (1 - Math.max(0, (t - .88) / .12)), inside: t >= .98, phase: t };
}
