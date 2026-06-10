package com.fis.ais.riva.casedata;

/**
 * Strategy interface for fetching case-related data from external services.
 *
 * Each implementation handles a specific data source (alert details,
 * transaction history, customer profile, etc.). New data sources are
 * added by implementing this interface and registering as a Spring bean.
 *
 * The {@link CaseDataService} discovers all strategies automatically
 * and dispatches by action type.
 */
public interface CaseDataStrategy {

    /**
     * The action type this strategy handles (e.g., "alert-details",
     * "transaction-history"). Must be unique across all strategies.
     */
    String actionType();

    /**
     * Fetch data for the given case ID.
     *
     * @param caseId the case identifier
     * @return case data with the raw JSON response
     * @throws com.fis.ais.riva.shared.exception.ExternalServiceException on failure
     */
    CaseData fetch(String caseId);
}
