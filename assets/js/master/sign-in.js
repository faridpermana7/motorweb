import '../utils/notifications.js';

let API_BASE_URL = 'http://127.0.0.1:9999';
const configPromise = fetch('../assets/js/config.json')
  .then(response => response.ok ? response.json() : Promise.reject(response))
  .then(config => {
    API_BASE_URL = config.apiBaseUrl || API_BASE_URL;
  })
  .catch(() => {
    console.warn('Unable to load config.json; using default API_BASE_URL.');
  });

function requireLocationAccess() {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) {
      resolve({ latitude: 0, longitude: 0, unavailable: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        resolve({ latitude, longitude, unavailable: false });
      },
      () => {
        // Some browsers deny geolocation on the current origin even if the OS permission is enabled.
        // Do not block the login flow; fall back to a neutral location so the auth request can continue.
        resolve({ latitude: 0, longitude: 0, unavailable: true });
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}

document.querySelectorAll('.input-group-outline .form-control').forEach(input => {
    const group = input.closest('.input-group-outline');
    if (!group) return;

    const updateFilledState = () => {
        group.classList.toggle('is-filled', input.value.length > 0);
    };

    updateFilledState();
    input.addEventListener('focus', () => group.classList.add('is-focused'));
    input.addEventListener('blur', () => {
        group.classList.remove('is-focused');
        updateFilledState();
    });
    input.addEventListener('input', updateFilledState);
});

document.getElementById('signInBtn').addEventListener('click', async function() {
    await configPromise;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        window.showAlert('Please enter both username and password.', 'warning');
        return;
    }

    const coords = await requireLocationAccess();
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': navigator.userAgent
    };

    if (!coords.unavailable) {
        headers['X-Location'] = `${coords.latitude},${coords.longitude}`;
    } else {
        console.warn('Location unavailable; continuing login without X-Location header.');
    }

    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers,
        body: new URLSearchParams({
            username: username,
            password: password,
        }),
    })
    .then(response => {
        if (!response.ok) {
            if(response.status == 401){
                window.showAlert('Authentication failed: ' + 'Please check your username and password.', 'danger');
                throw new Error('Please check your username and password.'); 
            }
                else{
                    window.showAlert('Internal server error: ' + 'Please try again later.', 'danger');
                    throw new Error('The internal server error occurred. Please try again later.');
                } 
        }
        return response.json();
    })
    .then(data => {
        // Assuming the response has 'access_token'
        if (data.access_token) {
            // Store the token in localStorage
            localStorage.setItem('access_token', data.access_token); 
            localStorage.setItem("menus", JSON.stringify(data.menus || []));

            // Show success alert and redirect
            window.showAlert('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            throw new Error('Token not received.');
        }
    })
    .catch(error => {
        window.showAlert('Login failed: ' + error.message, 'danger');
    });
});