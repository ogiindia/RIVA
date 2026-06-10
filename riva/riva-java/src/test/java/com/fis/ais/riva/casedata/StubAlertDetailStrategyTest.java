package com.fis.ais.riva.casedata;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StubAlertDetailStrategyTest {

    @Test
    void returnsSampleJson() {
        StubAlertDetailStrategy strategy = new StubAlertDetailStrategy();

        CaseData data = strategy.fetch("any-case-id");

        assertThat(data.caseId()).isEqualTo("any-case-id");
        assertThat(data.actionType()).isEqualTo(AlertDetailStrategy.ACTION_TYPE);
        assertThat(data.rawJson()).contains("\"caseId\"");
        assertThat(data.rawJson()).contains("d99c9cc0-7f4a-4318-aaa4-b3bc2f618337");
        assertThat(data.rawJson()).contains("UPI CUMM 60K APP 5 MIN");
    }

    @Test
    void returnsSameJsonForDifferentCaseIds() {
        StubAlertDetailStrategy strategy = new StubAlertDetailStrategy();

        CaseData d1 = strategy.fetch("case-1");
        CaseData d2 = strategy.fetch("case-2");

        assertThat(d1.rawJson()).isEqualTo(d2.rawJson());
        assertThat(d1.caseId()).isEqualTo("case-1");
        assertThat(d2.caseId()).isEqualTo("case-2");
    }

    @Test
    void hasCorrectActionType() {
        StubAlertDetailStrategy strategy = new StubAlertDetailStrategy();
        assertThat(strategy.actionType()).isEqualTo("alert-details");
    }
}
