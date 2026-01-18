import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,

  // Stationboard
  stationboard: {
    station: process.env.STATION_NAME,
    limit: 5,
    apiUrl: 'https://transport.opendata.ch/v1/stationboard',
    updateInterval: 30000, // 30 seconds
    sseInterval: 10000,    // 10 seconds
  },

  // Philips Hue Lights
  lights: {
    user: process.env.HUE_USER,
    bridgeAddressFallback: process.env.HUE_BRIDGE_ADDRESS,
    discoveryApiUrl: 'http://discovery.meethue.com/',
    bridgeAddressKey: 'internalipaddress',
    bridgeDiscoveryInterval: 86400000, // 24 hours
    groupsUpdateInterval: 1000,        // 1 second
    sseGroupsInterval: 3600000,        // 1 hour
    sseLightInterval: 1000,            // 1 second
  },

  // Calendar (waste collection)
  calendar: {
    zip: process.env.ZIP,
    types: ['cardboard', 'paper'],
    mrGreenType: 'Monthly',
    limitResponse: 10,
    limitEntries: 3,
    openerzApiUrl: 'https://openerz.metaodi.ch/api/calendar.json',
    mrGreenApiUrl: 'https://api.mr-green.ch/api/get-pickup-dates-new-main',
    updateInterval: 3600000, // 1 hour
    sseInterval: 3600000,    // 1 hour
  },

  // WiFi
  wifi: {
    ssid: process.env.WIFI_SSID,
    password: process.env.WIFI_PASSWORD,
  },
};

export const germanMonths = {
  'Januar': '01',
  'Februar': '02',
  'März': '03',
  'April': '04',
  'Mai': '05',
  'Juni': '06',
  'Juli': '07',
  'August': '08',
  'September': '09',
  'Oktober': '10',
  'November': '11',
  'Dezember': '12',
};
