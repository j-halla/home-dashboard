package dev.haller.dashboard.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.haller.dashboard.config.AppProperties;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.util.Map;

@Service
public class LightService {

    private static final Logger log = LoggerFactory.getLogger(LightService.class);

    private final WebClient webClient;
    private final AppProperties props;
    private final ObjectMapper objectMapper;
    private volatile String bridgeAddress;
    private volatile JsonNode cachedGroups;
    private final Sinks.Many<JsonNode> groupsSink = Sinks.many().replay().latest();

    public LightService(WebClient webClient, AppProperties props, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void startPolling() {
        discoverBridge().subscribe();

        Flux.interval(Duration.ofHours(24))
            .flatMap(tick -> discoverBridge())
            .subscribe();

        Flux.interval(Duration.ofSeconds(1))
            .flatMap(tick -> updateGroups())
            .subscribe();
    }

    private Mono<Void> discoverBridge() {
        return webClient.get()
            .uri(props.getLights().getDiscoveryApiUrl())
            .retrieve()
            .bodyToMono(JsonNode.class)
            .doOnNext(data -> {
                if (data.isArray() && !data.isEmpty() && data.get(0).has("internalipaddress")) {
                    bridgeAddress = data.get(0).get("internalipaddress").asText();
                    log.info("Bridge discovered: {}", bridgeAddress);
                }
            })
            .onErrorResume(e -> {
                bridgeAddress = props.getLights().getBridgeAddressFallback();
                log.warn("Bridge discovery failed, using fallback: {}", bridgeAddress);
                return Mono.empty();
            })
            .then();
    }

    private Mono<Void> updateGroups() {
        if (bridgeAddress == null || bridgeAddress.isEmpty()) return Mono.empty();
        String url = "http://" + bridgeAddress + "/api/" + props.getLights().getUser() + "/groups/";
        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(JsonNode.class)
            .doOnNext(data -> {
                this.cachedGroups = data;
                groupsSink.tryEmitNext(data);
            })
            .onErrorResume(e -> {
                log.error("Groups fetch failed: {}", e.getMessage());
                return Mono.empty();
            })
            .then();
    }

    public Mono<JsonNode> triggerLight(String groupId, boolean on) {
        String url = "http://" + bridgeAddress + "/api/" + props.getLights().getUser() + "/groups/" + groupId + "/action/";
        return webClient.put()
            .uri(url)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of("on", on))
            .retrieve()
            .bodyToMono(JsonNode.class)
            .delayElement(Duration.ofMillis(200))
            .flatMap(result -> updateGroups().thenReturn(result))
            .onErrorResume(e -> {
                log.error("Trigger light failed: {}", e.getMessage());
                return Mono.empty();
            });
    }

    public Flux<ServerSentEvent<String>> eventFlux() {
        Flux<ServerSentEvent<String>> groupsFlux = Flux.concat(
            groupsSink.asFlux().next(),
            Flux.interval(Duration.ofHours(1)).flatMap(tick -> groupsSink.asFlux().next())
        ).map(data -> buildEvent("groups", data));

        Flux<ServerSentEvent<String>> lightFlux = Flux.interval(Duration.ZERO, Duration.ofSeconds(1))
            .filter(tick -> cachedGroups != null)
            .map(tick -> buildEvent("light", cachedGroups));

        return Flux.merge(groupsFlux, lightFlux);
    }

    private ServerSentEvent<String> buildEvent(String eventName, JsonNode data) {
        try {
            return ServerSentEvent.<String>builder()
                .event(eventName)
                .data(objectMapper.writeValueAsString(data))
                .build();
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
