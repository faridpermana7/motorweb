// api.js
const BASE_PATH = window.location.origin + "/";
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

//   return fetch(url, { ...defaultOptions, ...options })
//     .then(handleApiResponse);
// }

  const response = await fetch(url, { ...defaultOptions, ...options });
  console.log('API Response status:', response.status);
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
      // Redirect to sign-in
      // Show alert
      showAlert("Authentication failed: Please sign in again.", "danger");
      window.location.href = `/pages/sign-in.html`;
      throw new Error("Authentication failed");
    } else {
      // Show alert
      showAlert("Internal server error: Please try again later.", "danger");
      throw new Error("Server error");
    }
  }

  return response.json();
}
