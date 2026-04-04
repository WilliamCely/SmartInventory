package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.MovimientoInventario;
import com.smartInventory.inventory_service.repositories.MovimientoInventarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoInventarioService {

    private final MovimientoInventarioRepository repository;

    public MovimientoInventario saveOrUpdate(MovimientoInventario movimiento) {
        return repository.save(movimiento);
    }

    public List<MovimientoInventario> findAll() {
        return repository.findAll();
    }

    public MovimientoInventario findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));
    }

    public List<MovimientoInventario> findByProducto(Long productoId) {
        return repository.findByProductoIdOrderByFechaDesc(productoId);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
