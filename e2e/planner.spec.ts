import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const temp = '/var/folders/l0/4_mj0ggd6tx8vkp5wbclby300000gn/T/opencode';
const saved = { from: { id: 'a', name: 'Oslo S', label: 'Oslo S, Oslo', latitude: 59.911, longitude: 10.752 }, to: { id: 'b', name: 'Nationaltheatret', label: 'Nationaltheatret, Oslo', latitude: 59.914, longitude: 10.733 } };
async function seed(page: Page) { await page.addInitScript(route => localStorage.setItem('ziel.recent-route.v1', JSON.stringify(route)), saved); }
function trip(mode = 'bus', geometry = false) {
  const start = Date.now() + 120000;
  const leg = (kind: string, offset: number, duration: number) => ({ mode: kind, duration, fromPlace: { name: kind === 'foot' ? 'Oslo S' : 'Boarding stop' }, toPlace: { name: 'Nationaltheatret' }, expectedStartTime: new Date(start + offset * 1000).toISOString(), expectedEndTime: new Date(start + (offset + duration) * 1000).toISOString(), line: kind === 'foot' ? null : { publicCode: '42', name: 'Nationaltheatret' }, ...(geometry ? { pointsOnLink: { points: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', length: 3 } } : {}) });
  return { data: { trip: { tripPatterns: [{ duration: 780, walkDistance: 200, legs: [leg('foot', 0, 120), leg(mode, 180, 480), leg('foot', 660, 120)] }, { duration: 840, walkDistance: 200, legs: [leg('foot', 600, 120), leg('metro', 780, 480), leg('foot', 1260, 120)] }] } } };
}

test('search-first welcome, example story and responsive layout', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Where are/ })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'From', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Find journeys', exact: true })).toBeDisabled();
  await page.screenshot({ path: `${temp}/ziel-planner-desktop.png` });
  await page.getByRole('button', { name: 'Explore an example journey' }).click();
  await expect(page.getByText('EXAMPLE JOURNEY', { exact: true })).toBeVisible();
  await page.getByRole('slider', { name: 'Journey progress' }).fill('100');
  await expect(page.getByTestId('journey-story')).toHaveAttribute('data-mode', 'wait');
  await expect(page.locator('canvas')).toHaveAttribute('data-waiting-pose', 'animated');
  await page.getByRole('slider', { name: 'Journey progress' }).fill('500');
  await expect(page.getByTestId('location-bubble')).toHaveAttribute('data-tracking', 'vehicle');
  await page.getByRole('button', { name: 'Go to arrival' }).click();
  await expect(page.getByRole('heading', { name: 'You’ve arrived.' })).toBeVisible();
  await expect(page.getByTestId('location-bubble')).toContainText('Frognerparken');
  await page.screenshot({ path: `${temp}/ziel-planner-result.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${temp}/ziel-planner-mobile.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('real Entur From/To search plans a journey and optionally remembers places', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'From', exact: true }).fill('Oslo S');
  await page.getByRole('listbox', { name: 'From suggestions' }).getByRole('option').first().click();
  await page.getByRole('combobox', { name: 'To', exact: true }).fill('Nationaltheatret');
  await page.getByRole('listbox', { name: 'To suggestions' }).getByRole('option').first().click();
  await page.getByLabel('Remember these places on this device').check();
  await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  await expect(page.getByTestId('journey-story')).toBeVisible({ timeout: 25000 });
  await expect(page.getByText('YOUR PLANNED JOURNEY', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Journey options' }).getByRole('button').first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ziel.recent-route.v1'))).not.toBeNull();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'From', exact: true })).not.toHaveValue('');
  await expect(page.getByTestId('journey-story')).not.toBeVisible();
  await page.getByLabel('Remember these places on this device').uncheck();
  expect(await page.evaluate(() => localStorage.getItem('ziel.recent-route.v1'))).toBeNull();
});

test('scheduled search, swap and manual current-location origin', async ({ page, context }) => {
  await seed(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 59.91, longitude: 10.75, accuracy: 20 });
  let query = '';
  await page.route('**/journey-planner/**', async route => { query = route.request().postData() ?? ''; await route.fulfill({ json: trip() }); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Swap from and to' }).click();
  await expect(page.getByRole('combobox', { name: 'From', exact: true })).toHaveValue('Nationaltheatret, Oslo');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('combobox', { name: 'From', exact: true })).toHaveValue('Current location');
  await page.getByLabel('When', { exact: true }).selectOption('arrive');
  await page.getByLabel(/Date and time/).fill('2026-12-01T12:00');
  await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  await expect(page.getByTestId('journey-story')).toBeVisible();
  expect(query).toContain('arriveBy:true'); expect(query).toContain('dateTime:'); expect(query).toContain('latitude:59.91');
});

test('selected departure updates journey and details preserve keyboard focus', async ({ page }) => {
  await seed(page); await page.route('**/journey-planner/**', route => route.fulfill({ json: trip() }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  const board = page.getByRole('region', { name: 'Upcoming departures' });
  await board.hover(); await board.getByRole('button', { name: /^Take / }).nth(1).focus(); await page.keyboard.press('Enter');
  await expect(board.getByRole('button', { name: /^Take / }).nth(1)).toBeFocused();
  await expect(board.getByRole('button', { name: /^Take / }).nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('leave-cue')).toBeVisible();
  await page.getByRole('button', { name: 'Journey details', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Journey details' }); await expect(dialog).toContainText('Nationaltheatret');
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Journey details', exact: true })).toBeFocused();
  await page.getByRole('slider', { name: 'Journey progress' }).fill('500'); await expect(page.getByTestId('journey-story')).toHaveAttribute('data-mode', 'metro');
});

test('API failure stays honest and retry recovers', async ({ page }) => {
  await seed(page); await page.route('**/journey-planner/**', route => route.fulfill({ status: 503 }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('We couldn’t reach Entur');
  await expect(page.getByTestId('journey-story')).not.toBeVisible();
  await page.unroute('**/journey-planner/**'); await page.route('**/journey-planner/**', route => route.fulfill({ json: trip() }));
  await page.getByRole('button', { name: 'Try again', exact: true }).click(); await expect(page.getByTestId('journey-story')).toBeVisible();
});

test('typing an origin cancels a delayed location result', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.geolocation, 'getCurrentPosition', { value: (success: PositionCallback) => {
      (window as unknown as { deliverLocation: () => void }).deliverLocation = () => success({ coords: { latitude: 59.91, longitude: 10.75, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) }, timestamp: Date.now(), toJSON: () => ({}) });
    } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Use my location' }).click();
  await page.getByRole('combobox', { name: 'From', exact: true }).fill('Bergen');
  await page.evaluate(() => (window as unknown as { deliverLocation: () => void }).deliverLocation());
  await expect(page.getByRole('combobox', { name: 'From', exact: true })).toHaveValue('Bergen');
});

test('overnight results identify both dates and keep submitted schedule separate from edits', async ({ page }) => {
  await seed(page);
  await page.route('**/journey-planner/**', route => route.fulfill({ json: { data: { trip: { tripPatterns: [{ duration: 22200, walkDistance: 0, legs: [{ mode: 'rail', duration: 22200, fromPlace: { name: 'Oslo S' }, toPlace: { name: 'Bergen' }, expectedStartTime: '2026-12-01T23:50:00+01:00', expectedEndTime: '2026-12-02T06:00:00+01:00', line: { publicCode: 'F4', name: 'Bergen' } }] }] } } } }));
  await page.goto('/');
  await page.getByLabel('When', { exact: true }).selectOption('depart');
  await page.getByLabel(/Date and time/).fill('2026-12-01T22:00');
  await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Journey options' })).toContainText('1 Dec → 2 Dec');
  const submitted = await page.locator('.planned-route').textContent();
  await page.getByLabel(/Date and time/).fill('2026-12-05T12:00');
  await expect(page.locator('.planned-route')).toHaveText(submitted!);
});

for (const mode of ['bus', 'metro', 'tram', 'rail', 'water']) test(`${mode} journey preserves arrival and geometry behavior`, async ({ page }) => {
  await seed(page); await page.route('**/journey-planner/**', route => route.fulfill({ json: trip(mode, true) }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Journey progress' }); await slider.fill('500');
  await expect(page.getByTestId('journey-story')).toHaveAttribute('data-mode', mode === 'rail' ? 'train' : mode === 'water' ? 'ferry' : mode);
  await expect(page.locator('canvas')).toHaveAttribute('data-route-geometry', 'entur');
  await slider.fill('1000'); await expect(page.locator('canvas')).toHaveAttribute('data-destination-entry', 'inside');
  await slider.fill('0'); await expect(page.locator('canvas')).toHaveAttribute('data-vehicle-visible', 'false');
});

test('metro descends by escalator, rides underground and returns to the surface', async ({ page }) => {
  await seed(page); await page.route('**/journey-planner/**', route => route.fulfill({ json: trip('metro') }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Journey progress' }); const canvas = page.locator('canvas');
  await slider.fill('120');
  await expect(canvas).toHaveAttribute('data-metro-phase', 'descending');
  await expect(page.getByRole('heading', { name: 'Down to the platform.' })).toBeVisible();
  await page.screenshot({ path: `${temp}/ziel-metro-escalator.png` });
  await slider.fill('500');
  await expect(canvas).toHaveAttribute('data-character-depth', '-3.200');
  await expect(canvas).toHaveAttribute('data-vehicle-depth', '-3.200');
  await page.screenshot({ path: `${temp}/ziel-metro-underground.png` });
  await slider.fill('820'); await expect(canvas).toHaveAttribute('data-metro-phase', 'ascending');
  await expect(page.getByRole('heading', { name: 'Back to street level.' })).toBeVisible();
  await slider.fill('880'); await expect(canvas).toHaveAttribute('data-metro-phase', 'surface');
  await slider.fill('500'); await expect(canvas).toHaveAttribute('data-character-depth', '-3.200');
});

test('cutaway camera stays above ground and train boards only after stopping', async ({ page }) => {
  await seed(page); await page.route('**/journey-planner/**', route => route.fulfill({ json: trip('metro') }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Journey progress' }); const canvas = page.locator('canvas');
  await slider.fill('120'); await expect(canvas).toHaveAttribute('data-metro-phase', 'descending');
  const cameraHeight = await canvas.getAttribute('data-camera-height');
  await slider.fill('200'); await expect(canvas).toHaveAttribute('data-metro-sequence', 'waiting');
  await expect(canvas).toHaveAttribute('data-vehicle-visible', 'false');
  await page.screenshot({ path: `${temp}/ziel-platform-wait.png` });
  await slider.fill('340'); await expect(canvas).toHaveAttribute('data-metro-sequence', 'arriving');
  await expect(canvas).toHaveAttribute('data-vehicle-door', '0.000');
  await slider.fill('440'); await expect(canvas).toHaveAttribute('data-metro-sequence', 'boarding');
  await expect(canvas).toHaveAttribute('data-vehicle-door', '1.000');
  const stoppedX = await canvas.getAttribute('data-vehicle-x');
  await page.screenshot({ path: `${temp}/ziel-platform-boarding.png` });
  await slider.fill('477'); await expect(canvas).toHaveAttribute('data-metro-sequence', 'closing');
  await expect(canvas).toHaveAttribute('data-vehicle-x', stoppedX!);
  await expect(canvas).toHaveAttribute('data-metro-travel', '0.000');
  await slider.fill('550'); await expect(canvas).toHaveAttribute('data-metro-sequence', 'riding');
  await expect(canvas).toHaveAttribute('data-vehicle-door', '0.000');
  expect(Number(await canvas.getAttribute('data-camera-height'))).toBeLessThan(Number(cameraHeight));
  expect(Number(await canvas.getAttribute('data-camera-height'))).toBeGreaterThan(0);
  await slider.fill('440'); await expect(canvas).toHaveAttribute('data-metro-sequence', 'boarding');
  await expect(canvas).toHaveAttribute('data-vehicle-x', stoppedX!);
});

test('underground viewing window follows the metro and closes on the surface', async ({ page }) => {
  await seed(page); await page.route('**/journey-planner/**', route => route.fulfill({ json: trip('metro') }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Journey progress' }); const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-underground-window', 'hidden');
  await slider.fill('200'); await expect(canvas).toHaveAttribute('data-underground-window', 'visible');
  await expect(canvas).toHaveAttribute('data-underground-camera-blend', '1.000');
  const platformCenter = Number(await canvas.getAttribute('data-window-center'));
  const cameraHeight = await canvas.getAttribute('data-camera-height');
  await slider.fill('550'); await expect(canvas).toHaveAttribute('data-metro-sequence', 'riding');
  await expect.poll(async () => Number(await canvas.getAttribute('data-window-center'))).toBeGreaterThan(platformCenter + 2);
  const rideCenter = await canvas.getAttribute('data-window-center');
  await page.screenshot({ path: `${temp}/ziel-metro-moving-window.png` });
  await slider.fill('650');
  await expect.poll(async () => Number(await canvas.getAttribute('data-window-center'))).toBeGreaterThan(Number(rideCenter));
  await expect(canvas).toHaveAttribute('data-camera-height', cameraHeight!);
  await slider.fill('550'); await expect(canvas).toHaveAttribute('data-window-center', rideCenter!);
  await slider.fill('847'); await expect(canvas).toHaveAttribute('data-metro-phase', 'surface');
  await expect(canvas).toHaveAttribute('data-underground-window', 'hidden');
  await slider.fill('880'); await expect(canvas).toHaveAttribute('data-underground-window', 'hidden');
  await expect(canvas).toHaveAttribute('data-underground-camera-blend', '0.000');
});

test('phone opens by click, selects departures and sun rewinds with scrolling', async ({ page }) => {
  await seed(page); await page.route('**/journey-planner/**', route => route.fulfill({ json: trip('metro') }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  await page.getByRole('button', { name: 'Open phone departures' }).click();
  await expect(page.getByRole('heading', { name: 'Next departures', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Take / }).first().click();
  await expect(page.getByTestId('leave-cue')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Next departures', exact: true })).not.toBeVisible();
  const sun = page.getByTestId('journey-sun');
  await page.getByRole('slider', { name: 'Journey progress' }).fill('0');
  await expect(page.getByTestId('journey-story')).toHaveAttribute('data-progress', '0.000');
  const initial = await sun.getAttribute('style');
  await page.getByRole('slider', { name: 'Journey progress' }).fill('500');
  await expect(sun).not.toHaveAttribute('style', initial!);
  await page.getByRole('slider', { name: 'Journey progress' }).fill('0');
  await expect(sun).toHaveAttribute('style', initial!);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(sun).toHaveCSS('transform', 'none');
});

test('evening itinerary darkens the scene and turns on moon and streetlights', async ({ page }) => {
  await seed(page);
  const response = trip('bus');
  const leg = response.data.trip.tripPatterns[0].legs[0];
  response.data.trip.tripPatterns = [{ duration: 14400, walkDistance: 100, legs: [{ ...leg, mode: 'foot', duration: 14400, expectedStartTime: '2026-10-17T17:00:00+02:00', expectedEndTime: '2026-10-17T21:00:00+02:00' }] }];
  await page.route('**/journey-planner/**', route => route.fulfill({ json: response }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  const story = page.getByTestId('journey-story'); const slider = page.getByRole('slider', { name: 'Journey progress' });
  await expect(story).toHaveAttribute('data-time-period', 'day');
  await expect(page.locator('canvas')).toHaveAttribute('data-streetlights', 'off');
  await slider.fill('500'); await expect(story).toHaveAttribute('data-time-period', 'dusk');
  await slider.fill('800'); await expect(story).toHaveAttribute('data-time-period', 'night');
  await expect(page.getByTestId('journey-sun')).toHaveAttribute('data-celestial', 'moon');
  const moon = page.getByTestId('journey-sun');
  const moonX = () => moon.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
  const atEight = await moonX();
  await slider.fill('900');
  await expect.poll(moonX).toBeLessThan(atEight);
  await slider.fill('700');
  await expect.poll(moonX).toBeGreaterThan(atEight);
  await slider.fill('800');
  await expect(page.locator('canvas')).toHaveAttribute('data-streetlights', 'on');
  await page.screenshot({ path: `${temp}/ziel-night-atmosphere.png` });
  await slider.fill('0'); await expect(story).toHaveAttribute('data-time-period', 'day');
});

test('demo showcase renders every vehicle without calling the journey API', async ({ page }) => {
  let requests = 0; page.on('request', request => { if (request.url().includes('journey-planner')) requests++; });
  await page.goto('/'); await page.getByRole('button', { name: 'Explore an example journey' }).click();
  const options = page.getByRole('region', { name: 'Demo transport options' });
  for (const [label, mode] of [['Bus','bus'],['Tram','tram'],['Metro','metro'],['Train','train'],['Ferry','ferry'],['Flight','plane'],['Bicycle','bike'],['Cable car','cable'],['Other transit','transit'],['Walking','walk']]) {
    await options.getByRole('button', { name: label, exact: true }).click();
    await expect(options.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed','true');
    await page.getByRole('slider', { name: 'Journey progress' }).fill('500');
    await expect(page.getByTestId('journey-story')).toHaveAttribute('data-mode', mode);
    await expect(page.getByText('EXAMPLE JOURNEY',{exact:true})).toBeVisible();
  }
  expect(requests).toBe(0);
});

test('default example tells one bus, tram and metro journey', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Explore an example journey' }).click();
  await expect(page.getByRole('button', { name: /Full example route/ })).toHaveAttribute('aria-pressed','true');
  const slider=page.getByRole('slider',{name:'Journey progress'});
  for (const [progress,mode] of [['180','bus'],['430','tram'],['720','metro']]) {
    await slider.fill(progress); await expect(page.getByTestId('journey-story')).toHaveAttribute('data-mode',mode);
  }
  await page.getByRole('button',{name:'Go to arrival'}).click();
  await expect(page.getByTestId('location-bubble')).toContainText('Frognerparken');
});

for (const surfaceMode of ['bus', 'tram']) test(`metro transfer keeps ${surfaceMode} on the surface road`, async ({ page }) => {
  await seed(page);
  const start = Date.now() + 60000;
  const modes = ['foot', 'metro', 'foot', surfaceMode, 'foot'];
  const legs = modes.map((mode, index) => ({ mode, duration: 300, fromPlace: { name: `Stop ${index}` }, toPlace: { name: `Stop ${index + 1}` }, expectedStartTime: new Date(start + index * 300000).toISOString(), expectedEndTime: new Date(start + (index + 1) * 300000).toISOString(), line: mode === 'foot' ? null : { publicCode: mode === 'metro' ? '2' : '12', name: 'Connection' } }));
  await page.route('**/journey-planner/**', route => route.fulfill({ json: { data: { trip: { tripPatterns: [{ duration: 1500, walkDistance: 500, legs }] } } } }));
  await page.goto('/'); await page.getByRole('button', { name: 'Find journeys', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Journey progress' }); const canvas = page.locator('canvas');
  await slider.fill('300'); await expect(canvas).toHaveAttribute('data-vehicle-lateral', '0.000');
  await slider.fill('700'); await expect(page.getByTestId('journey-story')).toHaveAttribute('data-mode', surfaceMode);
  await expect(canvas).toHaveAttribute('data-vehicle-lateral', '0.000');
  await expect(canvas).toHaveAttribute('data-vehicle-depth', '0.000');
  await expect(page.getByTestId('location-bubble')).toHaveAttribute('data-tracking', 'vehicle');
  await page.screenshot({ path: `${temp}/ziel-metro-${surfaceMode}-connection.png` });
  await slider.fill('300'); await expect(canvas).toHaveAttribute('data-vehicle-lateral', '0.000');
});
