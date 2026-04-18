export interface StationboardEntry {
  number: string;
  category: string;
  to: string;
  stop: {
    departure: string;
    prognosis: {
      departure: string | null;
    };
  };
}

export interface StationboardData {
  stationboard: StationboardEntry[];
}

export interface LightGroup {
  name: string;
  action: {
    on: boolean;
  };
}

export type LightGroups = Record<string, LightGroup>;

export interface CalendarData {
  cardboard: string[];
  paper: string[];
  mrgreen: string[];
}

export interface WifiData {
  ssid: string;
  pass: string;
  qrCodeDataUrl: string;
}
