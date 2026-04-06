package com.smartInventory.inventory_service.controllers;

import com.smartInventory.inventory_service.models.DetalleOrdenCompra;
import com.smartInventory.inventory_service.services.DetalleOrdenCompraServiceContract;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory/detalles-orden")
@RequiredArgsConstructor
public class DetalleOrdenCompraController {

    private final DetalleOrdenCompraServiceContract service;

    @GetMapping
    public ResponseEntity<List<DetalleOrdenCompra>> getAll(@RequestParam(required = false) Long ordenId) {
        if (ordenId != null) {
            return ResponseEntity.ok(service.findByOrden(ordenId));
        }
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DetalleOrdenCompra> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<DetalleOrdenCompra> create(@RequestBody DetalleOrdenCompra detalle) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.saveOrUpdate(detalle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DetalleOrdenCompra> update(@PathVariable Long id, @RequestBody DetalleOrdenCompra detalle) {
        detalle.setId(id);
        return ResponseEntity.ok(service.saveOrUpdate(detalle));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
