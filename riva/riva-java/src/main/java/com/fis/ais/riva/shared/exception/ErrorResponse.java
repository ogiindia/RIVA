package com.fis.ais.riva.shared.exception;

import java.time.Instant;

/**
 * Standard error response body for all API errors.
 */
public record ErrorResponse(
        int status,
        String error,
        String message,
        Instant timestamp
) {
    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(status, error, message, Instant.now());
    }
}
