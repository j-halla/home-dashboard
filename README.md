# Home Dashboard

A home dashboard built with Spring Boot and React that displays real-time information including train departures, Philips Hue light controls, waste collection calendar, and a WiFi QR code.

## Features

- **Stationboard** — live Swiss train departures via [transport.opendata.ch](https://transport.opendata.ch)
- **Philips Hue** — light group status and toggle controls via the Hue Bridge API
- **Waste collection calendar** — upcoming pickup dates via [openerz.metaodi.ch](https://openerz.metaodi.ch) and [mr-green.ch](https://mr-green.ch)
- **WiFi QR code** — scan-to-connect QR code for guests

## Architecture

The backend pushes real-time data to the browser via a single SSE endpoint with named events. Each service polls its upstream API independently and caches the latest data for SSE clients.

```
backend/                        # Spring Boot (Java 21, WebFlux, Maven)
  src/main/java/dev/haller/dashboard/
    config/                     # AppProperties, WebClientConfig
    controller/                 # SseController, LightController
    service/                    # CalendarService, LightService, StationboardService, WifiService
    model/                      # CalendarData, WifiData, TriggerLightRequest

frontend/                       # React 18 + Vite + TypeScript + Bootstrap
  src/
    hooks/useSse.ts             # EventSource hook for named SSE events
    components/                 # StationboardTab, LightsTab, CalendarTab, WifiTab
    types/                      # Shared TypeScript interfaces
```

## Environment Variables

Create a `.env` file in the project root:

```env
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
| `POST` | `/api/trigger-light` | Toggle a light group. Body: `{ "id": "<group-id>", "on": true\|false }` |

### SSE

Single endpoint `GET /sse` with named events:

| Event | Update interval | Description |
|-------|----------------|-------------|
| `stationboard` | 10 seconds | Next train departures |
| `groups` | 1 hour | Hue light groups (rebuilds UI) |
| `light` | 1 second | Real-time Hue light state |
| `calendar` | 1 hour | Upcoming waste collection dates |
| `wifi` | One-shot | WiFi QR code data |

## Docker

### Development

```sh
docker compose --profile dev up --build
```

Starts nginx (port `8080`), Spring Boot backend, and the Vite dev server with hot module replacement.

### Production

```sh
docker compose --profile prod up --build
```

Builds the React app and serves it as static files via nginx alongside the Spring Boot backend. Exposed on port `8080`.
