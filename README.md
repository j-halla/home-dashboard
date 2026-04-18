# Home Dashboard

A home dashboard built with Node.js/Express that displays real-time information including train departures, Philips Hue light controls, waste collection calendar, and a WiFi QR code.

## Features

- **Stationboard** — live Swiss train departures via [transport.opendata.ch](https://transport.opendata.ch)
- **Philips Hue** — light group status and toggle controls via the Hue Bridge API
- **Waste collection calendar** — upcoming pickup dates via [openerz.metaodi.ch](https://openerz.metaodi.ch) and [mr-green.ch](https://mr-green.ch)
- **WiFi QR code** — scan-to-connect QR code for guests

## Architecture

The backend serves a static frontend and pushes real-time data to the browser via Server-Sent Events (SSE). Each service polls its upstream API independently and caches the latest data for SSE clients.

```
src/
  app.js              # Express app entry point
  config/index.js     # All configuration and environment variables
  middleware/         # Request logging and error handling
  routes/
    api.js            # REST endpoints
    sse.js            # SSE endpoints
  services/           # calendarService, lightService, stationboardService, wifiService
  utils/              # SSE helpers
  public/             # Static frontend assets
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000                      # Optional, defaults to 3000

STATION_NAME=                  # Swiss transport station name (e.g. "Zurich HB")
HUE_USER=                      # Philips Hue API username
HUE_BRIDGE_ADDRESS=            # Fallback IP for the Hue Bridge (used if discovery fails)
ZIP=                           # Swiss postal code for waste collection calendar
WIFI_SSID=                     # WiFi network name for QR code
WIFI_PASSWORD=                 # WiFi password for QR code
```

## API

### REST

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/trigger-light` | Toggle a light. Body: `{ "id": "<group-id>", "on": true\|false }` |

### SSE

| Path | Update interval | Description |
|------|----------------|-------------|
| `GET /sse/stationboard` | 10 seconds | Next train departures |
| `GET /sse/groups` | 1 hour | Hue light groups (initial load) |
| `GET /sse/light` | 1 second | Real-time Hue light state |
| `GET /sse/calendar` | 1 hour | Upcoming waste collection dates |
| `GET /sse/wifi` | One-shot | WiFi QR code data |

## Docker

### Development (with hot reload via nodemon + nginx reverse proxy)

```sh
docker compose --profile dev up --build
```

### Production

```sh
docker compose --profile prod up --build
```

Both profiles expose the app on port `3000` and nginx on port `8080`.

## Local Development

```sh
npm install
npm run dev
```

Requires Node.js and a `.env` file with the variables above.
