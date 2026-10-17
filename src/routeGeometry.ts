import type { Coordinates } from './commute';
import type { StoryStage } from './story';

export interface RoutePoint { x: number; z: number }
export interface RouteSample extends RoutePoint { yaw: number }
interface RouteSegment { start: number; end: number; points: RoutePoint[]; lengths: number[]; length: number; geographic: boolean }
export interface IllustratedRoute { segments: RouteSegment[]; hasGeometry: boolean; sample: (distance: number, lateral?: number) => RouteSample }

export function decodePolyline(encoded: unknown): Coordinates[] {
  if (typeof encoded !== 'string' || encoded.length < 4 || encoded.length > 200000) return [];
  const points: Coordinates[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const readDelta = (): number | null => {
    let result = 0;
    let factor = 1;
    for (let group = 0; group < 6; group++) {
      if (index >= encoded.length) return null;
      const byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) return null;
      result += (byte & 31) * factor;
      if (byte < 32) return result % 2 ? -(Math.floor(result / 2) + 1) : result / 2;
      factor *= 32;
    }
    return null;
  };
  while (index < encoded.length) {
    const lat = readDelta();
    const lon = readDelta();
    if (lat === null || lon === null) return [];
    latitude += lat; longitude += lon;
    const point = { latitude: latitude / 100000, longitude: longitude / 100000 };
    if (Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) return [];
    const last = points[points.length - 1];
    if (!last || point.latitude !== last.latitude || point.longitude !== last.longitude) points.push(point);
  }
  return points.length >= 2 ? points : [];
}
function cumulative(points: RoutePoint[]) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z));
  return lengths;
}
function along(points: RoutePoint[], lengths: number[], fraction: number): RouteSample {
  const length = lengths[lengths.length - 1];
  const target = Math.max(0, Math.min(1, fraction)) * length;
  let lo = 1; let hi = lengths.length - 1;
  while (lo < hi) { const middle = Math.floor((lo + hi) / 2); if (lengths[middle] < target) lo = middle + 1; else hi = middle; }
  const a = points[lo - 1]; const b = points[lo];
  const t = (target - lengths[lo - 1]) / Math.max(.000001, lengths[lo] - lengths[lo - 1]);
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: Math.atan2(-(b.z - a.z), b.x - a.x) || 0 };
}

export function stylizeRoute(points: RoutePoint[], distance: number, origin: RoutePoint, initialYaw: number): RoutePoint[] {
  const lengths = cumulative(points);
  const count = Math.max(2, Math.ceil(distance / .2));
  const step = distance / count;
  const result: RoutePoint[] = [{ ...origin }];
  let yaw = initialYaw;
  for (let i = 1; i <= count; i++) {
    const fraction = (i - .5) / count;
    // Average over a broad slice of the real route, then interpret that heading
    // as a gentle suggestion. A forward-only path prevents folded road ribbons.
    const before = along(points, lengths, Math.max(0, fraction - .16));
    const after = along(points, lengths, Math.min(1, fraction + .16));
    const target = Math.max(-.65, Math.min(.65, Math.atan2(-(after.z - before.z), after.x - before.x) || 0));
    const nextYaw = yaw + Math.max(-.035 * step, Math.min(.035 * step, target - yaw));
    const midYaw = (yaw + nextYaw) / 2;
    const previous = result[result.length - 1];
    result.push({ x: previous.x + Math.cos(midYaw) * step, z: previous.z - Math.sin(midYaw) * step });
    yaw = nextYaw;
  }
  return result;
}

export function buildIllustratedRoute(stages: StoryStage[]): IllustratedRoute {
  const decoded = stages.map(stage => stage.kind === 'wait' ? [] : decodePolyline(stage.leg.pointsOnLink && typeof stage.leg.pointsOnLink === 'object' ? stage.leg.pointsOnLink.points : null));
  const first = decoded.find(points => points.length >= 2);
  const referenceLatitude = first?.[0].latitude ?? 60;
  const longitudeScale = Math.cos(referenceLatitude * Math.PI / 180);
  // Rotate the whole journey once so its first heading points into the scene.
  const initialHeading = first ? Math.atan2(-(first[1].latitude - first[0].latitude), (first[1].longitude - first[0].longitude) * longitudeScale) : 0;
  const segments: RouteSegment[] = [];
  let cursor: RoutePoint = { x: 0, z: 0 };
  let lastYaw = 0;
  stages.forEach((stage, index) => {
    if (stage.kind === 'wait' || stage.xEnd <= stage.xStart) return;
    const coordinates = decoded[index];
    let points: RoutePoint[];
    let geographic = false;
    if (coordinates.length >= 2) {
      const origin = coordinates[0];
      const raw = coordinates.map(point => {
        const east = (point.longitude - origin.longitude) * longitudeScale;
        const south = -(point.latitude - origin.latitude);
        return { x: east * Math.cos(initialHeading) + south * Math.sin(initialHeading), z: -east * Math.sin(initialHeading) + south * Math.cos(initialHeading) };
      });
      const rawLengths = cumulative(raw);
      const rawLength = rawLengths[rawLengths.length - 1];
      if (rawLength > .0000001) {
        points = stylizeRoute(raw, stage.xEnd - stage.xStart, cursor, lastYaw);
        geographic = true;
      } else points = [];
    } else points = [];
    if (!points.length) points = [cursor, { x: cursor.x + Math.cos(lastYaw) * (stage.xEnd - stage.xStart), z: cursor.z - Math.sin(lastYaw) * (stage.xEnd - stage.xStart) }];
    const lengths = cumulative(points);
    segments.push({ start: stage.xStart, end: stage.xEnd, points, lengths, length: lengths[lengths.length - 1], geographic });
    cursor = points[points.length - 1];
    lastYaw = along(points, lengths, 1).yaw;
  });
  const centerline = (distance: number): RouteSample => {
    if (!segments.length) return { x: distance, z: 0, yaw: 0 };
    const segment = segments.find(part => distance <= part.end) ?? segments[segments.length - 1];
    let point = along(segment.points, segment.lengths, (distance - segment.start) / Math.max(.0001, segment.end - segment.start));
    if (distance < segments[0].start || distance > segments[segments.length - 1].end) {
      const offset = distance < segment.start ? distance - segment.start : distance - segment.end;
      point = { ...point, x: point.x + Math.cos(point.yaw) * offset, z: point.z - Math.sin(point.yaw) * offset };
    }
    return point;
  };
  const sample = (distance: number, lateral = 0): RouteSample => {
    const point = centerline(distance);
    // A finite-distance tangent blends corners and leg joins; the offset sidewalk
    // and the actor must share this frame to avoid jumping across a sharp turn.
    const before = centerline(distance - .35);
    const after = centerline(distance + .35);
    const dx = after.x - before.x;
    const dz = after.z - before.z;
    const yaw = Math.hypot(dx, dz) > .00001 ? Math.atan2(-dz, dx) || 0 : point.yaw;
    return { x: point.x + Math.sin(yaw) * lateral, z: point.z + Math.cos(yaw) * lateral, yaw };
  };
  return { segments, hasGeometry: segments.some(segment => segment.geographic), sample };
}
