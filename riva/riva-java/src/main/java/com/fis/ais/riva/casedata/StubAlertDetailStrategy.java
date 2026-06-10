package com.fis.ais.riva.casedata;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Stub strategy that returns sample alert details JSON from classpath.
 * Activated when the "stub" profile is active.
 */
@Component
@Profile("stub")
public class StubAlertDetailStrategy implements CaseDataStrategy {

    private static final Logger log = LoggerFactory.getLogger(StubAlertDetailStrategy.class);

    private final String sampleJson;

    public StubAlertDetailStrategy() {
        try (InputStream is = new ClassPathResource("stubs/case-sample.json").getInputStream()) {
            this.sampleJson = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            log.info("StubAlertDetailStrategy loaded sample JSON ({} chars)", sampleJson.length());
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load stubs/case-sample.json", ex);
        }
    }

    @Override
    public String actionType() {
        return AlertDetailStrategy.ACTION_TYPE;
    }

    @Override
    public CaseData fetch(String caseId) {
        log.debug("Stub returning sample alert details for caseId={}", caseId);
        return new CaseData(caseId, AlertDetailStrategy.ACTION_TYPE, sampleJson);
    }
}
