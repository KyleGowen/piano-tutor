import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('piano:theme', '"light"'));
  await page.goto('/');
});
async function hintedNotes(page: Page) {
  await page.getByRole('button', { name: 'A little hint' }).click();
  const label = await page.getByRole('img').getAttribute('aria-label');
  return label!
    .split(': ')[1]
    .split(', ')
    .map((note) => note.replace(/\d+$/, '').replaceAll('#', '♯').replaceAll('b', '♭'));
}
test('staff answers, wrong choices, hints, and automatic next question', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Find your note.' })).toBeVisible();
  await expect(page.locator('.staff svg')).toBeVisible();
  await page.getByRole('button', { name: 'Answer B', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Not quite');
  const [note] = await hintedNotes(page);
  await page.getByRole('button', { name: `Answer ${note}`, exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nicely done');
  await expect(page.getByRole('button', { name: 'Answer C', exact: true })).toBeEnabled();
  await expect(page.locator('.session-stats')).toContainText('1');
  await page.getByRole('tab', { name: 'Bass', exact: true }).click();
  await expect(page.getByRole('img')).toHaveAttribute('aria-label', /bass/);
});
test('triads require all three notes and can be skipped safely', async ({ page }) => {
  await page.getByLabel('Difficulty', { exact: true }).selectOption('5');
  const notes = await hintedNotes(page);
  await page.getByRole('button', { name: `Answer ${notes[0]}`, exact: true }).click();
  await expect(page.getByRole('status')).toContainText('remaining');
  for (const note of notes.slice(1))
    await page.getByRole('button', { name: `Answer ${note}`, exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nicely done');
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.getByRole('status')).not.toContainText('Nicely done');
  await page.getByRole('tab', { name: 'My piano', exact: true }).click();
  await expect(page.getByText('Play each chord tone separately', { exact: false })).toBeVisible();
});
test('circle reference has correct enharmonics and both quiz modes work', async ({ page }) => {
  await page.getByRole('link', { name: /Circle/ }).click();
  await page.getByRole('button', { name: 'D major', exact: true }).click();
  await expect(page.locator('.key-signature')).toContainText('2 sharps');
  await expect(page.locator('.chord-description')).toContainText('D · F♯ · A');
  await page.getByRole('tab', { name: 'Minor', exact: true }).click();
  await expect(page.locator('.key-title')).toHaveText('B minor');
  await expect(page.locator('.chord-description')).toContainText('B · D · F♯');
  await page.getByRole('button', { name: 'F♯ major', exact: true }).click();
  await page.getByRole('button', { name: 'Use G♭ spelling' }).click();
  await expect(page.locator('.key-signature')).toContainText('6 flats');
  await page.getByRole('tab', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'No sharps or flats', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nicely done');
  await page.getByLabel('Quiz exercise').selectOption('chord');
  await page.getByRole('button', { name: 'C major', exact: true }).click();
  for (const n of ['C', 'E', 'G'])
    await page.getByRole('button', { name: `Chord note ${n}`, exact: true }).click();
  await expect(page.getByRole('status')).toContainText('That’s the chord');
});
test('metronome tempo, tap-to-set, start/stop and navigation cleanup', async ({ page }) => {
  await page.getByRole('link', { name: /Metronome|Tempo/ }).click();
  const bpm = page.getByRole('spinbutton', { name: 'Beats per minute' });
  await bpm.fill('120');
  await bpm.fill('');
  await bpm.pressSequentially('120');
  await expect(bpm).toHaveValue('120');
  await page.getByRole('button', { name: 'Increase tempo' }).click();
  await expect(bpm).toHaveValue('121');
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await bpm.fill('240');
  await expect(bpm).toHaveValue('240');
  await expect(page.locator('.beat-lights .lit')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.beat-lights .lit')).toHaveCount(0);
  for (let n = 0; n < 4; n++) {
    await page.getByRole('button', { name: /^Tap tempo/ }).click();
    if (n < 3) await page.waitForTimeout(500);
  }
  await page.getByRole('button', { name: 'Use tempo' }).click();
  await expect.poll(async () => Number(await bpm.inputValue())).toBeGreaterThan(95);
  await expect.poll(async () => Number(await bpm.inputValue())).toBeLessThan(125);
  await page.getByRole('button', { name: 'Start metronome' }).click();
  await page.getByRole('link', { name: /Staff/ }).click();
  await expect(page.getByRole('heading', { name: 'Find your note.' })).toBeVisible();
});
test('microphone failure is actionable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException('Denied', 'NotAllowedError');
        },
      },
    });
  });
  await page.reload();
  await page.getByRole('tab', { name: 'My piano', exact: true }).click();
  await page.getByRole('button', { name: 'Enable microphone' }).click();
  await expect(page.getByRole('alert')).toContainText('permission was declined');
});
test('responsive light/dark layouts and local-only runtime assets', async ({ page }, testInfo) => {
  const external: string[] = [],
    errors: string[] = [];
  page.on('request', (req) => {
    if (!req.url().startsWith('http://localhost:5173') && !req.url().startsWith('data:'))
      external.push(req.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  for (const view of ['Staff', 'Circle', 'Metronome|Tempo']) {
    await page.getByRole('link', { name: new RegExp(view) }).click();
    await expect(page.locator('h1')).toHaveText(
      view === 'Staff'
        ? 'Find your note.'
        : view === 'Circle'
          ? 'Every key has a home.'
          : 'Make time for music.',
    );
    await page.screenshot({
      path: testInfo.outputPath(`${view.replace('|', '-')}-light.png`),
      fullPage: true,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      view,
    ).toBe(true);
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.screenshot({
      path: testInfo.outputPath(`${view.replace('|', '-')}-dark.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
