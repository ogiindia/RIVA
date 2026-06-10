package com.fis.ais.riva.casedata;

/**
 * Data returned by a {@link CaseDataStrategy}.
 *
 * @param caseId     the case identifier
 * @param actionType which strategy produced this data
 * @param rawJson    the raw JSON response from the external service
 */
public record CaseData(
        String caseId,
        String actionType,
        String rawJson
) {}
