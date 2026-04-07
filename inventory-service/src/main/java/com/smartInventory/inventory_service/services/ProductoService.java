package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Producto;
import com.smartInventory.inventory_service.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService implements ProductoServiceContract {
    private final ProductoRepository repository;
    private final AlertFactory alertFactory; // Tu patrón Factory
    private final AutoPurchaseSuggestionService autoPurchaseSuggestionService;

    // CREATE / UPDATE
    @Override
    public Producto saveOrUpdate(Producto producto) {
        if (producto.getId() != null) {
            Producto existente = repository.findById(producto.getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            // El stock actual se administra exclusivamente desde movimientos de inventario.
            producto.setStockActual(existente.getStockActual());
        }

        Producto guardado = repository.save(producto);
        verificarStockYNotificar(guardado);
        return guardado;
    }

    // READ ALL
    @Override
    public List<Producto> findAll() {
        return repository.findAll();
    }

    // READ ONE
    @Override
    public Producto findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    // DELETE
    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }

    // Lógica de Negocio: Verificación de Alerta
    private void verificarStockYNotificar(Producto p) {
        if (p.getStockActual() <= p.getStockMinimo()) {
            // Usamos hilos virtuales de Java 21 para no bloquear el CRUD
            Thread.ofVirtual().start(() -> {
                InventoryAlert alerta = alertFactory.getAlert("AI");
                alerta.notify("Stock crítico detectado", p.getSku());
            });

            try {
                autoPurchaseSuggestionService.generateSuggestionIfNeeded(p);
            } catch (Exception ignored) {
                // No bloquea el CRUD de producto si la sugerencia automática falla.
            }
        }
    }
}
