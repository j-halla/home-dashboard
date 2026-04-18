package dev.haller.dashboard.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.haller.dashboard.config.AppProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
public class StationboardService {

    private static final Logger log = LoggerFactory.getLogger(StationboardService.class);

    private final WebClient webClient;
    private final AppProperties props;
    private final ObjectMapper objectMapper;
    private volatile JsonNode cachedData;

    public StationboardService(WebClient webClient, AppProperties props, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void startPolling() {
        Flux.interval(Duration.ZERO, Duration.ofSeconds(30))
            .flatMap(tick -> fetchData())
            .subscribe(
                data -> this.cachedData = data,
                err -> log.error("Stationboard polling error", err)
            );
    }

    private Mono<JsonNode> fetchData() {
        AppProperties.Stationboard sb = props.getStationboard();
        String url = sb.getApiUrl() + "?station=" + sb.getStation() + "&limit=" + sb.getLimit();
        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(JsonNode.class)
            .onErrorResume(e -> {
                log.error("Stationboard fetch failed: {}", e.getMessage());
                return Mono.empty();
            });
    }

    public Flux<ServerSentEvent<String>> eventFlux() {
        return Flux.interval(Duration.ZERO, Duration.ofSeconds(10))
            .filter(tick -> cachedData != null)
            .map(tick -> {
                try {
                    return ServerSentEvent.<String>builder()
                        .event("stationboard")
                        .data(objectMapper.writeValueAsString(cachedData))
                        .build();
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                }
            });
    }
}
