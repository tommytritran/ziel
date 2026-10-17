import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJourneys } from './commute';
import type { Journey } from './commute';
import { RECENT_ROUTE_KEY } from './planner';
import type { RouteRequest } from './planner';

export default function useJourneyPlanner(exploring: boolean) {
  const [request, setRequest] = useState<RouteRequest | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selected, setSelected] = useState(0);
  const [chosen, setChosen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const busy = useRef({ exploring, chosen });
  useEffect(() => { busy.current = { exploring, chosen }; }, [exploring, chosen]);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    setLoading(true); setJourneys([]); setSelected(0); setChosen(false); setError('');
    fetchJourneys(request, controller.signal).then(results => {
      if (!controller.signal.aborted) setJourneys(results);
    }).catch((e: unknown) => {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load journeys. Please try again.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [request, refreshKey]);
  useEffect(() => {
    if (!request || request.dateTime) return;
    const id = window.setInterval(() => { if (!document.hidden && !busy.current.exploring && !busy.current.chosen) setRefreshKey(k => k + 1); }, 60000);
    return () => clearInterval(id);
  }, [request]);
  const plan = useCallback((next: RouteRequest, remember: boolean) => {
    setNotice('');
    try {
      if (remember) localStorage.setItem(RECENT_ROUTE_KEY, JSON.stringify({ from: next.from, to: next.to }));
      else localStorage.removeItem(RECENT_ROUTE_KEY);
      // Remove the old commute-specific saved addresses when adopting the planner.
      localStorage.removeItem('ziel.places.v1');
    } catch { setNotice('Browser storage is unavailable. You can still plan this journey for this visit.'); }
    setRequest({ ...next });
  }, []);
  const selectJourney = (index: number) => { if (index >= 0 && index < journeys.length) { setSelected(index); setChosen(true); busy.current.chosen = true; } };
  const refresh = () => { setChosen(false); busy.current.chosen = false; setRefreshKey(key => key + 1); };
  return { request, journeys, journey: journeys[selected], selected, chosen, loading, error, notice, setNotice, plan, selectJourney, refresh };
}
