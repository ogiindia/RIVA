package com.fis.ais.riva;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.fis.ais.riva.shared.config.RivaProperties;

@SpringBootApplication
@EnableConfigurationProperties(RivaProperties.class)
public class AisRivaApplication {

    public static void main(String[] args) {
        SpringApplication.run(AisRivaApplication.class, args);
    }
}
