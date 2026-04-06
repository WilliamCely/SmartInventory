package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Usuario;

import java.util.List;

public interface UsuarioServiceContract {
    Usuario saveOrUpdate(Usuario usuario);

    List<Usuario> findAll();

    Usuario findById(Long id);

    void delete(Long id);
}