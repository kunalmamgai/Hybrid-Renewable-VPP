# SURYA Hybrid Renewable VPP

SURYA is a hybrid renewable virtual power plant platform with a live VIT Bhopal campus digital twin. The **Live Demo → Live Energy Flow** workspace includes:

- an interactive 3D campus simulator with live weather, buildings, roads, people and vehicles;
- live simulator telemetry surfaced in the SURYA dashboard;
- a switchable solar/wind/battery/building/grid network view;
- a FastAPI VPP backend for dispatch, forecasting and decision history;
- a self-contained demonstration mode for static public hosting.

## Run locally

Requirements: Node.js 22+, Python 3.11+ and the Python packages in `requirements.txt`.

```bash
npm run install:all
pip install -r requirements.txt
npm run dev
```

Open `http://localhost:5173/#/energy-flow`. The command starts the API, website and campus twin together. The simulator runs internally on port `5174`.

## Authentication

Email/password sign-up works locally after the normal setup above. Passwords are stored as Argon2 hashes, and the API issues signed, expiring access tokens.

To enable **Continue with Google**:

1. In [Google Auth Platform](https://console.cloud.google.com/auth/clients), create an OAuth 2.0 client of type **Web application**.
2. Add `http://localhost:5173` under **Authorized JavaScript origins**.
3. Copy the Web client ID into both values in the root `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

4. Restart `npm run dev` after changing `.env`.

The frontend receives a Google ID credential and sends it to the backend, which verifies its signature, audience, issuer and expiry before signing the user into SURYA. No Google client secret is required for this sign-in flow.

## Verify the project

```bash
npm run check
npm test
```

`npm run check` tests the simulator and creates one production site in `frontend/dist`, including the complete simulator at `frontend/dist/simulator`.

## Public GitHub Pages deployment

1. Create a **public** GitHub repository and push this project to `main` or `master`.
2. In **Settings → Pages**, choose **GitHub Actions** as the source once.
3. The included workflow tests, builds and deploys the website and simulator together.

No frontend API key is required. Static hosting automatically uses the built-in demonstration data; configure `VITE_WS_URL` when deploying the FastAPI/WebSocket backend separately for fully live VPP decisions.
