import type { IllustratedRoute, RoutePoint } from './routeGeometry';
import type { StoryStage } from './story';

interface Obstacle extends RoutePoint { radius: number }
export function placeStreetLights(route: IllustratedRoute, stages: StoryStage[]) {
  const end = stages.at(-1)?.xEnd ?? 0;
  const obstacles: Obstacle[] = [];
  const add = (distance: number, lateral: number, radius: number) => obstacles.push({ ...route.sample(distance, lateral), radius });
  add(-2.8, -3.5, 2.7);
  add(end + (stages.at(-1)?.kind === 'metro' ? 6.1 : 3.1), -3.5, 2.7);
  for (let i = 0; i < Math.ceil(end / 9); i++) add(7 + i * 9, -5.5 - i % 2 * 1.5, 2.2);
  for (const stage of stages) {
    if (['walk', 'wait', 'bike', 'plane'].includes(stage.kind)) continue;
    if (stage.kind === 'metro') {
      const index = stages.indexOf(stage);
      const previous = stages[index - 1]?.kind === 'wait' ? stages[index - 2] : stages[index - 1];
      const length = previous?.kind === 'walk' ? (previous.xEnd - previous.xStart) * .3 : 3;
      add(stage.xStart - length - .55, 1.5, 2);
      add(stage.xEnd + 2.45, 1.5, 2);
    } else { add(stage.xStart, -1.1, 2.8); add(stage.xEnd, -1.1, 2.8); }
  }
  const placed: ReturnType<IllustratedRoute['sample']>[] = [];
  for (let i = 0; i < Math.ceil(end / 7) + 2; i++) {
    for (const offset of [0, 1.5, -1.5, 3, -3]) {
      const p = route.sample(-4 + i * 7 + offset, -2.5);
      const clear = obstacles.every(obstacle => Math.hypot(p.x - obstacle.x, p.z - obstacle.z) > obstacle.radius + .75);
      if (clear && placed.every(other => Math.hypot(p.x - other.x, p.z - other.z) >= 4)) { placed.push(p); break; }
    }
  }
  return placed;
}
