import { useEffect, useRef, useState } from 'react';
import { ArrowDownUp, ArrowRight, LocateFixed, LoaderCircle } from 'lucide-react';
import { distanceMeters } from './commute';
import type { Place } from './commute';
import type { RouteRequest } from './planner';
import { loadRecentRoute, RECENT_ROUTE_KEY } from './planner';
import LocationField from './LocationField';

export default function PlannerForm({ onPlan, loading }: { onPlan: (request: RouteRequest, remember: boolean) => void; loading: boolean }) {
  const [recent] = useState(loadRecentRoute);
  const [from, setFrom] = useState<Place | null>(recent?.from ?? null);
  const [to, setTo] = useState<Place | null>(recent?.to ?? null);
  const [when, setWhen] = useState<'now' | 'depart' | 'arrive'>('now');
  const [dateTime, setDateTime] = useState('');
  const [remember, setRemember] = useState(Boolean(recent));
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationRevision, setLocationRevision] = useState(0);
  const locationRequest = useRef(0);
  useEffect(() => () => { locationRequest.current++; }, []);
  const changeFrom = (place: Place | null) => { locationRequest.current++; setLocating(false); setFrom(place); setError(''); };
  const useLocation = () => {
    if (!navigator.geolocation) { setError('Location isn’t supported in this browser. Search for a starting point instead.'); return; }
    const id = ++locationRequest.current;
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(position => {
      if (id !== locationRequest.current) return;
      setLocating(false);
      if (position.coords.accuracy > 500) { setError('Your location is too approximate. Search for your starting point instead.'); return; }
      setFrom({ id: 'current-location', name: 'Current location', label: 'Current location', latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationRevision(value => value + 1);
    }, () => { if (id === locationRequest.current) { setLocating(false); setError('We couldn’t access your location. Check permissions or search for a starting point.'); } }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 });
  };
  return <form className="planner-form" onSubmit={event => {
    event.preventDefault(); setError('');
    if (!from || !to) { setError('Select a starting point and destination from the suggestions.'); return; }
    if (distanceMeters(from, to) < 10) { setError('Choose a different starting point and destination.'); return; }
    if (when !== 'now' && (!dateTime || !Number.isFinite(Date.parse(dateTime)))) { setError('Choose a valid date and time.'); return; }
    onPlan({ from, to, ...(when !== 'now' ? { dateTime: new Date(dateTime).toISOString(), arriveBy: when === 'arrive' } : {}) }, remember);
  }}>
    <LocationField key={`from-${locationRevision}`} label="From" value={from} onChange={changeFrom} onEdit={() => { locationRequest.current++; setLocating(false); }}/><div className="between-fields"><button className="use-location" type="button" onClick={useLocation} disabled={locating}>{locating ? <LoaderCircle size={12} className="spin"/> : <LocateFixed size={12}/>}Use my location</button><button className="planner-swap" type="button" aria-label="Swap from and to" onClick={() => { locationRequest.current++; setLocating(false); setFrom(to); setTo(from); setError(''); }}><ArrowDownUp size={14}/></button></div>
    <LocationField label="To" value={to} onChange={place => { setTo(place); setError(''); }}/>
    <div className="planner-when"><label htmlFor="journey-when">When</label><select id="journey-when" value={when} onChange={event => setWhen(event.target.value as 'now' | 'depart' | 'arrive')}><option value="now">Leave now</option><option value="depart">Depart at…</option><option value="arrive">Arrive by…</option></select>{when !== 'now' && <><label className="date-label" htmlFor="journey-datetime">Date and time <span>(your local time)</span></label><input id="journey-datetime" type="datetime-local" value={dateTime} onChange={event => setDateTime(event.target.value)} required/></>}</div>
    <label className="remember-route"><input type="checkbox" checked={remember} onChange={event => { setRemember(event.target.checked); if (!event.target.checked) { try { localStorage.removeItem(RECENT_ROUTE_KEY); } catch { setError('Browser storage could not be cleared. Check site data settings.'); } } }}/><span>Remember these places on this device</span></label>
    {error && <p className="planner-field-error" role="alert">{error}</p>}
    <button className="plan-button" type="submit" disabled={!from || !to || loading}>{loading ? <><LoaderCircle size={17} className="spin"/>Finding journeys…</> : <>Find journeys<ArrowRight size={17}/></>}</button>
    <p className="planner-privacy">No account needed. Searches go to Entur. Places are saved only if you choose.</p>
  </form>;
}
