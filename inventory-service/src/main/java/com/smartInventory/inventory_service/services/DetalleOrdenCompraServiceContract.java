package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.DetalleOrdenCompra;

import java.util.List;

public interface DetalleOrdenCompraServiceContract {
    DetalleOrdenCompra saveOrUpdate(DetalleOrdenCompra detalle);

    List<DetalleOrdenCompra> findAll();

    DetalleOrdenCompra findById(Long id);

    List<DetalleOrdenCompra> findByOrden(Long ordenId);

    void delete(Long id);
}