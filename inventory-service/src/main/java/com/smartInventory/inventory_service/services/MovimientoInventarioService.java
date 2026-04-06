package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.MovimientoInventario;
import com.smartInventory.inventory_service.repositories.MovimientoInventarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoInventarioService implements MovimientoInventarioServiceContract {

    private final MovimientoInventarioRepository repository;

    @Override
    public MovimientoInventario saveOrUpdate(MovimientoInventario movimiento) {
        return repository.save(movimiento);
    }

    @Override
    public List<MovimientoInventario> findAll() {
        return repository.findAll();
    }

    @Override
    public MovimientoInventario findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));
    }

    @Override
    public List<MovimientoInventario> findByProducto(Long productoId) {
        return repository.findByProductoIdOrderByFechaDesc(productoId);
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
