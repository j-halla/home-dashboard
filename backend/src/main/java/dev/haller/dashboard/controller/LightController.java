package dev.haller.dashboard.controller;

import com.fasterxml.jackson.databind.JsonNode;
import dev.haller.dashboard.model.TriggerLightRequest;
import dev.haller.dashboard.service.LightService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api")
public class LightController {

    private final LightService lightService;

    public LightController(LightService lightService) {
        this.lightService = lightService;
    }

    @PostMapping("/trigger-light")
    public Mono<ResponseEntity<JsonNode>> triggerLight(@RequestBody TriggerLightRequest request) {
        return lightService.triggerLight(request.id(), request.on())
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.ok(null));
    }
}
