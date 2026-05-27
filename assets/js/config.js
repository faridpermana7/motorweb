export let API_BASE_URL;
import { apiFetch } from './utils/api.js';

// export const configReady = fetch(new URL('./config.json', import.meta.url))
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Could not load config.json');
//     }
//     return response.json();
//   })
//   .then(config => {
//     API_BASE_URL = config.apiBaseUrl;
//     window.AUTH_LOGOUT_ENDPOINT = AUTH_LOGOUT_ENDPOINT; 
//   })
//   .catch(error => {
//     console.warn('Unable to load config.json; using defaults.', error);
//   }); 

export const configReady = fetch(new URL('./config.json', import.meta.url))
  .then(response => {
    if (!response.ok) {
      throw new Error('Could not load config.json');
    }
    return response.json();
  })
  .then(async config => {
    // Set base URL from config.json
    API_BASE_URL = config.apiBaseUrl;

    
    const cached = localStorage.getItem("configurations");
    if (cached) {
      configurations = JSON.parse(cached);
      console.log("Configurations loaded from localStorage:", configurations);
      return;
    }

    // Call API to get configurations
    const data = await apiFetch(`${API_BASE_URL}/configurations`, { method: "GET" });
    console.log("Configurations loaded from API:", data); 
    
    const configs = data.reduce((acc, row) => {
      // Use module + attribute as the key to avoid collisions across modules
      const key = `${row.module}_${row.attribute}`;
      acc[key] = row.value;
      return acc;
    }, {});
    // Save into localStorage
    localStorage.setItem("configurations", JSON.stringify(configs));

    // Example: expose logout endpoint if needed
    window.AUTH_LOGOUT_ENDPOINT = config.authLogoutEndpoint;

    return { config, configs }; // return both for consumers
  })
  .catch(error => {
    console.warn('Unable to load config.json or configurations; using defaults.', error);
  });
