// profile.js
import { loadNavMenu } from './utils/nav.js';
// Waits for bootstrap.js to load all dependencies, then initializes profile

(function() {
    function initProfile() {
        console.log('Profile JS loaded');
        loadNavMenu();
    }

    // Wait for bootstrap.js to finish loading all dependencies
    if (window.appReady !== undefined) {
        // bootstrap.js already fired appReady event
        initProfile();
    } else {
        // Wait for appReady event from bootstrap.js
        window.addEventListener('appReady', initProfile, { once: true });
    }
})();
