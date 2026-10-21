export function readSetting<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`piano:${key}`);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
export function saveSetting(key: string, value: unknown) {
  try {
    localStorage.setItem(`piano:${key}`, JSON.stringify(value));
  } catch {
    /* Private browsing may disable storage; practice still works. */
  }
}
