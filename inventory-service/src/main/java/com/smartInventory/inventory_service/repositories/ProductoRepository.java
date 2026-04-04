package com.smartInventory.inventory_service.repositories;

import com.smartInventory.inventory_service.models.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findBySku(String sku);

    // Consulta personalizada para el Dashboard de stock bajo
    List<Producto> findByStockActualLessThanEqual(Integer stockMinimo);
}
