package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Usuario;
import com.smartInventory.inventory_service.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService implements UsuarioServiceContract {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    private boolean isBcryptHash(String value) {
        return value != null && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }

    @Override
    public Usuario saveOrUpdate(Usuario usuario) {
        if (usuario.getPasswordHash() != null && !usuario.getPasswordHash().isBlank() && !isBcryptHash(usuario.getPasswordHash())) {
            usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        }
        return repository.save(usuario);
    }

    @Override
    public List<Usuario> findAll() {
        return repository.findAll();
    }

    @Override
    public Usuario findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
