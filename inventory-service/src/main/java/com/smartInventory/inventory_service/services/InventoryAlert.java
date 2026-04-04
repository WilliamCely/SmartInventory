package com.smartInventory.inventory_service.services;

public interface InventoryAlert {

    boolean supports(String alertType);

    void notify(String message, String sku);
}
