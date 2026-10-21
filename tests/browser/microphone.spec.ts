import { expect, test } from '@playwright/test';

test('synthetic piano input recognizes a note once and releases the stream on navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.01; // Start the landmark exercise on middle C.
    localStorage.setItem('piano:level', '1');
    const fixtures = window as unknown as {
      testStream: MediaStream;
      testOscillator: OscillatorNode;
      testContext: AudioContext;
    };
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        fixtures.testContext = this;
      }
    };
    const getUserMedia = async () => {
      // Reuse the app's gesture-unlocked context; a second one requires a new
      // gesture in WebKit and does not represent a real microphone stream.
      const context = fixtures.testContext;
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        destination = context.createMediaStreamDestination();
      oscillator.frequency.value = 523.251; // C5 is wrong for the initial C4 card.
      gain.gain.value = 0.2;
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start();
      fixtures.testStream = destination.stream;
      fixtures.testOscillator = oscillator;
      fixtures.testContext = context;
      return destination.stream;
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'My piano', exact: true }).click();
  await page.getByRole('button', { name: 'Enable microphone' }).click();
  await expect(page.getByRole('status'))
    .toContainText('Check the note and its octave')
    .catch(async (error) => {
      console.log(
        await page.evaluate(() => ({
          audioState: (window as unknown as { testContext?: AudioContext }).testContext?.state,
          microphone: document.querySelector('.mic-panel')?.textContent,
          visibility: document.visibilityState,
        })),
      );
      throw error;
    });
  await page.evaluate(() => {
    (window as unknown as { testOscillator: OscillatorNode }).testOscillator.frequency.value =
      261.6256;
  });
  await expect(page.getByRole('status')).toContainText('C4. Nicely done');
  await page.waitForTimeout(1800);
  await expect(page.locator('.session-stats > div').first()).toContainText('1');
  await page.getByRole('link', { name: /Circle/ }).click();
  await expect(page.getByRole('heading', { name: 'Every key has a home.' })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { testStream: MediaStream }).testStream
          .getTracks()
          .every((t) => t.readyState === 'ended'),
      ),
    )
    .toBe(true);
  await page.evaluate(() => {
    void (window as unknown as { testContext: AudioContext }).testContext.close();
  });
});

test('pending microphone permission is safely canceled when leaving the page', async ({ page }) => {
  await page.addInitScript(() => {
    const fixtures = window as unknown as {
      resolveStream: (stream: MediaStream) => void;
      testStream: MediaStream;
      testContext: AudioContext;
    };
    const getUserMedia = () =>
      new Promise<MediaStream>((resolve) => {
        fixtures.resolveStream = resolve;
      });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'My piano', exact: true }).click();
  await page.getByRole('button', { name: 'Enable microphone' }).click();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => typeof (window as unknown as { resolveStream?: unknown }).resolveStream),
    )
    .toBe('function');
  await page.getByRole('link', { name: /Circle/ }).click();
  await page.evaluate(() => {
    const fixtures = window as unknown as {
      resolveStream: (stream: MediaStream) => void;
      testStream: MediaStream;
      testContext: AudioContext;
    };
    fixtures.testContext = new AudioContext();
    fixtures.testStream = fixtures.testContext.createMediaStreamDestination().stream;
    fixtures.resolveStream(fixtures.testStream);
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { testStream: MediaStream }).testStream
          .getTracks()
          .every((t) => t.readyState === 'ended'),
      ),
    )
    .toBe(true);
  await page.evaluate(() => {
    void (window as unknown as { testContext: AudioContext }).testContext.close();
  });
});
