import QRCode from 'qrcode';
import { config } from '../config/index.js';

class WifiService {
  async getWifiData() {
    const { ssid, password } = config.wifi;
    const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
    const qrCodeDataUrl = await QRCode.toDataURL(wifiString);

    return {
      ssid,
      pass: password,
      qrCodeDataUrl,
    };
  }
}

export const wifiService = new WifiService();
