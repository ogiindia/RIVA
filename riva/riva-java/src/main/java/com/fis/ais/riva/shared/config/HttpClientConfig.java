package com.fis.ais.riva.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configures HTTP clients for external service calls.
 */
@Configuration
public class HttpClientConfig {

    /**
     * RestClient for synchronous calls to the external case service.
     */
    @Bean
    public RestClient caseServiceRestClient(RivaProperties props) {
        return RestClient.builder()
                .baseUrl(props.caseService().baseUrl())
                .build();
    }
}
