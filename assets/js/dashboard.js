// dashboard.js
import { loadNavMenu } from './utils/nav.js';
import { configReady } from './config.js';

(async function() {
    async function initDashboard() {
        await configReady;
        console.log('Dashboard JS loaded');
        loadNavMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
