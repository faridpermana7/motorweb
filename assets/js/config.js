export let API_BASE_URL;

export const configReady = fetch(new URL('./config.json', import.meta.url))
  .then(response => {
    if (!response.ok) {
      throw new Error('Could not load config.json');
    }
    return response.json();
  })
  .then(config => {
    API_BASE_URL = config.apiBaseUrl;
    window.AUTH_LOGOUT_ENDPOINT = AUTH_LOGOUT_ENDPOINT; 
  })
  .catch(error => {
    console.warn('Unable to load config.json; using defaults.', error);
  });
