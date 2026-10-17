import { useEffect, useRef } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { Journey } from './commute';
import type { RouteRequest } from './planner';
import { dateLabel, minutes, timeLabel } from './commute';
import { vehicleKind } from './story';
import { ModeIcon } from './JourneyStory';

export default function DetailsDialog({ journey, request, preview, onClose }: { journey: Journey | undefined; request: RouteRequest; preview: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef(document.activeElement);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => {
      node?.close();
      const previous = trigger.current;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} className="details-dialog" aria-label="Journey details" onCancel={onClose} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]');
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="details-panel"><button type="button" className="icon-button details-close" aria-label="Close journey details" onClick={onClose}><X size={20}/></button><span className="eyebrow">JOURNEY DETAILS</span><h2>Your route to {request.to.name}.</h2><p>{request.from.name}<ArrowRight size={13}/>{request.to.name}</p>{preview && <span className="detail-preview">Example journey · not a live departure</span>}
      <ol className="journey-timeline">{journey?.legs.map((leg, index) => <li key={`${leg.expectedStartTime}-${index}`}><span><ModeIcon kind={vehicleKind(leg.mode)}/></span><div><strong>{vehicleKind(leg.mode) === 'walk' ? 'Walk' : `${leg.mode} ${leg.line?.publicCode ?? ''}`} · {minutes(leg.duration)} min</strong><p>{leg.fromPlace.name} → {leg.toPlace.name}</p><small>{dateLabel(leg.expectedStartTime)} {timeLabel(leg.expectedStartTime)} → {dateLabel(leg.expectedEndTime)} {timeLabel(leg.expectedEndTime)}</small></div></li>)}</ol>
      <p className="details-privacy">Times are shown in Norway’s timezone. This is a journey plan, not a ticket or live location tracker. Recheck departures before travelling.</p><a href="https://developer.entur.no/" target="_blank" rel="noreferrer">Journey data from Entur (NLOD) ↗</a>
    </section>
  </dialog>;
}
