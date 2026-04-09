// Global notification and popup utilities

function showNotification(message, type) {
    $.notify({
        message: message
    }, {
        type: type,
        placement: {
            from: 'top',
            align: 'right'
        },
        delay: 3000,
        timer: 10000,
        z_index: 1051
    });
}

// Make it global
window.showNotification = showNotification;

function showAlert(message, variant = 'primary', timeout = 5000) {
    const alertId = `global-alert-${Date.now()}`;
    const wrapper = document.createElement('div');
    wrapper.id = alertId;
    wrapper.className = `alert alert-${variant} alert-dismissible fade show position-fixed top-0 end-0 m-3 z-index-1051`;
    wrapper.setAttribute('role', 'alert');
    wrapper.innerHTML = `<strong>${variant.charAt(0).toUpperCase() + variant.slice(1)}!</strong> ${message}<button type="button" class="btn-close mt-02" data-bs-dismiss="alert" aria-label="Close">X</button>`;

    document.body.appendChild(wrapper);

    if (timeout > 0) {
        setTimeout(() => {
            const element = document.getElementById(alertId);
            if (element) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(element);
                bsAlert.close();
            }
        }, timeout);
    }
}

// Make alert helper global too
window.showAlert = showAlert;

// Add more notification/popup functions here as needed
// For example:
// function showConfirmDialog(message, callback) { ... }