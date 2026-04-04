package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.EstadoOrdenCompra;
import com.smartInventory.inventory_service.models.OrdenCompraAi;
import com.smartInventory.inventory_service.repositories.OrdenCompraAiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenCompraAiService {

    private final OrdenCompraAiRepository repository;

    public OrdenCompraAi saveOrUpdate(OrdenCompraAi orden) {
        return repository.save(orden);
    }

    public List<OrdenCompraAi> findAll() {
        return repository.findAll();
    }

    public OrdenCompraAi findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden de compra no encontrada"));
    }

    public List<OrdenCompraAi> findByEstado(EstadoOrdenCompra estado) {
        return repository.findByEstado(estado);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
