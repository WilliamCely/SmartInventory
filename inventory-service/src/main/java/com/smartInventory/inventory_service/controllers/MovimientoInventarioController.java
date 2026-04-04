package com.smartInventory.inventory_service.controllers;

import com.smartInventory.inventory_service.models.MovimientoInventario;
import com.smartInventory.inventory_service.services.MovimientoInventarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory/movimientos")
@RequiredArgsConstructor
public class MovimientoInventarioController {

    private final MovimientoInventarioService service;

    @GetMapping
    public ResponseEntity<List<MovimientoInventario>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovimientoInventario> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<MovimientoInventario>> getByProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(service.findByProducto(productoId));
    }

    @PostMapping
    public ResponseEntity<MovimientoInventario> create(@RequestBody MovimientoInventario movimiento) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.saveOrUpdate(movimiento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovimientoInventario> update(@PathVariable Long id, @RequestBody MovimientoInventario movimiento) {
        movimiento.setId(id);
        return ResponseEntity.ok(service.saveOrUpdate(movimiento));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
