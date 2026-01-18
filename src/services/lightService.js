import fetch from 'node-fetch';
import { config } from '../config/index.js';

class LightService {
  constructor() {
    this.bridgeAddress = '';
    this.groups = {};
    this.lastLightUpdate = Promise.resolve();
  }

  getGroupsApiUrl() {
    return `http://${this.bridgeAddress}/api/${config.lights.user}/groups/`;
  }

  async discoverBridge() {
    try {
      const response = await fetch(config.lights.discoveryApiUrl);

      if (!response.ok) {
        this.bridgeAddress = config.lights.bridgeAddressFallback;
        console.log(`[LightService] Bridge address fallback used: ${this.bridgeAddress}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0 && data[0][config.lights.bridgeAddressKey]) {
        this.bridgeAddress = data[0][config.lights.bridgeAddressKey];
        console.log(`[LightService] Bridge address found: ${this.bridgeAddress}`);
      } else {
        console.error('[LightService] No bridge address found in discovery response:', data);
      }
    } catch (error) {
      console.error('[LightService] Error discovering bridge:', error.message);
    }
  }

  async updateGroups() {
    try {
      const response = await fetch(this.getGroupsApiUrl());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.groups = await response.json();
      console.log('[LightService] Groups updated successfully');
    } catch (error) {
      console.error('[LightService] Error updating groups:', error.message);
    }
  }

  async triggerLight(groupId, on) {
    const response = await fetch(
      `http://${this.bridgeAddress}/api/${config.lights.user}/groups/${groupId}/action/`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on }),
      }
    );

    const data = await response.json();

    // Schedule a groups update after the bridge has time to process
    this.lastLightUpdate = new Promise((resolve) => {
      setTimeout(async () => {
        await this.updateGroups();
        resolve();
      }, 200);
    });

    return data;
  }

  getGroups() {
    return this.groups;
  }

  getLastLightUpdate() {
    return this.lastLightUpdate;
  }

  async startPolling() {
    await this.discoverBridge();
    await this.updateGroups();

    setInterval(() => this.discoverBridge(), config.lights.bridgeDiscoveryInterval);
    setInterval(() => this.updateGroups(), config.lights.groupsUpdateInterval);
  }
}

export const lightService = new LightService();
