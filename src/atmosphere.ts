export interface Atmosphere { darkness: number; period: 'day' | 'dusk' | 'night' | 'dawn'; sky: string; horizon: string; timestamp: number }
const norwayClock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const smooth = (value: number) => { const t = Math.min(1, Math.max(0, value)); return t * t * (3 - 2 * t); };
function mix(a: string, b: string, t: number) {
  const channels = [1, 3, 5].map(index => Math.round(parseInt(a.slice(index, index + 2), 16) * (1 - t) + parseInt(b.slice(index, index + 2), 16) * t).toString(16).padStart(2, '0'));
  return `#${channels.join('')}`;
}
export function journeyAtmosphere(start: string, end: string, progress: number): Atmosphere {
  const timestamp = Date.parse(start) + (Date.parse(end) - Date.parse(start)) * Math.min(1, Math.max(0, progress));
  const parts = norwayClock.formatToParts(new Date(timestamp));
  const hour = Number(parts.find(p => p.type === 'hour')?.value ?? 12) + Number(parts.find(p => p.type === 'minute')?.value ?? 0) / 60;
  const darkness = hour < 6 ? 1 : hour < 8 ? 1 - smooth((hour - 6) / 2) : hour < 18 ? 0 : hour < 20 ? smooth((hour - 18) / 2) : 1;
  return { darkness, period: darkness === 0 ? 'day' : darkness === 1 ? 'night' : hour < 12 ? 'dawn' : 'dusk', sky: mix('#f8dfcb', '#222940', darkness), horizon: mix('#f8e6cc', '#49435f', darkness), timestamp };
}
