package dev.haller.dashboard.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dashboard")
public class AppProperties {

    private Stationboard stationboard = new Stationboard();
    private Lights lights = new Lights();
    private Calendar calendar = new Calendar();
    private Wifi wifi = new Wifi();

    public Stationboard getStationboard() { return stationboard; }
    public void setStationboard(Stationboard stationboard) { this.stationboard = stationboard; }

    public Lights getLights() { return lights; }
    public void setLights(Lights lights) { this.lights = lights; }

    public Calendar getCalendar() { return calendar; }
    public void setCalendar(Calendar calendar) { this.calendar = calendar; }

    public Wifi getWifi() { return wifi; }
    public void setWifi(Wifi wifi) { this.wifi = wifi; }

    public static class Stationboard {
        private String station = "Zurich HB";
        private int limit = 5;
        private String apiUrl = "https://transport.opendata.ch/v1/stationboard";

        public String getStation() { return station; }
        public void setStation(String station) { this.station = station; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
        public String getApiUrl() { return apiUrl; }
        public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }
    }

    public static class Lights {
        private String user = "";
        private String bridgeAddressFallback = "";
        private String discoveryApiUrl = "http://discovery.meethue.com/";

        public String getUser() { return user; }
        public void setUser(String user) { this.user = user; }
        public String getBridgeAddressFallback() { return bridgeAddressFallback; }
        public void setBridgeAddressFallback(String bridgeAddressFallback) { this.bridgeAddressFallback = bridgeAddressFallback; }
        public String getDiscoveryApiUrl() { return discoveryApiUrl; }
        public void setDiscoveryApiUrl(String discoveryApiUrl) { this.discoveryApiUrl = discoveryApiUrl; }
    }

    public static class Calendar {
        private String zip = "8000";

        public String getZip() { return zip; }
        public void setZip(String zip) { this.zip = zip; }
    }

    public static class Wifi {
        private String ssid = "";
        private String password = "";

        public String getSsid() { return ssid; }
        public void setSsid(String ssid) { this.ssid = ssid; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
