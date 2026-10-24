(function () {
  const endpoint = '/__dev-logs';
  const nativeConsole = {};
  const pending = [];
  let sending = false;
  let warnedAboutDelivery = false;

  function serialize(value) {
    if (value instanceof Error) return value.stack || `${value.name}: ${value.message}`;
    if (typeof value === 'string') return value;

    try {
      const seen = new WeakSet();
      const json = JSON.stringify(value, (key, item) => {
        if (/password|passwd|token|secret|authorization|cookie/i.test(key)) return '[REDACTED]';
        if (item && typeof item === 'object') {
          if (seen.has(item)) return '[Circular]';
          seen.add(item);
        }
        return item;
      });
      return json === undefined ? String(value) : json;
    } catch {
      return String(value);
    }
  }

  function enqueue(level, args) {
    const message = args.map(serialize).join(' ').slice(0, 2048);
    pending.push({
      level,
      message,
      page: window.location.pathname,
    });

    if (pending.length > 500) pending.shift();
  }

  function flush(useBeacon) {
    if (!pending.length || sending) return;

    const batch = pending.splice(0, 6);
    const body = JSON.stringify({ logs: batch });

    if (useBeacon && navigator.sendBeacon) {
      const accepted = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      if (accepted) return;
    }

    sending = true;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).then((response) => {
      if (!response.ok) throw new Error(`Log endpoint returned HTTP ${response.status}`);
      warnedAboutDelivery = false;
    }).catch((error) => {
      pending.unshift(...batch);
      if (pending.length > 500) pending.length = 500;
      if (!warnedAboutDelivery) {
        warnedAboutDelivery = true;
        nativeConsole.warn('Unable to send browser logs to the development server:', error);
      }
    }).finally(() => {
      sending = false;
    });
  }

  const methods = {
    debug: 'INFO',
    info: 'INFO',
    log: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
  };

  Object.keys(methods).forEach((method) => {
    if (typeof window.console[method] !== 'function') return;

    nativeConsole[method] = window.console[method].bind(window.console);
    window.console[method] = function (...args) {
      nativeConsole[method](...args);
      enqueue(methods[method], args);
    };
  });
  nativeConsole.warn = nativeConsole.warn || window.console.warn.bind(window.console);

  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const resource = event.target.src || event.target.href || event.target.tagName;
      enqueue('ERROR', [`Resource failed to load: ${resource}`]);
      return;
    }

    enqueue('ERROR', [
      `${event.message} (${event.filename}:${event.lineno}:${event.colno})`,
      event.error,
    ]);
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    enqueue('ERROR', ['Unhandled promise rejection:', event.reason]);
  });

  window.setInterval(() => flush(false), 1000);
  window.addEventListener('pagehide', () => flush(true));
})();
