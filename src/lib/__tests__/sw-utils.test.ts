import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerSW } from '../sw-utils';

function makeFakeServiceWorkerContainer(registration: { update: ReturnType<typeof vi.fn> }) {
  const listeners: Record<string, ((event: Event) => void)[]> = {};
  return {
    register: vi.fn().mockResolvedValue(registration),
    addEventListener: (type: string, listener: (event: Event) => void) => {
      listeners[type] = listeners[type] ?? [];
      listeners[type].push(listener);
    },
    dispatch: (type: string) => {
      (listeners[type] ?? []).forEach((listener) => listener(new Event(type)));
    },
  };
}

describe('registerSW', () => {
  let reloadMock: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.useFakeTimers();
    reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: reloadMock },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true,
    });
    vi.unstubAllGlobals();
  });

  it('returns null when serviceWorker is not supported', async () => {
    vi.stubGlobal('navigator', {});
    const result = await registerSW('/friction-journal/');
    expect(result).toBeNull();
  });

  it('registers the worker script at the given base scope', async () => {
    const registration = { update: vi.fn().mockResolvedValue(undefined) };
    const sw = makeFakeServiceWorkerContainer(registration);
    vi.stubGlobal('navigator', { serviceWorker: sw });

    const result = await registerSW('/friction-journal/');

    expect(sw.register).toHaveBeenCalledWith('/friction-journal/sw.js', {
      scope: '/friction-journal/',
    });
    expect(result).toBe(registration);
  });

  it('reloads the page exactly once when the controller changes', async () => {
    const registration = { update: vi.fn().mockResolvedValue(undefined) };
    const sw = makeFakeServiceWorkerContainer(registration);
    vi.stubGlobal('navigator', { serviceWorker: sw });

    await registerSW('/friction-journal/');

    sw.dispatch('controllerchange');
    sw.dispatch('controllerchange');

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('checks for updates on an interval', async () => {
    const registration = { update: vi.fn().mockResolvedValue(undefined) };
    const sw = makeFakeServiceWorkerContainer(registration);
    vi.stubGlobal('navigator', { serviceWorker: sw });

    await registerSW('/friction-journal/');
    expect(registration.update).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(registration.update).toHaveBeenCalledTimes(1);
  });

  it('checks for updates when the page becomes visible', async () => {
    const registration = { update: vi.fn().mockResolvedValue(undefined) };
    const sw = makeFakeServiceWorkerContainer(registration);
    vi.stubGlobal('navigator', { serviceWorker: sw });

    await registerSW('/friction-journal/');

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(registration.update).toHaveBeenCalledTimes(1);
  });
});
