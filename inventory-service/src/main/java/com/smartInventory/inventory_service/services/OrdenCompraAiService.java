package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.EstadoOrdenCompra;
import com.smartInventory.inventory_service.models.OrdenCompraAi;
import com.smartInventory.inventory_service.repositories.OrdenCompraAiRepository;
import com.smartInventory.inventory_service.repositories.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrdenCompraAiService implements OrdenCompraAiServiceContract {

    private final OrdenCompraAiRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    @Override
    public OrdenCompraAi saveOrUpdate(OrdenCompraAi orden) {
        if (orden.getRespuestaRawJson() != null && !orden.getRespuestaRawJson().isBlank()) {
            try {
                // Validate jsonb payload early to avoid database-level 500 errors.
                objectMapper.readTree(orden.getRespuestaRawJson());
            } catch (Exception ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "respuestaRawJson debe ser un JSON valido");
            }
        }

        if (orden.getUsuarioAprobador() != null && orden.getUsuarioAprobador().getId() != null) {
            Long usuarioId = orden.getUsuarioAprobador().getId();
            if (!usuarioRepository.existsById(usuarioId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "usuarioAprobador.id no existe: " + usuarioId);
            }
        }

        // Si es update, conservar los datos originales que no vienen en el payload
        if (orden.getId() != null) {
            var existente = repository.findById(orden.getId());
            if (existente.isPresent()) {
                var dbOrden = existente.get();
                if (orden.getFechaGeneracion() == null) {
                    orden.setFechaGeneracion(dbOrden.getFechaGeneracion());
                }
                if (orden.getPromptUsado() == null) {
                    orden.setPromptUsado(dbOrden.getPromptUsado());
                }
                if (orden.getRespuestaRawJson() == null) {
                    orden.setRespuestaRawJson(dbOrden.getRespuestaRawJson());
                }
                if (orden.getEstado() == null) {
                    orden.setEstado(dbOrden.getEstado());
                }
            }
        }

        return repository.save(orden);
    }

    @Override
    public List<OrdenCompraAi> findAll() {
        return repository.findAll();
    }

    @Override
    public OrdenCompraAi findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden de compra no encontrada"));
    }

    @Override
    public List<OrdenCompraAi> findByEstado(EstadoOrdenCompra estado) {
        return repository.findByEstado(estado);
    }

    @Override
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
