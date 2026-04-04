package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Producto;
import com.smartInventory.inventory_service.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {
    private final ProductoRepository repository;
    private final AlertFactory alertFactory; // Tu patrón Factory

    // CREATE / UPDATE
    public Producto saveOrUpdate(Producto producto) {
        Producto guardado = repository.save(producto);
        verificarStockYNotificar(guardado);
        return guardado;
    }

    // READ ALL
    public List<Producto> findAll() {
        return repository.findAll();
    }

    // READ ONE
    public Producto findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    // DELETE
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
        }
    }
}
