import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Bike, BusFront, Check, ChevronRight, Clock3, Footprints, MapPin, Mouse, RotateCcw, Ship, TrainFront } from 'lucide-react';
import type { Journey } from './commute';
import { dateLabel, minutes, timeLabel } from './commute';
import { buildStory, formatElapsed, modeName, storyPosition, transitMotion } from './story';
import type { VehicleKind } from './story';
import { upcomingDepartures } from './departures';
import LeaveCue from './LeaveCue';
const JourneyScene = lazy(() => import('./JourneyScene'));
export function ModeIcon({ kind, size = 18 }: { kind: VehicleKind; size?: number }) {
  if (kind === 'walk') return <Footprints size={size}/>;
  if (kind === 'wait') return <Clock3 size={size}/>;
  if (kind === 'bus') return <BusFront size={size}/>;
  if (kind === 'ferry') return <Ship size={size}/>;
  if (kind === 'bike') return <Bike size={size}/>;
  return <TrainFront size={size}/>;
}
export default function JourneyStory({ journey, journeys, selected, chosen, onSelect, onRefresh, fromName, toName, preview, onSetup, onExploring }: { journey: Journey; journeys: Journey[]; selected: number; chosen: boolean; onSelect: (index: number) => void; onRefresh: () => void; fromName: string; toName: string; preview: boolean; onSetup: () => void; onExploring: (active: boolean) => void }) {
  const stages = useMemo(() => buildStory(journey), [journey]);
  const departures = useMemo(() => upcomingDepartures(journeys), [journeys]);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const scroll = useRef<HTMLDivElement>(null);
  const monitor = useRef<HTMLElement>(null);
  const sceneViewport = useRef<HTMLDivElement>(null);
  const locationBubble = useRef<HTMLDivElement>(null);
  const placeBubble = useCallback((x: number, y: number, actor: 'character' | 'vehicle') => {
    const bubble = locationBubble.current;
    const viewport = sceneViewport.current;
    if (!bubble || !viewport) return;
    const parent = viewport.parentElement;
    if (!parent) return;
    const anchorX = viewport.offsetLeft + x;
    const anchorY = viewport.offsetTop + y;
    const halfWidth = bubble.offsetWidth / 2;
    const left = Math.max(halfWidth + 12, Math.min(parent.clientWidth - halfWidth - 12, anchorX));
    const top = Math.max(bubble.offsetHeight + 65, Math.min(parent.clientHeight * .72, anchorY - 12));
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;
    bubble.style.setProperty('--bubble-tail', `${Math.max(12, Math.min(bubble.offsetWidth - 12, anchorX - left + halfWidth))}px`);
    bubble.dataset.tracking = actor;
    bubble.dataset.anchorX = anchorX.toFixed(1);
    bubble.dataset.anchorY = anchorY.toFixed(1);
  }, []);
  const placeMonitor = useCallback((x: number, y: number, width: number, viewportWidth: number) => {
    const board = monitor.current;
    const viewport = sceneViewport.current;
    if (!board || !viewport) return;
    const scale = Math.max(.25, width / 276);
    const parentWidth = viewport.parentElement?.clientWidth ?? viewportWidth;
    board.style.left = `${viewport.offsetLeft + x}px`;
    board.style.top = `${viewport.offsetTop + y}px`;
    board.style.setProperty('--monitor-scale', String(scale));
    board.style.setProperty('--monitor-expanded-scale', String(Math.min(scale * 2.8, parentWidth * .86 / 276)));
    board.dataset.positioned = 'true';
  }, []);
  const total = stages.reduce((sum, s) => sum + s.seconds, 0);
  const current = storyPosition(stages, progress);
  const arrived = progress >= .998;
  const starting = progress < .018;
  const walking = current.stage.kind === 'walk';
  const waiting = current.stage.kind === 'wait';
  const motion = transitMotion(stages, current.index, current.local, reduced);
  const arrivingVehicle = !walking && !waiting && motion.arriving;
  const boarding = !walking && !waiting && motion.boarding;
  const elapsed = total * progress;
  const stageElapsed = current.stage.seconds * current.local;
  const first = journey.legs[0];
  const last = journey.legs[journey.legs.length - 1];
  const title = starting ? 'Your journey,\nstep by step.' : arrived ? `You’ve arrived.` : waiting ? 'A moment at the stop.' : walking ? current.index === stages.length - 1 ? 'The final few steps.' : 'Start with a walk.' : arrivingVehicle ? 'Here comes your ride.' : boarding ? 'Your ride is here.' : 'On your way.\nEnjoy the journey.';
  const caption = starting ? `From ${fromName} to ${toName}. Choose a departure, then scroll to explore your route.` : arrived ? `Welcome to ${toName}. You’ve reached your destination.` : waiting ? `Wait at ${current.stage.leg.fromPlace.name}. Your next ride is on its way.` : walking ? `Walk to ${current.index === stages.length - 1 ? toName : current.stage.leg.toPlace.name}.` : `${modeName(current.stage.kind)} ${current.stage.leg.line?.publicCode ?? ''} from ${current.stage.leg.fromPlace.name} to ${current.stage.leg.toPlace.name}.`;
  const seek = useCallback((next: number) => {
    const node = scroll.current;
    if (node) node.scrollTo({ top: Math.min(1, Math.max(0, next)) * (node.scrollHeight - node.clientHeight), behavior: 'instant' });
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { seek(0); setProgress(0); }, [journey, seek]);
  useEffect(() => { onExploring(progress > .002); return () => onExploring(false); }, [progress, onExploring]);
  return <div className="journey-scroll" ref={scroll} role="region" tabIndex={0} aria-label="Scroll to explore your journey" onScroll={event => { const el = event.currentTarget; setProgress(Math.min(1, Math.max(0, el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)))); }} onKeyDown={event => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); seek(progress + .035); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); seek(progress - .035); }
    if (event.key === 'Home') { event.preventDefault(); seek(0); }
    if (event.key === 'End') { event.preventDefault(); seek(1); }
  }}>
    <div className="scroll-track"><section className={`story-screen ${arrived ? 'is-arrived' : ''} ${starting ? 'is-starting' : ''}`} data-testid="journey-story" data-mode={current.stage.kind} data-progress={progress.toFixed(3)}>
      <div className="story-top"><div className="journey-context"><span className={preview ? 'example-badge' : 'live-badge'}><span/>{preview ? 'EXAMPLE JOURNEY' : 'YOUR PLANNED JOURNEY'}</span><span className="context-route"><span>{fromName}</span><ArrowRight size={13}/><span>{toName}</span></span></div><span className="total-time"><Clock3 size={14}/>{minutes(total)} min total</span></div>
      <div className="story-copy"><span className="chapter-label">{arrived ? 'YOU MADE IT' : `CHAPTER ${String(current.index + 1).padStart(2, '0')} / ${String(stages.length).padStart(2, '0')}`}<span className="chapter-line"/>{arrived ? 'THE HAPPY ENDING' : current.stage.label.toUpperCase()}</span><h1>{title.split('\n').map((line, index) => <span key={line}>{index > 0 && <br/>}{line}</span>)}</h1><p>{caption}</p></div>
      <div className="sky-sun" aria-hidden="true"><span/><span/><span/><span/></div><div className="cloud cloud-one" aria-hidden="true"/><div className="cloud cloud-two" aria-hidden="true"/>
      <div ref={sceneViewport} className="scene-viewport" role="img" aria-label={`Illustrated journey: ${starting ? `checking departures from ${fromName}` : arrived ? `arrived at ${toName}` : boarding ? `boarding ${current.stage.kind}` : current.stage.label}`}><Suspense fallback={<div className="scene-loading">Preparing your journey visualization…</div>}><JourneyScene stages={stages} progress={progress} reduced={reduced} onMonitorLayout={placeMonitor} onActorLayout={placeBubble} /></Suspense></div>
      {starting && <section ref={monitor} className="departure-board anchored-monitor" aria-label="Upcoming departures" tabIndex={0}><div className="departure-board-top"><span className="board-light"/><span>{'DEPARTURES'}<strong>Choose your departure</strong></span><span className="board-arrow">↗</span></div>{departures.length ? <><div className="departure-board-columns"><span>LINE / TOWARDS</span><span>DEPARTS</span></div><ol>{departures.map(departure => <li key={departure.id}><button type="button" className="departure-choice" aria-label={`Take ${departure.line} to ${departure.destination} at ${timeLabel(departure.time)}`} aria-pressed={chosen && departure.journeyIndices.includes(selected)} onClick={() => onSelect(departure.journeyIndices.includes(selected) ? selected : departure.journeyIndices[0])}><span className="board-line"><ModeIcon kind={departure.kind} size={13}/>{departure.line}</span><span className="board-destination">{departure.destination}<small>From {departure.stop}</small></span><time dateTime={departure.time}>{timeLabel(departure.time)}</time>{chosen && departure.journeyIndices.includes(selected) && <Check className="departure-selected-check" size={11}/>}</button></li>)}</ol></> : <div className="board-walk-only"><Footprints size={18}/><span>No transit needed.<strong>This one’s a walk.</strong><button type="button" className="choose-walk" aria-pressed={chosen} onClick={() => onSelect(selected)}>Choose this walk <ArrowRight size={12}/></button></span></div>}<div className="departure-board-footer"><span/>{preview ? 'EXAMPLE · CLICK A DEPARTURE' : chosen ? 'CHOSEN · REFRESH TO REPLAN' : 'ENTUR · CLICK A DEPARTURE'}</div></section>}
      {chosen && <LeaveCue journey={journey} preview={preview} onStart={() => seek(Math.max(.025, stages[0].start))} onRefresh={onRefresh}/>}
      <div ref={locationBubble} className={`floating-sign tracking-bubble ${waiting ? 'waiting-bubble' : ''}`} data-testid="location-bubble"><span className="sign-icon" style={{ background: arrived ? '#a7bd92' : current.stage.color }}>{arrived ? <MapPin size={17}/> : <ModeIcon kind={current.stage.kind} size={17}/>}</span><span><small>{arrived ? 'YOU ARE HERE' : waiting ? 'TAKE A BREATHER' : walking ? 'ON FOOT' : boarding ? 'ALL ABOARD' : 'ENJOY THE RIDE'}</small><strong>{arrived ? toName : waiting ? current.stage.leg.fromPlace.name : current.stage.leg.toPlace.name}</strong>{waiting && <span className="waiting-dots" aria-label="Waiting for your ride"><i/><i/><i/></span>}</span>{arrived && <Check size={17}/>}</div>
      <div className="stage-time"><div className="stage-time-icon" style={{ color: current.stage.color }}><ModeIcon kind={current.stage.kind} size={20}/></div><div><span>{arrived ? 'Journey complete' : `${formatElapsed(stageElapsed)} / ${formatElapsed(current.stage.seconds)}`}</span><small>{arrived ? 'You’ve reached your destination.' : `${minutes(current.stage.seconds)} min ${walking ? 'of walking' : waiting ? 'at the stop' : `by ${modeName(current.stage.kind).toLowerCase()}`}`}</small></div><svg viewBox="0 0 38 38" className="time-ring" aria-hidden="true"><circle cx="19" cy="19" r="16"/><circle cx="19" cy="19" r="16" style={{ strokeDasharray: 100.53, strokeDashoffset: 100.53 * (1 - current.local), stroke: current.stage.color }}/></svg></div>
      <div className="story-bottom"><div className="scroll-instruction">{arrived ? <Check size={16}/> : <Mouse size={17}/>}<span>{arrived ? 'YOU’VE ARRIVED. NICE LITTLE JOURNEY.' : progress < .01 ? 'SCROLL TO TAKE THE FIRST STEP' : 'KEEP SCROLLING. YOU’RE ON YOUR WAY.'}</span>{!arrived && <ArrowDown size={14}/>}</div><span className="story-disclaimer">{preview ? 'Example journey, not a live departure' : 'Journey data by Entur'} · An illustrated journey, not a map</span></div>
      <div className="timeline-dock"><div className="timeline-meta"><span><span className="tiny-dot"/>{arrived ? 'THERE YOU ARE' : 'YOUR LITTLE JOURNEY'}</span><div><span className="elapsed-time">{formatElapsed(elapsed)}</span><span className="timeline-total"> / {formatElapsed(total)}</span></div><button type="button" aria-label="Replay journey" onClick={() => seek(0)}><RotateCcw size={13}/>Start again</button></div>
        <div className="story-timeline">{stages.map((stage, index) => <button type="button" key={stage.id} style={{ flex: stage.seconds, '--stage-color': stage.color } as React.CSSProperties} className={`timeline-stage ${current.index === index ? 'active' : ''} ${progress >= stage.end ? 'completed' : ''}`} onClick={() => seek(stage.start)} aria-label={`Go to ${stage.label}, ${minutes(stage.seconds)} minutes`} aria-current={current.index === index ? 'step' : undefined}><span className="timeline-stage-fill" style={{ width: `${Math.max(0, Math.min(1, (progress - stage.start) / (stage.end - stage.start))) * 100}%` }}/><span className="timeline-stage-content"><ModeIcon kind={stage.kind} size={14}/><strong>{stage.label}</strong><small>{minutes(stage.seconds)} min</small></span></button>)}<button type="button" className={`arrival-button ${arrived ? 'active' : ''}`} onClick={() => seek(1)} aria-label="Go to arrival"><MapPin size={17}/></button></div>
        <input className="progress-scrubber" aria-label="Journey progress" type="range" min="0" max="1000" value={Math.round(progress * 1000)} onChange={e => seek(Number(e.target.value) / 1000)}/>
        <div className="timeline-endpoints"><span>{dateLabel(first.expectedStartTime)} {timeLabel(first.expectedStartTime)} <span>{fromName}</span></span><span>{toName}<span>{dateLabel(last.expectedEndTime)} {timeLabel(last.expectedEndTime)}</span></span></div>
      </div>
      <div className="story-footer"><span className="footer-note">Your route, brought to life.</span><div className="step-buttons"><button type="button" aria-label="Previous journey chapter" onClick={() => seek(stages[Math.max(0, current.index - 1)].start)} disabled={progress <= .001}><ArrowLeft size={14}/></button><button type="button" aria-label="Next journey chapter" onClick={() => seek(current.index === stages.length - 1 ? 1 : stages[current.index + 1].start)} disabled={arrived}><ArrowRight size={14}/></button></div>{preview ? <button type="button" className="setup-link" onClick={onSetup}>Plan your own journey<ChevronRight size={14}/></button> : <a href="https://developer.entur.no/" target="_blank" rel="noreferrer">Journey data from Entur (NLOD) ↗</a>}</div>
    </section></div>
  </div>;
}
