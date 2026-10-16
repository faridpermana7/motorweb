// Bootstrap application - loads all common CSS and JavaScript dependencies
// This file is loaded first in every page to ensure all dependencies are available

import { loadTranslations, applyTranslations } from './utils/translations.js';
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
            '/assets/css/material-dashboard.css?v=3.2.0',
            '/node_modules/select2/dist/css/select2.css',
            '/assets/css/motor.css'
        ];

        const externalCSS = [
            // 'https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,900',
            // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
            // 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0'

            // Inter font (choose weights you need)
            '/node_modules/@fontsource/inter/300.css',
            '/node_modules/@fontsource/inter/400.css',
            '/node_modules/@fontsource/inter/500.css',
            '/node_modules/@fontsource/inter/600.css',
            '/node_modules/@fontsource/inter/700.css',
            '/node_modules/@fontsource/inter/900.css',

            // Font Awesome
            '/node_modules/font-awesome/css/font-awesome.min.css',

            // Material Symbols Rounded
            '/node_modules/material-symbols/index.css',
            '/node_modules/datatables.net-dt/css/dataTables.dataTables.min.css',
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
            BASE_PATH + '/node_modules/jquery/dist/jquery.min.js',
            BASE_PATH + '/assets/js/core/popper.min.js',
            BASE_PATH + '/assets/js/core/bootstrap.min.js',
            BASE_PATH + '/assets/js/plugins/perfect-scrollbar.min.js',
            BASE_PATH + '/assets/js/plugins/smooth-scrollbar.min.js',
            BASE_PATH + '/node_modules/select2/dist/js/select2.js',
            BASE_PATH + '/node_modules/datatables.net/js/dataTables.min.js',
            BASE_PATH + '/node_modules/github-buttons/dist/buttons.js',
        ];

        // Utility scripts
        const utilityScripts = [  
            BASE_PATH + '/assets/js/utils/notifications.js'
        ];

        // Material dashboard
        const dashboardScripts = [
            BASE_PATH + '/assets/js/core/material-dashboard.min.js?v=3.2.0'
        ];

        // External scripts (loaded asynchronously)
        const externalScripts = [
            // 'https://buttons.github.io/buttons.js'
        ];

        // const allScripts = [...coreScripts, ...utilityScripts, ...dashboardScripts];// keep dashboardScripts separate and do NOT include it in allScripts
        const allScripts = [...coreScripts, ...utilityScripts]; // dashboardScripts excluded

        // 1) Load core + utility scripts first (perfect-scrollbar will be loaded here)
        loadScripts(allScripts).then(() => {
        // At this point perfect-scrollbar.min.js has been executed and window.PerfectScrollbar exists (real constructor)

        // 2) Wrap the real PerfectScrollbar with a safe guard so calls with null don't throw
        if (window.PerfectScrollbar) {
            const RealPerfectScrollbar = window.PerfectScrollbar;
            // Only wrap once
            if (!RealPerfectScrollbar.__wrappedByBootstrap) {
            const safePS = function(element, options) {
                if (!element || !element.nodeName) {
                // skip silently (or log)
                // console.warn('PerfectScrollbar skipped: no valid element');
                return;
                }
                return new RealPerfectScrollbar(element, options);
            };
            // preserve reference to real constructor if needed later
            safePS.__real = RealPerfectScrollbar;
            safePS.__wrappedByBootstrap = true;
            // replace global constructor with the safe wrapper
            window.PerfectScrollbar = safePS;
            }
        } else {
            // If perfect-scrollbar failed to load for some reason, create a no-op stub
            if (!window.PerfectScrollbar) {
            window.PerfectScrollbar = function() {
                // no-op stub to satisfy material-dashboard
            };
            }
        }

        // 3) Optionally perform your own guarded initializations (if you want)
        const mainPanel = document.querySelector('.main-panel');
        if (mainPanel) new window.PerfectScrollbar(mainPanel);

        const sidebar = document.querySelector('.sidebar');
        if (sidebar) new window.PerfectScrollbar(sidebar);

            // 4) Now load the dashboard script(s) safely — it will call window.PerfectScrollbar,
            //     but the wrapper prevents throws on null elements
            loadScripts(dashboardScripts).then(async () => {
                // Load external scripts asynchronously (non-blocking)
                externalScripts.forEach(src => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
                });

                await loadTranslations();
                applyTranslations(); // global pass for static UI

                window.appReady = true;
                // Emit appReady event for page-specific scripts
                window.dispatchEvent(new Event('appReady'));
            });
        });

    }

    // Start loading when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();