import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { ArrowRight, Check, Footprints, X } from 'lucide-react';
import type { Departure } from './departures';
import { timeLabel } from './commute';
import { ModeIcon } from './JourneyStory';

export default function PhoneDepartures({ anchor, departures, chosen, selected, preview, onSelect }: { anchor: RefObject<HTMLElement | null>; departures: Departure[]; chosen: boolean; selected: number; preview: boolean; onSelect: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const expanded = open || hover;
  return <section ref={anchor} className={`departure-phone ${expanded ? 'is-open' : ''}`} aria-label="Upcoming departures" onMouseEnter={() => { if (matchMedia('(hover: hover)').matches) setHover(true); }} onMouseLeave={() => setHover(false)} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); setHover(false); trigger.current?.focus(); } }}>
    <button ref={trigger} type="button" className="phone-trigger" aria-label="Open phone departures" aria-expanded={expanded} onClick={() => setOpen(value => !value)}><span>Check departures</span></button>
    {expanded && <div className="phone-screen"><span className="phone-notch"/><div className="phone-status"><span>ziel</span><span>● ▰</span></div><button type="button" className="phone-close" aria-label="Close phone departures" onClick={() => { setOpen(false); setHover(false); trigger.current?.focus(); }}><X size={17}/></button><span className="phone-eyebrow">YOUR JOURNEY</span><h2>Next departures</h2><p>Choose the one that suits you.</p><div className="departure-board-columns"><span>LINE / TOWARDS</span><span>DEPARTS</span></div>{departures.length ? <ol>{departures.map(departure => <li key={departure.id}><button type="button" className="departure-choice" aria-label={`Take ${departure.line} to ${departure.destination} at ${timeLabel(departure.time)}`} aria-pressed={chosen && departure.journeyIndices.includes(selected)} onClick={() => { setOpen(true); onSelect(departure.journeyIndices.includes(selected) ? selected : departure.journeyIndices[0]); }}><span className="board-line"><ModeIcon kind={departure.kind} size={15}/>{departure.line}</span><span className="board-destination">{departure.destination}<small>From {departure.stop}</small></span><time dateTime={departure.time}>{timeLabel(departure.time)}</time>{chosen && departure.journeyIndices.includes(selected) && <Check className="departure-selected-check" size={12}/>}</button></li>)}</ol> : <div className="board-walk-only"><Footprints size={20}/><span>No transit needed.<strong>This route is a walk.</strong><button type="button" className="choose-walk" onClick={() => onSelect(selected)}>Choose this walk<ArrowRight size={12}/></button></span></div>}<div className="phone-data-note">{preview ? 'Example departures · not live' : 'Journey options from Entur'}<br/>{chosen ? 'Journey selected. Scroll to explore.' : 'Select a departure to see when to leave.'}</div><span className="phone-home-indicator"/></div>}
  </section>;
}
