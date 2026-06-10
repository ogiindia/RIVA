package com.fis.ais.riva.session;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
@Validated
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    public record CreateSessionRequest(@NotBlank String userId) {}

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSession(
            @Validated @RequestBody CreateSessionRequest request) {

        var session = sessionService.getOrCreate(request.userId());

        return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "userId", session.getUserId()
        ));
    }
}
