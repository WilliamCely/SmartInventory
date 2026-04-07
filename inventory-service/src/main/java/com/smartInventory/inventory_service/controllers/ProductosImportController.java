package com.smartInventory.inventory_service.controllers;

import com.smartInventory.inventory_service.dto.imports.ProductosImportResult;
import com.smartInventory.inventory_service.services.ProductosImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/inventory/import")
@RequiredArgsConstructor
public class ProductosImportController {

    private final ProductosImportService importService;

    @PostMapping(value = "/productos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductosImportResult> importProductos(
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "true") boolean dryRun
    ) {
        return ResponseEntity.ok(importService.importCsv(file, dryRun));
    }
}
