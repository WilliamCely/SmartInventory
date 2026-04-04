package com.smartInventory.inventory_service.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AIInventoryAlert implements InventoryAlert {

    @Override
    public boolean supports(String alertType) {
        return "AI".equalsIgnoreCase(alertType);
    }

    @Override
    public void notify(String message, String sku) {
        log.warn("[AI ALERT] {} - SKU: {}", message, sku);
    }
}
