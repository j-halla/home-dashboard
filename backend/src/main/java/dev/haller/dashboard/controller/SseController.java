package dev.haller.dashboard.controller;

import dev.haller.dashboard.service.CalendarService;
import dev.haller.dashboard.service.LightService;
import dev.haller.dashboard.service.StationboardService;
import dev.haller.dashboard.service.WifiService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
public class SseController {

    private final StationboardService stationboardService;
    private final LightService lightService;
    private final CalendarService calendarService;
    private final WifiService wifiService;

    public SseController(StationboardService stationboardService, LightService lightService,
                         CalendarService calendarService, WifiService wifiService) {
        this.stationboardService = stationboardService;
        this.lightService = lightService;
        this.calendarService = calendarService;
        this.wifiService = wifiService;
    }

    @GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> stream() {
        return Flux.merge(
            stationboardService.eventFlux(),
            lightService.eventFlux(),
            calendarService.eventFlux(),
            wifiService.eventFlux()
        );
    }
}
