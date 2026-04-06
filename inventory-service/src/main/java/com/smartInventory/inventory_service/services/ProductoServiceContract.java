package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Producto;

import java.util.List;

public interface ProductoServiceContract {
    Producto saveOrUpdate(Producto producto);

    List<Producto> findAll();

    Producto findById(Long id);

    void delete(Long id);
}