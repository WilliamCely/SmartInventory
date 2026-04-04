package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Usuario;
import com.smartInventory.inventory_service.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;

    public Usuario saveOrUpdate(Usuario usuario) {
        return repository.save(usuario);
    }

    public List<Usuario> findAll() {
        return repository.findAll();
    }

    public Usuario findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
