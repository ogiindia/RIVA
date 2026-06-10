package com.fis.ais.riva.casedata;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CaseDataServiceTest {

    CaseDataService service;
    StubAlertDetailStrategy stubStrategy;

    @BeforeEach
    void setUp() {
        stubStrategy = new StubAlertDetailStrategy();
        service = new CaseDataService(List.of(stubStrategy));
    }

    @Test
    void fetchWithDefaultActionType() {
        CaseData data = service.fetch("case-123");

        assertThat(data.caseId()).isEqualTo("case-123");
        assertThat(data.actionType()).isEqualTo("alert-details");
        assertThat(data.rawJson()).contains("UPI CUMM 60K APP 5 MIN");
    }

    @Test
    void fetchWithExplicitActionType() {
        CaseData data = service.fetch("case-123", "alert-details");

        assertThat(data.caseId()).isEqualTo("case-123");
        assertThat(data.actionType()).isEqualTo("alert-details");
    }

    @Test
    void throwsOnUnknownActionType() {
        assertThatThrownBy(() -> service.fetch("case-123", "nonexistent"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No case data strategy registered for action type: nonexistent");
    }

    @Test
    void availableActionTypesReturnsRegistered() {
        assertThat(service.availableActionTypes()).containsExactly("alert-details");
    }

    @Test
    void fetchMultipleReturnsAllResults() {
        List<CaseData> results = service.fetchMultiple("case-123", List.of("alert-details"));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).actionType()).isEqualTo("alert-details");
    }
}
