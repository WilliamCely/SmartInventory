package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.EstadoOrdenCompra;
import com.smartInventory.inventory_service.models.OrdenCompraAi;
import com.smartInventory.inventory_service.repositories.OrdenCompraAiRepository;
import com.smartInventory.inventory_service.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenCompraAiService {

    private final OrdenCompraAiRepository repository;
    private final UsuarioRepository usuarioRepository;

    public OrdenCompraAi saveOrUpdate(OrdenCompraAi orden) {
        if (orden.getUsuarioAprobador() != null && orden.getUsuarioAprobador().getId() != null) {
            Long usuarioId = orden.getUsuarioAprobador().getId();
            if (!usuarioRepository.existsById(usuarioId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "usuarioAprobador.id no existe: " + usuarioId);
            }
        }
        return repository.save(orden);
    }

    public List<OrdenCompraAi> findAll() {
        return repository.findAll();
    }

    public OrdenCompraAi findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden de compra no encontrada"));
    }

    public List<OrdenCompraAi> findByEstado(EstadoOrdenCompra estado) {
        return repository.findByEstado(estado);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
