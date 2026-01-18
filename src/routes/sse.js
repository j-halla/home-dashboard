import express from 'express';
import { config } from '../config/index.js';
import { stationboardService } from '../services/stationboardService.js';
import { lightService } from '../services/lightService.js';
import { calendarService } from '../services/calendarService.js';
import { wifiService } from '../services/wifiService.js';
import { createPollingSSE, createOneShotSSE } from '../utils/sseHelper.js';

const router = express.Router();

// Stationboard SSE - updates every 10 seconds
router.get(
  '/stationboard',
  createPollingSSE(() => stationboardService.getData(), config.stationboard.sseInterval)
);

// Light groups SSE (initial load) - updates every hour
router.get(
  '/groups',
  createPollingSSE(() => lightService.getGroups(), config.lights.sseGroupsInterval)
);

// Light status SSE (real-time updates) - updates every second
router.get(
  '/light',
  createPollingSSE(
    () => lightService.getGroups(),
    config.lights.sseLightInterval,
    () => lightService.getLastLightUpdate() // Wait for pending light updates
  )
);

// Calendar SSE - updates every hour
router.get(
  '/calendar',
  createPollingSSE(() => calendarService.getData(), config.calendar.sseInterval)
);

// WiFi SSE - one-shot (sends data once and closes)
router.get('/wifi', createOneShotSSE(() => wifiService.getWifiData()));

export default router;
