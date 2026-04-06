package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.MovimientoInventario;

import java.util.List;

public interface MovimientoInventarioServiceContract {
    MovimientoInventario saveOrUpdate(MovimientoInventario movimiento);

    List<MovimientoInventario> findAll();

    MovimientoInventario findById(Long id);

    List<MovimientoInventario> findByProducto(Long productoId);

    void delete(Long id);
}