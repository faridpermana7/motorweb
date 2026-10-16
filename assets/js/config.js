// config.js
export let API_BASE_URL = '';

import { apiFetch } from './utils/api.js';

const getConfigUrl = () => {
  // Prefer an HTTP(S) path when the page is served via a web server
  try {
    if (typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:')) {
      // Expect config.json to be available at /assets/js/config.json on the server
      return `${location.origin}/assets/js/config.json`;
    }
  } catch (e) {
    // ignore and fall back
  }

  // Fallback to module-relative URL (works with bundlers that support import.meta.url)
  try {
    return new URL('./config.json', import.meta.url).href;
  } catch (e) {
    // Last resort: relative path
    return './config.json';
  }
};

export const configReady = (async () => {
  const configUrl = getConfigUrl();

  let config = {};
  try {
    const resp = await fetch(configUrl);
    if (!resp.ok) throw new Error(`Could not load config.json (${resp.status})`);
    config = await resp.json();
    API_BASE_URL = config.apiBaseUrl || API_BASE_URL || '';
  } catch (err) {
    console.warn('Unable to load config.json; using defaults.', err);
    // keep API_BASE_URL as-is (could be set elsewhere) or set a safe default
    API_BASE_URL = API_BASE_URL || '';
  }

  // If configurations are cached, use them and skip API call
  try {
    const cached = localStorage.getItem('configurations');
    if (cached) {
      const conf = JSON.parse(cached);
      console.log('Configurations loaded from localStorage:', conf);
      // still expose logout endpoint if present in config
      if (config.authLogoutEndpoint) window.AUTH_LOGOUT_ENDPOINT = config.authLogoutEndpoint;
      // Do not hit the auth-protected endpoint before a user has signed in.
      if (!localStorage.getItem('access_token')) {
        console.info('Skipping configurations API call because the user has not signed in yet.');
        return { config, configs: conf };
      }
      return { config, configs: conf };
    }
  } catch (e) {
    console.warn('Error reading configurations from localStorage', e);
  }

  // Do not fetch auth-protected configuration values before login.
  if (!localStorage.getItem('access_token')) {
    console.info('User is not authenticated; skipping configurations API call.');
    if (config.authLogoutEndpoint) window.AUTH_LOGOUT_ENDPOINT = config.authLogoutEndpoint;
    return { config, configs: {} };
  }

  // If we don't have an API base URL, skip the API call gracefully
  if (!API_BASE_URL) {
    console.warn('API_BASE_URL is not set; skipping configurations API call.');
    if (config.authLogoutEndpoint) window.AUTH_LOGOUT_ENDPOINT = config.authLogoutEndpoint;
    return { config, configs: {} };
  }

  // Try to fetch configurations from API; fail gracefully
  try {
    const data = await apiFetch(`${API_BASE_URL}/configurations`, { method: 'GET' });
    if (Array.isArray(data)) {
      const configs = data.reduce((acc, row) => {
        const key = `${row.module}_${row.attribute}`;
        acc[key] = row.value;
        return acc;
      }, {});
      localStorage.setItem('configurations', JSON.stringify(configs));
      console.log('Configurations loaded from API:', configs);
      if (config.authLogoutEndpoint) window.AUTH_LOGOUT_ENDPOINT = config.authLogoutEndpoint;
      return { config, configs };
    } else {
      console.warn('Unexpected configurations response format', data);
      return { config, configs: {} };
    }
  } catch (err) {
    console.warn('Unable to load configurations from API; using defaults.', err);
    if (config.authLogoutEndpoint) window.AUTH_LOGOUT_ENDPOINT = config.authLogoutEndpoint;
    return { config, configs: {} };
  }
})();
