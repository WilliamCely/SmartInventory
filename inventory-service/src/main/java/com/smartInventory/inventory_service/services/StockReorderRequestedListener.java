package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Producto;
import com.smartInventory.inventory_service.repositories.ProductoRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Component
public class StockReorderRequestedListener {

    private final ProductoRepository productoRepository;
    private final AutoPurchaseSuggestionService autoPurchaseSuggestionService;

    public StockReorderRequestedListener(
            ProductoRepository productoRepository,
            AutoPurchaseSuggestionService autoPurchaseSuggestionService
    ) {
        this.productoRepository = productoRepository;
        this.autoPurchaseSuggestionService = autoPurchaseSuggestionService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(StockReorderRequestedEvent event) {
        if (event == null || event.productoId() == null) {
            return;
        }

        Producto producto = productoRepository.findById(event.productoId()).orElse(null);
        if (producto != null) {
            autoPurchaseSuggestionService.generateSuggestionIfNeeded(producto);
        }
    }
}