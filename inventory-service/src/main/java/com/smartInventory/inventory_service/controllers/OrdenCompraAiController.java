package com.smartInventory.inventory_service.controllers;

import com.smartInventory.inventory_service.models.EstadoOrdenCompra;
import com.smartInventory.inventory_service.models.OrdenCompraAi;
import com.smartInventory.inventory_service.services.OrdenCompraAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory/ordenes-compra")
@RequiredArgsConstructor
public class OrdenCompraAiController {

    private final OrdenCompraAiService service;

    @GetMapping
    public ResponseEntity<List<OrdenCompraAi>> getAll(@RequestParam(required = false) EstadoOrdenCompra estado) {
        if (estado != null) {
            return ResponseEntity.ok(service.findByEstado(estado));
        }
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdenCompraAi> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<OrdenCompraAi> create(@RequestBody OrdenCompraAi orden) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.saveOrUpdate(orden));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrdenCompraAi> update(@PathVariable Long id, @RequestBody OrdenCompraAi orden) {
        orden.setId(id);
        return ResponseEntity.ok(service.saveOrUpdate(orden));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
