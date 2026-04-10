const API_BASE_URL = 'http://127.0.0.1:9999';

document.getElementById('signInBtn').addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showAlert('Please enter both username and password.', 'warning');
        return;
    }

    // Send POST request to login endpoint
    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
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
});