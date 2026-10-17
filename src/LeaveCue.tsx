import { useEffect, useState } from 'react';
import { ArrowRight, Footprints, RefreshCw } from 'lucide-react';
import type { Journey } from './commute';
import { minutes, timeLabel } from './commute';
import { leaveStatus } from './departures';
import { formatElapsed } from './story';

export default function LeaveCue({ journey, preview, onStart, onRefresh }: { journey: Journey; preview: boolean; onStart: () => void; onRefresh: () => void }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick); };
  }, []);
  const status = leaveStatus(journey, now);
  const title = status.state === 'missed' ? 'Check for a later departure.' : status.state === 'leave' ? 'Time to head out.' : status.state === 'ready' ? 'Get ready to leave.' : 'Your departure is planned.';
  return <aside className={`leave-cue leave-${status.state}`} data-testid="leave-cue" data-state={status.state} aria-label="When to leave">
    <div className="leave-illustration" aria-hidden="true"><span className="little-clock"><i/><i/></span><span className="little-door"/><span className="little-shoe shoe-one"/><span className="little-shoe shoe-two"/><span className="leave-motion-line line-one"/><span className="leave-motion-line line-two"/></div>
    <div className="leave-copy"><span className="leave-eyebrow">{preview ? 'EXAMPLE · NOT A REAL REMINDER' : 'YOUR SELECTED JOURNEY'}</span><output aria-live="polite">{title}</output><span className="leave-timing">{status.state === 'missed' ? 'The planned leave time has passed. Refresh before heading out.' : <><b>{status.seconds > 0 ? `Leave in ${formatElapsed(status.seconds)}` : 'Leave now'}</b><span>· {timeLabel(new Date(status.leaveAt).toISOString())}{status.walkingSeconds > 0 && ` · ${minutes(status.walkingSeconds)} min walk`}</span></>}</span><small>{preview ? 'Example times. Search for a route to see your departures.' : 'Based on the itinerary’s start time · not a background alarm.'}</small></div>
    <button type="button" className="leave-action" aria-label={status.state === 'missed' ? 'Find a new way' : 'Explore this journey'} onClick={status.state === 'missed' ? onRefresh : onStart}>{status.state === 'missed' ? <><RefreshCw size={14}/><span>Find a new way</span></> : <><Footprints size={14}/><span>Explore this journey</span><ArrowRight size={13}/></>}</button>
  </aside>;
}
