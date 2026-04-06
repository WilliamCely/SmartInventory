package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Categoria;

import java.util.List;

public interface CategoriaServiceContract {
    Categoria saveOrUpdate(Categoria categoria);

    List<Categoria> findAll();

    Categoria findById(Long id);

    void delete(Long id);
}