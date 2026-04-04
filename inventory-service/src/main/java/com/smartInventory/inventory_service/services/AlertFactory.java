package com.smartInventory.inventory_service.services;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AlertFactory {

    private final List<InventoryAlert> alerts;

    public AlertFactory(List<InventoryAlert> alerts) {
        this.alerts = alerts;
    }

    public InventoryAlert getAlert(String type) {
        return alerts.stream()
                .filter(alert -> alert.supports(type))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No alert implementation found for type: " + type));
    }
}
