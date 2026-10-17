import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJourneys, makePreview } from './commute';
import { exampleRoute, loadRecentRoute, RECENT_ROUTE_KEY } from './planner';
afterEach(() => vi.unstubAllGlobals());
describe('general journey planning', () => {
  it('builds a From/To query with an arrive-by ISO time and route geometry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { trip: { tripPatterns: makePreview() } } }) });
    vi.stubGlobal('fetch', fetchMock);
    const time = '2026-12-01T11:00:00.000Z';
    await fetchJourneys({ ...exampleRoute, dateTime: time, arriveBy: true }, new AbortController().signal);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { query: string };
    expect(body.query).toContain(`latitude:${exampleRoute.from.latitude}`);
    expect(body.query).toContain(`longitude:${exampleRoute.to.longitude}`);
    expect(body.query).toContain(`dateTime:"${time}"`);
    expect(body.query).toContain('arriveBy:true');
    expect(body.query).toContain('pointsOnLink{points length}');
  });
  it('omits date constraints for leave-now searches and rejects GraphQL errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ errors: [{ message: 'Unavailable' }] }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchJourneys(exampleRoute, new AbortController().signal)).rejects.toThrow('Entur couldn’t plan');
    expect(fetchMock.mock.calls[0][1].body).not.toContain('dateTime');
  });
  it('loads only validated recent From/To places, never a stale date or automatic commute', () => {
    const storage = { getItem: vi.fn().mockReturnValue(JSON.stringify({ ...exampleRoute, dateTime: '2001-01-01' })) };
    vi.stubGlobal('localStorage', storage);
    expect(loadRecentRoute()).toEqual(exampleRoute);
    expect(storage.getItem).toHaveBeenCalledWith(RECENT_ROUTE_KEY);
    storage.getItem.mockReturnValue(JSON.stringify({ home: exampleRoute.from, work: exampleRoute.to }));
    expect(loadRecentRoute()).toBeNull();
    storage.getItem.mockReturnValue('{broken');
    expect(loadRecentRoute()).toBeNull();
  });
});
