package com.smartInventory.import_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductosImportResult {
    private boolean dryRun;
    private int totalRows;
    private int processedRows;
    private int createdProductos;
    private int updatedProductos;
    private int createdCategorias;
    private List<ImportRowError> errors;
}
