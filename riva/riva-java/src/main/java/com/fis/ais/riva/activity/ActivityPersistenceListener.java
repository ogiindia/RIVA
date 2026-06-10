package com.fis.ais.riva.activity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Listens for ActivityEvent and persists to the database.
 * Failures are logged but never propagated - activity logging
 * should never break business operations.
 *
 * Additional listeners (metrics, audit export, etc.) can be added
 * as separate @Component classes without modifying this one.
 */
@Component
public class ActivityPersistenceListener {

    private static final Logger log = LoggerFactory.getLogger(ActivityPersistenceListener.class);

    private final ActivityLogRepository repository;

    public ActivityPersistenceListener(ActivityLogRepository repository) {
        this.repository = repository;
    }

    @EventListener
    public void onActivity(ActivityEvent event) {
        try {
            repository.save(ActivityLog.from(event));
            log.debug("Activity logged: userId={} action={} caseId={}",
                    event.userId(), event.action(), event.caseId());
        } catch (Exception ex) {
            log.warn("Failed to persist activity: userId={} action={} - {}",
                    event.userId(), event.action(), ex.getMessage());
        }
    }
}
