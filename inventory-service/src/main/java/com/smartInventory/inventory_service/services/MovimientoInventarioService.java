package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.models.MovimientoInventario;
import com.smartInventory.inventory_service.models.Producto;
import com.smartInventory.inventory_service.models.TipoMovimiento;
import com.smartInventory.inventory_service.repositories.MovimientoInventarioRepository;
import com.smartInventory.inventory_service.repositories.ProductoRepository;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class MovimientoInventarioService implements MovimientoInventarioServiceContract {

    private final MovimientoInventarioRepository repository;
    private final ProductoRepository productoRepository;
    private final AutoPurchaseSuggestionService autoPurchaseSuggestionService;

    @Override
    @Transactional
    public MovimientoInventario saveOrUpdate(MovimientoInventario movimiento) {
        validarMovimiento(movimiento);

        if (movimiento.getId() == null) {
            Producto producto = obtenerProducto(movimiento.getProducto().getId());
            aplicarDelta(producto, delta(movimiento.getTipo(), movimiento.getCantidad()));
            productoRepository.save(producto);
            generarSugerenciaAutomatica(producto);
            return repository.save(movimiento);
        }

        MovimientoInventario actual = repository.findById(movimiento.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimiento no encontrado"));

        Map<Long, Integer> deltasPorProducto = new HashMap<>();
        acumularDelta(deltasPorProducto, actual.getProducto().getId(), -delta(actual.getTipo(), actual.getCantidad()));
        acumularDelta(deltasPorProducto, movimiento.getProducto().getId(), delta(movimiento.getTipo(), movimiento.getCantidad()));

        for (Map.Entry<Long, Integer> entry : deltasPorProducto.entrySet()) {
            if (entry.getValue() == 0) {
                continue;
            }
            Producto producto = obtenerProducto(entry.getKey());
            aplicarDelta(producto, entry.getValue());
            productoRepository.save(producto);
            generarSugerenciaAutomatica(producto);
        }

        return repository.save(movimiento);
    }

    @Override
    public List<MovimientoInventario> findAll() {
        return repository.findAll();
    }

    @Override
    public MovimientoInventario findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));
    }

    @Override
    public List<MovimientoInventario> findByProducto(Long productoId) {
        return repository.findByProductoIdOrderByFechaDesc(productoId);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MovimientoInventario movimiento = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movimiento no encontrado"));

        Producto producto = obtenerProducto(movimiento.getProducto().getId());
        aplicarDelta(producto, -delta(movimiento.getTipo(), movimiento.getCantidad()));
        productoRepository.save(producto);
        generarSugerenciaAutomatica(producto);

        repository.delete(movimiento);
    }

    private void validarMovimiento(MovimientoInventario movimiento) {
        if (movimiento.getProducto() == null || movimiento.getProducto().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "producto.id es obligatorio");
        }
        if (movimiento.getUsuario() == null || movimiento.getUsuario().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "usuario.id es obligatorio");
        }
        if (movimiento.getTipo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipo de movimiento es obligatorio");
        }
        if (movimiento.getCantidad() == null || movimiento.getCantidad() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cantidad debe ser mayor que cero");
        }
    }

    private Producto obtenerProducto(Long productoId) {
        return productoRepository.findById(productoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "producto.id no existe: " + productoId));
    }

    private int delta(TipoMovimiento tipo, Integer cantidad) {
        return tipo == TipoMovimiento.ENTRADA ? cantidad : -cantidad;
    }

    private void acumularDelta(Map<Long, Integer> deltas, Long productoId, int delta) {
        deltas.put(productoId, deltas.getOrDefault(productoId, 0) + delta);
    }

    private void aplicarDelta(Producto producto, int delta) {
        int stockActual = producto.getStockActual() == null ? 0 : producto.getStockActual();
        int nuevoStock = stockActual + delta;
        if (nuevoStock < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El stock de " + producto.getNombre() + " no puede quedar en negativo"
            );
        }
        producto.setStockActual(nuevoStock);
        log.debug("Stock ajustado para producto {}: {} -> {}", producto.getSku(), stockActual, nuevoStock);
    }

    private void generarSugerenciaAutomatica(Producto producto) {
        try {
            autoPurchaseSuggestionService.generateSuggestionIfNeeded(producto);
        } catch (Exception ex) {
            log.warn("No se pudo generar sugerencia automática para SKU {}: {}", producto.getSku(), ex.getMessage());
        }
    }
}
