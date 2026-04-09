// auth.js
(function() {
  // 1. Get token from localStorage (or sessionStorage)
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

 console.log("Token:", token);
  // 2. If no token, redirect to sign-in page
  if (!token) {
    console.log("No valid token found.");
    window.location.href = "sign-in.html";
    return;
  }

//   // 3. (Optional) Validate token with backend
//   fetch("/api/validate-token", {
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${token}`
//     }
//   })
//   .then(response => {
//     if (!response.ok) {
//       // Token invalid → redirect
//       window.location.href = "sign-in.html";
//     }
//   })
//   .catch(() => {
//     // Network error → treat as invalid
//     window.location.href = "sign-in.html";
//   });
})();
