// api.js
import { API_BASE_URL } from '../config.js';

// Helper to wait for showAlert to be available, then call it
async function alert(message, variant = 'primary') {
  // Wait for showAlert to be available (max 5 seconds)
  let attempts = 0;
  while (!window.showAlert && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.showAlert) {
    window.showAlert(message, variant);
  } else {
    console.warn(message);
  }
}

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("access_token");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    mode: "cors",
    credentials: "include"
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    console.log('API Response status:', response.status, 'for', options.method || 'GET', url);
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        await alert("Authentication failed: Please sign in again.", "danger");
        window.location.href = `/pages/sign-in.html`;
        throw new Error("Authentication failed");
      } else {
        // Try to get error details from response
        let errorMessage = "Server error";
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          
          // Handle validation errors (422)
          if (response.status === 422 && errorData.errors) {
            const validationErrors = Object.values(errorData.errors).flat().join(', ');
            errorMessage = `Validation failed: ${validationErrors}`;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = `Server error (${response.status})`;
          }
        } catch (e) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        
        await alert(errorMessage, "danger");
        throw new Error(errorMessage);
      }
    } else { 
      // Only show success alerts for non-GET requests and if not explicitly disabled
      if (options.showSuccess !== false && options.method && options.method.toUpperCase() !== "GET") {
        if (options.method.toUpperCase() === "POST") {
          await alert("Data created successfully.", "success");
        } else if (options.method.toUpperCase() === "PUT") {
          await alert("Data updated successfully.", "success");
        } else if (options.method.toUpperCase() === "DELETE") {
          await alert("Data deleted successfully.", "success");
        }
      }
    }

    return response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      await alert("Server issue: Unable to connect. Please try again later.", "danger");
    }
    throw error; 
  }
}
