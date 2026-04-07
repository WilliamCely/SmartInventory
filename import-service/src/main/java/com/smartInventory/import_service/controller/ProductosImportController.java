package com.smartInventory.import_service.controller;

import com.smartInventory.import_service.dto.ProductosImportResult;
import com.smartInventory.import_service.service.ProductosImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
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
            @RequestParam(defaultValue = "true") boolean dryRun,
            @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader
    ) {
        return ResponseEntity.ok(importService.importCsv(file, dryRun, authorizationHeader));
    }
}
