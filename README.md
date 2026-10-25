# Motor Web

Node.js web client for the local API and BMKG integrations.

## Run locally

Requirements: Node.js and npm.

```powershell
npm ci
npm run dev
```

Open https://localhost:8081/ and accept the development certificate warning if prompted. Press Ctrl+C in the terminal to stop the server. On Windows, `DEV.bat` runs the development server. Webpack's stdout/stderr is passed through to the parent process, so NSSM captures it in its configured stdout/stderr files rather than the daily application log. In development, browser `console.log`/`info`/`warn`/`error`/`debug` messages and uncaught page errors from all HTML pages are sent to `logs/motor_web-YYYY-MM-DD.log`. Sensitive object fields such as passwords, tokens, and authorization headers are redacted. Production pages do not load the browser logger. The `logs` folder is created automatically; application log files are appended to for the current date, and a new file is used each day. NSSM stdout and stderr can be directed to separate files such as `logs/nssm-stdout.log` and `logs/nssm-stderr.log`.

## Build and deploy

```powershell
npm run build        # Development build
npm run build:prod   # Optimized production build
npm run deploy       # Build and deploy to IIS (Windows)
```

IIS deployment may require administrator privileges. See [WEBPACK_SETUP.md](WEBPACK_SETUP.md) for build details and troubleshooting.

## Items API pagination

Tables default to sorting by ID descending so the newest records appear first.

The Items table requests one page at a time from `GET /items`, using `skip` and
`limit` query parameters. It also sends optional `search`, `sort_by`, and
`sort_order` parameters. The API must apply these parameters before returning
rows and respond with `{ "data": [...], "total": 123, "filtered_total": 45 }`,
where `total` is the unfiltered count and `filtered_total` is the count after
searching. `filtered_total` may be omitted when no search is applied. The CSV
export continues to call `/items` without pagination parameters and expects the
complete array.



# User
pfar-pfar Admin
karim-karim Cashier