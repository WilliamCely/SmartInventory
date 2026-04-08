package com.smartInventory.import_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder()
                .defaultStatusHandler(
                    HttpStatusCode::isError,
                    (request, response) -> {
                        String body = new String(response.getBody().readAllBytes());
                        throw new RuntimeException("HTTP Error: " + response.getStatusCode() + " - " + body);
                    }
                );
    }
}
