package com.smartInventory.import_service.dto.remote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductoDto {
    private Long id;
    private String sku;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private Integer stockActual;
    private Integer stockMinimo;
    private CategoriaDto categoria;
}
