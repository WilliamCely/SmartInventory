package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.EstadoOrdenCompra;
import com.smartInventory.inventory_service.models.OrdenCompraAi;

import java.util.List;

public interface OrdenCompraAiServiceContract {
    OrdenCompraAi saveOrUpdate(OrdenCompraAi orden);

    List<OrdenCompraAi> findAll();

    OrdenCompraAi findById(Long id);

    List<OrdenCompraAi> findByEstado(EstadoOrdenCompra estado);

    void delete(Long id);
}