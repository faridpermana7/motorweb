// dashboard.js

(function() {
    function initDashboard() {
        console.log('Dashboard JS loaded');

        if (typeof loadNavMenu === 'function') {
            loadNavMenu();
            return;
        }

        const navScriptSrc = '../assets/js/utils/nav.js';
        let navScript = document.querySelector(`script[src="${navScriptSrc}"]`);

        if (!navScript) {
            navScript = document.createElement('script');
            navScript.src = navScriptSrc;
            document.head.appendChild(navScript);
        }

        navScript.addEventListener('load', function() {
            if (typeof loadNavMenu === 'function') {
                loadNavMenu();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
