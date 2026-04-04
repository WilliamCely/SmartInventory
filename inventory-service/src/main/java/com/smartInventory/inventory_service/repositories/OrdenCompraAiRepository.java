package com.smartInventory.inventory_service.repositories;

import com.smartInventory.inventory_service.models.EstadoOrdenCompra;
import com.smartInventory.inventory_service.models.OrdenCompraAi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdenCompraAiRepository extends JpaRepository<OrdenCompraAi, Long> {
    List<OrdenCompraAi> findByEstado(EstadoOrdenCompra estado);
}
