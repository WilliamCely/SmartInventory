package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.Categoria;
import com.smartInventory.inventory_service.repositories.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repository;

    public Categoria saveOrUpdate(Categoria categoria) {
        return repository.save(categoria);
    }

    public List<Categoria> findAll() {
        return repository.findAll();
    }

    public Categoria findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria no encontrada"));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
