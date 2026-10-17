import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, MapPin, X } from 'lucide-react';
import type { Place } from './commute';
import { searchPlaces } from './commute';

export default function LocationField({ label, value, onChange, onEdit }: { label: 'From' | 'To'; value: Place | null; onChange: (place: Place | null) => void; onEdit?: () => void }) {
  const [query, setQuery] = useState(value?.label ?? '');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const typing = useRef(false);
  useEffect(() => { if (!typing.current) setQuery(value?.label ?? ''); typing.current = false; }, [value]);
  useEffect(() => {
    if (value || query.trim().length < 3) { setResults([]); setLoading(false); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true); setError('');
      searchPlaces(query.trim(), controller.signal).then(places => { setResults(places); setActive(-1); if (!places.length) setError('No places found. Try adding a town or postcode.'); }).catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Place search failed. Please try again.');
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query, value]);
  const choose = (place: Place) => { onChange(place); setQuery(place.label); setResults([]); setOpen(false); setError(''); input.current?.focus(); };
  return <div className="location-field"><label htmlFor={`planner-${label}`}>{label}</label><div className={`planner-location-input ${value ? 'is-confirmed' : ''}`}><span className={label === 'From' ? 'from-symbol' : 'to-symbol'}>{label === 'To' && <MapPin size={14}/>}</span><input ref={input} id={`planner-${label}`} value={query} role="combobox" aria-autocomplete="list" aria-expanded={open && results.length > 0} aria-controls={`suggestions-${label}`} aria-activedescendant={active >= 0 && open ? `suggestion-${label}-${active}` : undefined} autoComplete="off" placeholder={label === 'From' ? 'Address, stop or place' : 'Where would you like to go?'} onFocus={() => setOpen(true)} onBlur={event => { if (!event.currentTarget.parentElement?.parentElement?.contains(event.relatedTarget)) setOpen(false); }} onChange={event => { const next = event.target.value; onEdit?.(); if (value) { typing.current = true; onChange(null); } setQuery(next); setOpen(true); setError(''); }} onKeyDown={event => {
    if (event.key === 'Escape') { setOpen(false); return; }
    if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setOpen(true); setActive(index => (index + 1) % results.length); }
    if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActive(index => (index - 1 + results.length) % results.length); }
    if (event.key === 'Enter' && open && active >= 0 && results[active]) { event.preventDefault(); choose(results[active]); }
  }}/>{loading ? <LoaderCircle size={15} className="spin"/> : value ? <Check size={14}/> : null}{query && <button type="button" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { onChange(null); setQuery(''); setError(''); input.current?.focus(); }}><X size={13}/></button>}</div>
    {open && results.length > 0 && !value && <ul id={`suggestions-${label}`} role="listbox" aria-label={`${label} suggestions`} className="location-suggestions">{results.map((place, index) => <li id={`suggestion-${label}-${index}`} key={place.id} role="option" aria-selected={active === index} onMouseDown={e => e.preventDefault()} onClick={() => choose(place)}><MapPin size={14}/><span><strong>{place.name}</strong><small>{place.label}</small></span></li>)}</ul>}
    {error && <p className="planner-field-error" role="status">{error}</p>}
  </div>;
}
