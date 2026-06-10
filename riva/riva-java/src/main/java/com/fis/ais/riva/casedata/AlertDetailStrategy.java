package com.fis.ais.riva.casedata;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fis.ais.riva.shared.config.RivaProperties;
import com.fis.ais.riva.shared.exception.ExternalServiceException;

/**
 * Fetches alert details from the external case service via REST POST.
 * Only active when the "stub" profile is NOT active.
 */
@Component
@Profile("!stub")
public class AlertDetailStrategy implements CaseDataStrategy {

    public static final String ACTION_TYPE = "alert-details";

    private static final Logger log = LoggerFactory.getLogger(AlertDetailStrategy.class);

    private final RestClient restClient;
    private final RivaProperties properties;

    public AlertDetailStrategy(RestClient caseServiceRestClient, RivaProperties properties) {
        this.restClient = caseServiceRestClient;
        this.properties = properties;
    }

    @Override
    public String actionType() {
        return ACTION_TYPE;
    }

    @Override
    public CaseData fetch(String caseId) {
        String path = properties.caseService().alertDetails().path();
        log.info("Fetching alert details: caseId={} POST {}", caseId, path);

        try {
            String rawJson = restClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("caseId", caseId))
                    .retrieve()
                    .body(String.class);

            if (rawJson == null || rawJson.isBlank()) {
                throw new ExternalServiceException("Empty response from alert details service for caseId=" + caseId);
            }

            return new CaseData(caseId, ACTION_TYPE, rawJson);
        } catch (RestClientException ex) {
            throw new ExternalServiceException(
                    "Failed to fetch alert details for caseId=" + caseId + ": " + ex.getMessage(), ex);
        }
    }
}
