package com.fis.ais.riva.activity;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
}
