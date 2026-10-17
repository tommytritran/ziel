import type { StoryStage } from './story';

export const METRO_DEPTH = -3.2;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
export function metroJourney(stages: StoryStage[], index: number, local: number) {
  const stage = stages[index];
  const next = stages[index + 1];
  const previous = stages[index - 1];
  const following = next?.kind === 'wait' ? stages[index + 2] : next;
  const metro = stage.kind === 'metro';
  const walkToMetro = stage.kind === 'walk' && following?.kind === 'metro';
  const waitForMetro = stage.kind === 'wait' && next?.kind === 'metro';
  const previousService = stages.slice(0, index).reverse().find(part => part.kind !== 'wait');
  const nextService = stages.slice(index + 1).find(part => part.kind !== 'wait');
  const alreadyBelow = metro && (previous?.kind === 'walk' || previous?.kind === 'wait' || previousService?.kind === 'metro');
  const staysBelow = metro && nextService?.kind === 'metro';
  const transferWait = waitForMetro && previousService?.kind !== 'walk' && previousService?.kind !== 'metro';
  const descent = walkToMetro ? clamp((local - .7) / .3) : transferWait ? clamp(local / .3) : metro && !alreadyBelow ? clamp(local / .12) : 0;
  const ascentEnd = !next ? Math.min(.955, Math.max(.92, (.96 - stage.start) / Math.max(.00001, stage.end - stage.start) - .005)) : 1;
  const ascent = metro && !staysBelow ? clamp((local - .9) / Math.max(.02, ascentEnd - .9)) : 0;
  const depth = (walkToMetro ? METRO_DEPTH * descent : waitForMetro ? METRO_DEPTH * (transferWait ? descent : 1) : metro ? METRO_DEPTH * (alreadyBelow ? 1 : descent) * (1 - ascent) : 0) || 0;
  const boarding = metro && local >= .3 && local < .38;
  const boardingProgress = clamp((local - .3) / .08);
  const travel = clamp((local - .43) / .37);
  const alighting = metro && local >= .86;
  const alightingProgress = clamp((local - .86) / .04);
  const arrival = clamp((local - .12) / .13);
  const arrivalOffset = -18 * (1 - arrival) ** 3;
  const door = local < .25 ? 0 : local < .3 ? clamp((local - .25) / .05) : local < .38 ? 1 : local < .43 ? 1 - clamp((local - .38) / .05) : local < .83 ? 0 : local < .86 ? clamp((local - .83) / .03) : local < .9 ? 1 : 0;
  const sequence = !metro ? waitForMetro ? 'waiting' : walkToMetro && descent > 0 ? 'descending' : 'surface' : !alreadyBelow && local < .12 ? 'descending' : local < .12 ? 'waiting' : local < .25 ? 'arriving' : local < .3 ? 'opening' : local < .38 ? 'boarding' : local < .43 ? 'closing' : local < .8 ? 'riding' : local < .83 ? 'stopped' : local < .86 ? 'opening-exit' : local < .9 ? 'alighting' : staysBelow ? 'platform' : ascent < 1 ? 'ascending' : 'surface';
  const phase = sequence === 'descending' ? 'descending' : sequence === 'ascending' ? 'ascending' : depth < -.1 ? 'underground' : 'surface';
  const platformOffset = transferWait ? 3 * descent : metro && previous?.kind === 'wait' && !['walk', 'metro'].includes(previousService?.kind ?? '') ? 3 * (1 - clamp(local / .12)) : 0;
  return { metro, walkToMetro, waitForMetro, alreadyBelow, descent, ascent, depth, phase, context: metro || waitForMetro || walkToMetro && descent > 0, sequence, boarding, boardingProgress, travel, alighting, alightingProgress, arrivalOffset, door, platformOffset, characterVisible: !metro || local < .38 || local >= .86 };
}
