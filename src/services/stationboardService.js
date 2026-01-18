import fetch from 'node-fetch';
import { config } from '../config/index.js';

class StationboardService {
  constructor() {
    const { station, limit, apiUrl } = config.stationboard;
    this.apiUrl = `${apiUrl}?station=${station}&limit=${limit}`;
    this.data = {};
  }

  async updateData() {
    try {
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.data = await response.json();
      console.log(`[StationboardService] Data updated successfully`);
    } catch (error) {
      console.error('[StationboardService] Error updating data:', error.message);
    }
  }

  getData() {
    return this.data;
  }

  startPolling() {
    this.updateData();
    setInterval(() => this.updateData(), config.stationboard.updateInterval);
  }
}

export const stationboardService = new StationboardService();
