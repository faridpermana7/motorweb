# HTTPS & Geolocation Setup Guide

## 🔐 SSL Certificate Information

Your dev server now uses a **self-signed SSL certificate** located in the `certs/` folder:
- **Certificate**: `certs/cert.pem`
- **Private Key**: `certs/key.pem`

### Why HTTPS?
The **Geolocation API requires HTTPS** for non-localhost origins (like `motor.web`). This is a browser security requirement.

## 📍 Accessing Your App

| URL | Protocol | Geolocation | Notes |
|-----|----------|------------|-------|
| **https://motor.web:8080/** | HTTPS ✅ | **Works** ✅ | Use this for development |
| **https://127.0.0.1:8080/** | HTTPS ✅ | Works ✅ | Alternative loopback |
| **http://localhost:8080/** | HTTP ❌ | Works ✅ | No location needed |

## 🖥️ Browser Certificate Warning

When you first visit **https://motor.web:8080/**, you'll see a certificate warning because it's self-signed:

1. Click **"Advanced"** or **"Proceed to motor.web (unsafe)"**
2. The browser will remember your choice
3. The site will load and geolocation will work

**Note**: This warning only appears in development. Production certificates are signed by Certificate Authorities.

## 📋 What Was Changed

### webpack.config.js
- Added HTTPS support using self-signed certificates
- Configured `devServer.server` with SSL options
- Updated `allowedHosts` to include `motor.web`

### Geolocation Flow
1. User loads **https://motor.web:8080/**
2. App requests geolocation permission
3. Browser prompts user to allow location access
4. If allowed → sends coordinates to backend
5. If denied → shows alert "You must allow location access"

## ⚙️ Regenerating Certificates (if needed)

If your certificate expires or you need to regenerate it:

```powershell
cd d:\project\motorweb\certs
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=motor.web"
```

Then restart the dev server:
```bash
npm start
```

## 🚀 Production Deployment

For production on IIS:
1. Obtain a valid SSL certificate from a Certificate Authority
2. Configure IIS with the certificate binding for `motor.web`
3. Update `deploy.js` to handle HTTPS URLs
4. Run `npm run build:prod` and deploy

## ✅ Testing Geolocation

1. Open **https://motor.web:8080/**
2. Click sign-in
3. Browser should ask for location permission
4. Click **Allow** to share your location
5. Coordinates will be sent to the backend API

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Certificate warning won't go away | Try in an incognito/private window or clear browser cache |
| Geolocation still not working | Check browser console for errors; verify location permission granted |
| Can't access motor.web | Verify hosts file has `127.0.0.1 motor.web` entry |
| Dev server won't start | Run `npm install` to ensure all packages installed |

## 📁 Project Structure

```
motorweb/
├── certs/
│   ├── cert.pem          # SSL Certificate
│   └── key.pem           # Private Key
├── webpack.config.js     # HTTPS configured here
├── assets/
│   ├── js/
│   │   ├── bootstrap-login.js  # Geolocation request code
│   │   └── config.json         # API configuration
│   └── ...
└── pages/
    └── sign-in.html      # Sign-in page with location request
```
