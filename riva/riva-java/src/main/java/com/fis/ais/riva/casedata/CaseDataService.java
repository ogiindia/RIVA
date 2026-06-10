package com.fis.ais.riva.casedata;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fis.ais.riva.shared.exception.ExternalServiceException;

/**
 * Orchestrator that dispatches case data requests to the appropriate
 * {@link CaseDataStrategy} based on action type.
 *
 * All strategies are auto-discovered via Spring dependency injection.
 * To add a new data source, simply implement {@link CaseDataStrategy}
 * and register it as a Spring bean.
 */
@Service
public class CaseDataService {

    private static final Logger log = LoggerFactory.getLogger(CaseDataService.class);

    private final Map<String, CaseDataStrategy> strategies;

    public CaseDataService(List<CaseDataStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(CaseDataStrategy::actionType, Function.identity()));
        log.info("Registered {} case data strategies: {}", strategies.size(), strategies.keySet());
    }

    /**
     * Fetch case data using a specific strategy.
     *
     * @param caseId     the case identifier
     * @param actionType the strategy to use (e.g., "alert-details")
     * @return the fetched case data
     * @throws IllegalArgumentException if no strategy found for the action type
     * @throws ExternalServiceException if the external call fails
     */
    public CaseData fetch(String caseId, String actionType) {
        CaseDataStrategy strategy = strategies.get(actionType);
        if (strategy == null) {
            throw new IllegalArgumentException(
                    "No case data strategy registered for action type: " + actionType
                    + ". Available: " + strategies.keySet());
        }
        log.debug("Dispatching fetch: caseId={} actionType={} strategy={}",
                caseId, actionType, strategy.getClass().getSimpleName());
        return strategy.fetch(caseId);
    }

    /**
     * Fetch case data using the default strategy ("alert-details").
     */
    public CaseData fetch(String caseId) {
        return fetch(caseId, AlertDetailStrategy.ACTION_TYPE);
    }

    /**
     * Fetch data from multiple strategies and return all results.
     */
    public List<CaseData> fetchMultiple(String caseId, List<String> actionTypes) {
        return actionTypes.stream()
                .map(type -> fetch(caseId, type))
                .toList();
    }

    /**
     * @return all registered action types
     */
    public java.util.Set<String> availableActionTypes() {
        return strategies.keySet();
    }
}
