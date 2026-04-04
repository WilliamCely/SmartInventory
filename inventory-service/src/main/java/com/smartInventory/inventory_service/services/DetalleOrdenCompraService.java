package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.DetalleOrdenCompra;
import com.smartInventory.inventory_service.repositories.DetalleOrdenCompraRepository;
import com.smartInventory.inventory_service.repositories.OrdenCompraAiRepository;
import com.smartInventory.inventory_service.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DetalleOrdenCompraService {

    private final DetalleOrdenCompraRepository repository;
    private final OrdenCompraAiRepository ordenRepository;
    private final ProductoRepository productoRepository;

    public DetalleOrdenCompra saveOrUpdate(DetalleOrdenCompra detalle) {
        if (detalle.getId() != null && !repository.existsById(detalle.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "detalle.id no existe: " + detalle.getId());
        }
        if (detalle.getOrden() == null || detalle.getOrden().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orden.id es obligatorio");
        }
        if (detalle.getProducto() == null || detalle.getProducto().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "producto.id es obligatorio");
        }
        Long ordenId = detalle.getOrden().getId();
        if (!ordenRepository.existsById(ordenId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orden.id no existe: " + ordenId);
        }
        Long productoId = detalle.getProducto().getId();
        if (!productoRepository.existsById(productoId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "producto.id no existe: " + productoId);
        }
        return repository.save(detalle);
    }

    public List<DetalleOrdenCompra> findAll() {
        return repository.findAll();
    }

    public DetalleOrdenCompra findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Detalle de orden no encontrado"));
    }

    public List<DetalleOrdenCompra> findByOrden(Long ordenId) {
        return repository.findByOrdenId(ordenId);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
