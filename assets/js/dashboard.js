// dashboard.js
import { loadNavMenu } from './utils/nav.js';

(function() {
    function initDashboard() {
        console.log('Dashboard JS loaded');
        loadNavMenu();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
