package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.DetalleOrdenCompra;
import com.smartInventory.inventory_service.repositories.DetalleOrdenCompraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DetalleOrdenCompraService {

    private final DetalleOrdenCompraRepository repository;

    public DetalleOrdenCompra saveOrUpdate(DetalleOrdenCompra detalle) {
        return repository.save(detalle);
    }

    public List<DetalleOrdenCompra> findAll() {
        return repository.findAll();
    }

    public DetalleOrdenCompra findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Detalle de orden no encontrado"));
    }

    public List<DetalleOrdenCompra> findByOrden(Long ordenId) {
        return repository.findByOrdenId(ordenId);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
