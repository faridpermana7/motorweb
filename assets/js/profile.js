// profile.js
// Waits for bootstrap.js to load all dependencies, then initializes profile

(function() {
    function initProfile() {
        console.log('Profile JS loaded');
        
        // loadNavMenu is guaranteed to be available from bootstrap.js
        if (typeof loadNavMenu === 'function') {
            loadNavMenu();
        } else {
            console.error('loadNavMenu function not found');
        }
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
