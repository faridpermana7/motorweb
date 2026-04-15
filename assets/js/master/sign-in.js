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
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        resolve({ latitude, longitude });
      },
      err => {
        reject("Location access denied");
      }
    );
  });
}

document.getElementById('signInBtn').addEventListener('click', async function() {
    await configPromise;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showAlert('Please enter both username and password.', 'warning');
        return;
    }

    requireLocationAccess()
            .then (coords => { 
                // Send POST request to login endpoint
                fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        "X-Location": `${coords.latitude},${coords.longitude}`,
                        "User-Agent": navigator.userAgent
                    },
                    body: new URLSearchParams({
                        username: username,
                        password: password,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        if(response.status == 401){
                            showAlert('Authentication failed: ' + 'Please check your username and password.', 'danger');
                            throw new Error('Please check your username and password.'); 
                        }
                            else{
                                showAlert('Internal server error: ' + 'Please try again later.', 'danger');
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
                        // Show success alert and redirect
                        showAlert('Login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 2000);
                    } else {
                        throw new Error('Token not received.');
                    }
                })
                .catch(error => {
                    showAlert('Login failed: ' + error.message, 'danger');
                });
            },
            err => { 
                showAlert('You must allow location access to use this service.', 'danger');
            }
        );
});