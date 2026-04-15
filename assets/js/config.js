const defaultConfig = {
  apiBaseUrl: window.location.origin,
  authLogoutEndpoint: '/auth/logout'
};

export let API_BASE_URL = defaultConfig.apiBaseUrl;
export let AUTH_LOGOUT_ENDPOINT = defaultConfig.authLogoutEndpoint;

export const configReady = fetch(new URL('./config.json', import.meta.url))
  .then(response => {
    if (!response.ok) {
      throw new Error('Could not load config.json');
    }
    return response.json();
  })
  .then(config => {
    API_BASE_URL = config.apiBaseUrl || API_BASE_URL;
    AUTH_LOGOUT_ENDPOINT = config.authLogoutEndpoint || AUTH_LOGOUT_ENDPOINT;

    if (!window.API_BASE_URL) {
      window.API_BASE_URL = API_BASE_URL;
    }
    if (!window.AUTH_LOGOUT_ENDPOINT) {
      window.AUTH_LOGOUT_ENDPOINT = AUTH_LOGOUT_ENDPOINT;
    }
  })
  .catch(error => {
    console.warn('Unable to load config.json; using defaults.', error);
    if (!window.API_BASE_URL) {
      window.API_BASE_URL = API_BASE_URL;
    }
    if (!window.AUTH_LOGOUT_ENDPOINT) {
      window.AUTH_LOGOUT_ENDPOINT = AUTH_LOGOUT_ENDPOINT;
    }
  });
