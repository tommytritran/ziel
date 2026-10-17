import type { StoryStage } from './story';

export function stationAccesses(stages: StoryStage[]) {
  return stages.filter(stage => stage.kind === 'metro').flatMap(stage => {
    const index = stages.indexOf(stage);
    const previous = stages[index - 1]?.kind === 'wait' ? stages[index - 2] : stages[index - 1];
    const length = previous?.kind === 'walk' ? (previous.xEnd - previous.xStart) * .3 : 3;
    return [{ start: stage.xStart - length, end: stage.xStart }, { start: stage.xEnd, end: stage.xEnd + 3 }];
  });
}
