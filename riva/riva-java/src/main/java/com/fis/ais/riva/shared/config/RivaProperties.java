package com.fis.ais.riva.shared.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Typed configuration properties for the RIVA application.
 * Bound from {@code riva.*} keys in application.yml.
 */
@ConfigurationProperties(prefix = "riva")
public record RivaProperties(
        SessionConfig session,
        CaseServiceConfig caseService,
        ChatConfig chat,
        PromptConfig prompt
) {

    public record SessionConfig(Duration maxAge) {
        public SessionConfig {
            if (maxAge == null) maxAge = Duration.ofHours(8);
        }
    }

    /**
     * Case service configuration. Each external API endpoint is defined
     * as a named sub-property (e.g., alert-details, transaction-history).
     */
    public record CaseServiceConfig(
            String baseUrl,
            Duration timeout,
            EndpointConfig alertDetails
    ) {
        public CaseServiceConfig {
            if (timeout == null) timeout = Duration.ofSeconds(30);
            if (alertDetails == null) {
                alertDetails = new EndpointConfig("/aisefrm/app/v1/getAlertDetailsByCaseId");
            }
        }
    }

    /**
     * Configuration for a single external API endpoint.
     * Add more fields as needed (e.g., headers, auth).
     */
    public record EndpointConfig(String path) {
        public EndpointConfig {
            if (path == null) path = "/";
        }
    }

    public record ChatConfig(int historyWindowPairs) {
        public ChatConfig {
            if (historyWindowPairs <= 0) historyWindowPairs = 3;
        }
    }

    public record PromptConfig(String actionTemplate) {
        public PromptConfig {
            if (actionTemplate == null) actionTemplate = "classpath:prompts/investigate.txt";
        }
    }
}
