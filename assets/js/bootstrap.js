// Bootstrap application - loads all common CSS and JavaScript dependencies
// This file is loaded first in every page to ensure all dependencies are available

(function() {
    // Detect base path based on script location
    function getBasePath() {
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src.includes('bootstrap.js')) {
                // Get the directory containing bootstrap.js
                const bootstrapPath = script.src.split('/').slice(0, -3).join('/');
                return bootstrapPath; // Returns up to /motorweb
            }
        }
        return window.location.origin; // Fallback
    }

    const BASE_PATH = getBasePath();

    // Load CSS stylesheets
    function loadCSS() {
        const cssFiles = [
            '/assets/css/nucleo-icons.css',
            '/assets/css/nucleo-svg.css',
            '/assets/css/motor.css',
            '/assets/css/material-dashboard.css?v=3.2.0'
        ];

        const externalCSS = [
            'https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,900',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
            'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0'
        ];

        // Add base path to local CSS files
        const localCSSWithBase = cssFiles.map(file => BASE_PATH + file);
        const allCSS = [...externalCSS, ...localCSSWithBase];

        allCSS.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            document.head.appendChild(link);
        });
    }

    // Load JavaScript files sequentially
    function loadScripts(scripts) {
        return scripts.reduce((promise, src) => {
            return promise.then(() => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = resolve;
                    script.onerror = () => {
                        console.warn(`Failed to load script: ${src}`);
                        resolve();
                    };
                    document.head.appendChild(script);
                });
            });
        }, Promise.resolve());
    }

    function init() {
        // Load CSS immediately
        loadCSS();

        // Core scripts to load in order (using absolute paths from BASE_PATH)
        const coreScripts = [
            BASE_PATH + '/assets/js/core/popper.min.js',
            BASE_PATH + '/assets/js/core/bootstrap.min.js',
            BASE_PATH + '/assets/js/plugins/perfect-scrollbar.min.js',
            BASE_PATH + '/assets/js/plugins/smooth-scrollbar.min.js'
        ];

        // Utility scripts
        const utilityScripts = [  
            BASE_PATH + '/assets/js/utils/notifications.js'
        ];

        // Material dashboard
        const dashboardScripts = [
            BASE_PATH + '/assets/js/utils/material-dashboard.min.js?v=3.2.0'
        ];

        // External scripts (loaded asynchronously)
        const externalScripts = [
            'https://buttons.github.io/buttons.js'
        ];

        const allScripts = [...coreScripts, ...utilityScripts, ...dashboardScripts];

        loadScripts(allScripts).then(() => {
            // Mark that app is ready
            window.appReady = true;
            
            // Load external scripts asynchronously (non-blocking)
            externalScripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            });

            // Emit appReady event for page-specific scripts
            window.dispatchEvent(new Event('appReady'));
        });
    }

    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();