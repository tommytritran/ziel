# Ziel — Plan your next journey

A general-purpose Norwegian public transport journey planner with a colorful scroll-controlled Three.js visualization. React, TypeScript, Vite, React Three Fiber and Entur’s open APIs.

## Run and verify

```sh
npm install
npm run dev
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Deploy `dist/` to an HTTPS static host. HTTPS is required for optional geolocation outside localhost.

## Planning a journey

- Search **From** and **To** by address, stop or place. Confirm a suggestion for each; keyboard arrow keys and Enter work in autocomplete. Swap the two places with the swap button.
- **Use my location** fills the starting point after permission. It requests one location fix, not continuous tracking or automatic direction changes.
- Choose **Leave now**, **Depart at**, or **Arrive by**. The date/time input uses the browser’s local timezone and is converted to ISO time for Entur. Journey results are displayed in Norway’s timezone.
- Click **Find journeys** to search. Editing the form does not silently change the currently displayed route. The route header identifies the submitted search.
- Select a journey card or a departure on the character’s monitor to choose which itinerary to visualize. A choice pins the result until a new search or refresh. “Leave now” results refresh every minute unless pinned or being explored. Scheduled searches retain their requested time.
- The welcome screen is search-first. **Explore an example journey** opens a clearly labelled transport showcase with tram, bus, metro, train, ferry, flight, bicycle, cable car, walking and generic-transit examples. Each mode has illustrative journey alternatives; these are animation demos, not real routes or live departures, and switching modes does not call Entur.
- Optional **Remember these places on this device** saves just the last From/To pair in `localStorage` under `ziel.recent-route.v1`, not the requested date/time. It pre-fills the form but never starts a search automatically. Unchecking removes the saved pair. Legacy home/work data is not used and is removed when submitting a new search.

## Visualization

Scroll, use the timeline/scrubber, or the chapter controls to explore walking, waiting, vehicle arrival, boarding, riding and destination entry. Scrolling backwards rewinds. Vehicles match the transport mode. The character checks their watch during waits; the location bubble follows the character or vehicle. The origin monitor enlarges on hover/focus and has selectable departures.

The cartoon world is illustrative; buildings do not claim to match the actual places. Entur polyline geometry influences broad, smooth bends rather than literal street geometry. Missing/malformed geometry falls back safely. Time follows itinerary durations, including waits; this is not live vehicle tracking or navigation. A 2D schematic fallback is available when WebGL fails. Reduced motion disables decorative idle animation.

Metro uses a deliberately stylized underground treatment with a fixed above-ground camera: the surface street remains visible, and a localized oval viewing window reveals the station and tunnel beneath. The window follows the character during descent/platform access, then follows the train during travel, and closes after returning to the surface. Tunnel scenery is clipped to the local window rather than exposing the whole route as a trench. Sheltered station entrances connect to escalators. A two-car rail vehicle arrives, stops, opens sliding doors, lets the character board, closes doors and only then moves. This is an artistic convention for metro legs, not a statement about actual station depth or infrastructure from Entur.

Choosing a route shows a live countdown to its first leg (including walking), a “get ready” cue in the final minute and animated shoes at leave time. Past leave times prompt a refresh. This is an on-page reminder, not a background alarm, booking, or ticket.

## Data and privacy

- Geocoder: `https://api.entur.io/geocoder/v3/autocomplete`
- Journey Planner: `https://api.entur.io/journey-planner/v3/graphql`
- Public client header: `ET-Client-Name: ziel-commute`; replace `CLIENT` in `src/commute.ts` with your deployment’s organisation/application identifier.
- Search text and requested route coordinates are sent directly to Entur. No analytics or application backend. Google Fonts supplies typography.
- Data attribution: Entur, NLOD. https://developer.entur.no/

## Tests

Vitest covers input/GeoJSON validation, journey stage timing, departures and leave-time states, route decoding/stylization, animation boundary continuity and reversal. Playwright covers real Entur From/To planning, optional persistence, scheduled queries, one-shot location, swap, error/retry, keyboard focus, responsive layout, selectable departures and transport/geometry/arrival visualization.
