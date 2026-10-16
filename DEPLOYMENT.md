# Motor Web: development and production

## Development

Double-click `DEV.bat`. It runs `npm run dev` and starts the HTTPS webpack
development server with hot reload. Open `https://localhost:8081/`; use
`https://motor.web:8081/` if `motor.web` resolves to this computer. Accept the
development certificate warning if prompted. Press Ctrl+C in the batch window
to stop the server. Administrator privileges are not needed.

## Production on IIS

Right-click `DEPLOY_AS_ADMIN.bat` and select **Run as administrator**. This is
the routine production deployment. It runs `npm run deploy`, which builds the
production bundle and deploys it to `C:\inetpub\wwwroot\motorweb\`.

The production build includes all source pages under `pages/` and the local
JavaScript/runtime assets those pages load. The deployment script copies `dist`
and then copies the root `web.config` into the IIS folder. There is no
separate/manual `web.config` copy step when using this script. Administrator
privileges are needed because the script writes to the IIS content folder and
controls the configured IIS site and app pool.

Development continues to serve the source pages and source scripts directly;
the production-only static page/runtime copies do not change the dev server.

The site and app pool are expected to be named `motor`; these values and the
deployment folder are configured in `deploy.js`. Use the URL configured in
IIS. The included `SETUP_IIS.bat` configures `http://motor.web/` and
`https://motor.web:10000/`.

## Other commands and scripts

| Command/script | Purpose |
| --- | --- |
| `npm run build:prod` | Build production files into `dist` only; does not deploy. |
| `npm run deploy` | Build and deploy to IIS; run in an Administrator terminal. |
| `DEPLOY.bat` | Compatibility alias for `DEPLOY_AS_ADMIN.bat`. |
| `DEPLOY_WEBCONFIG.bat` | Compatibility alias for the full production deployment; it is not config-only. |
| `SETUP_IIS.bat` | One-time IIS setup only. It stops IIS services and deletes/recreates the `motor` site and app pool; do not use for routine deployments. |

If deployment fails, keep the batch output and check that IIS is installed, the
`motor` site/app pool exist, and `C:\inetpub\wwwroot\motorweb\` is the intended
site directory. A production build alone does not update the live site.
