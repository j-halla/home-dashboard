package dev.haller.dashboard.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.haller.dashboard.config.AppProperties;
import dev.haller.dashboard.model.CalendarData;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CalendarService {

    private static final Logger log = LoggerFactory.getLogger(CalendarService.class);

    private static final Map<String, String> GERMAN_MONTHS = Map.ofEntries(
        Map.entry("Januar", "01"), Map.entry("Februar", "02"), Map.entry("März", "03"),
        Map.entry("April", "04"), Map.entry("Mai", "05"), Map.entry("Juni", "06"),
        Map.entry("Juli", "07"), Map.entry("August", "08"), Map.entry("September", "09"),
        Map.entry("Oktober", "10"), Map.entry("November", "11"), Map.entry("Dezember", "12")
    );

    private final WebClient webClient;
    private final AppProperties props;
    private final ObjectMapper objectMapper;
    private final Sinks.Many<CalendarData> dataSink = Sinks.many().replay().latest();

    public CalendarService(WebClient webClient, AppProperties props, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void startPolling() {
        Flux.interval(Duration.ZERO, Duration.ofHours(1))
            .flatMap(tick -> fetchData())
            .subscribe(
                data -> {
                    log.info("Calendar data updated: cardboard={}, paper={}, mrgreen={}",
                        data.cardboard().size(), data.paper().size(), data.mrgreen().size());
                    dataSink.tryEmitNext(data);
                },
                err -> log.error("Calendar polling error", err)
            );
    }

    private Mono<JsonNode> fetchOpenErz(String zip, String today) {
        String url = "https://openerz.metaodi.ch/api/calendar.json?zip=" + zip
            + "&types=cardboard&types=paper&start=" + today + "&sort=date&offset=0&limit=10";
        return webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(JsonNode.class)
            .doOnError(e -> log.error("OpenERZ fetch failed: {}", e.getMessage()))
            .onErrorReturn(objectMapper.createObjectNode());
    }

    private Mono<JsonNode> fetchMrGreen(String zip) {
        return webClient.post()
            .uri("https://api-service.mr-green.ch/api/system/pickup-dates?zip=" + zip + "&type=monthly")
            .retrieve()
            .bodyToMono(JsonNode.class)
            .doOnError(e -> log.error("Mr. Green fetch failed: {}", e.getMessage()))
            .onErrorReturn(objectMapper.createObjectNode());
    }

    private Mono<CalendarData> fetchData() {
        String zip = props.getCalendar().getZip();
        String today = LocalDate.now().toString();

        return Mono.zip(fetchOpenErz(zip, today), fetchMrGreen(zip))
            .map(tuple -> processData(tuple.getT1(), tuple.getT2()))
            .doOnError(e -> log.error("Calendar processing error: {}", e.getMessage()))
            .onErrorReturn(new CalendarData(List.of(), List.of(), List.of()));
    }

    private CalendarData processData(JsonNode erz, JsonNode mrGreen) {
        List<String> cardboard = new ArrayList<>();
        List<String> paper = new ArrayList<>();

        JsonNode result = erz.get("result");
        if (result != null && result.isArray()) {
            result.forEach(item -> {
                String type = item.path("waste_type").asText();
                String date = item.path("date").asText();
                if ("cardboard".equals(type) && cardboard.size() < 3) cardboard.add(date);
                if ("paper".equals(type) && paper.size() < 3) paper.add(date);
            });
        } else {
            log.warn("OpenERZ result missing or not an array");
        }

        List<String> mrgreen = new ArrayList<>();
        JsonNode datesData = mrGreen.path("data");
        if (datesData.isArray() && !datesData.isEmpty()) {
            JsonNode dates = datesData.get(0).path("date");
            if (dates.isArray()) {
                dates.forEach(d -> {
                    if (mrgreen.size() < 3) {
                        try {
                            mrgreen.add(convertGermanDate(d.asText()));
                        } catch (Exception e) {
                            log.warn("Failed to parse Mr. Green date '{}': {}", d.asText(), e.getMessage());
                        }
                    }
                });
            }
        } else {
            log.warn("Mr. Green dates_data missing or empty");
        }

        return new CalendarData(cardboard, paper, mrgreen);
    }

    private String convertGermanDate(String dateStr) {
        // Format: "1. Januar 2024" -> "2024-01-01"
        String[] parts = dateStr.trim().split("\\s+");
        String day = parts[0].replace(".", "").strip();
        String paddedDay = day.length() == 1 ? "0" + day : day;
        String monthNum = GERMAN_MONTHS.getOrDefault(parts[1], "01");
        String year = parts[2].strip();
        return year + "-" + monthNum + "-" + paddedDay;
    }

    public Flux<ServerSentEvent<String>> eventFlux() {
        return Flux.concat(
            dataSink.asFlux().next(),
            Flux.interval(Duration.ofHours(1)).flatMap(tick -> dataSink.asFlux().next())
        ).map(data -> {
            try {
                return ServerSentEvent.<String>builder()
                    .event("calendar")
                    .data(objectMapper.writeValueAsString(data))
                    .build();
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        });
    }
}
