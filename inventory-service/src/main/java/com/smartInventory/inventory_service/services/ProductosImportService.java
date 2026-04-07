package com.smartInventory.inventory_service.services;

import com.smartInventory.inventory_service.dto.imports.ImportRowError;
import com.smartInventory.inventory_service.dto.imports.ProductosImportResult;
import com.smartInventory.inventory_service.models.Categoria;
import com.smartInventory.inventory_service.models.Producto;
import com.smartInventory.inventory_service.repositories.CategoriaRepository;
import com.smartInventory.inventory_service.repositories.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductosImportService {

    private static final Set<String> REQUIRED_HEADERS = Set.of(
            "sku",
            "nombre",
            "precio",
            "stock_actual",
            "stock_minimo",
            "categoria"
    );

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    @Transactional
    public ProductosImportResult importCsv(MultipartFile file, boolean dryRun) {
        List<ImportRowError> errors = new ArrayList<>();

        int totalRows = 0;
        int processedRows = 0;
        int createdProductos = 0;
        int updatedProductos = 0;
        int createdCategorias = 0;

        if (file == null || file.isEmpty()) {
            errors.add(ImportRowError.builder()
                    .row(0)
                    .message("Archivo vacío o no proporcionado")
                    .build());
            return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias, errors);
        }

        Set<String> seenSkus = new HashSet<>();
        Map<String, Categoria> categoriasCache = new HashMap<>();

        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreEmptyLines(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            validarHeaders(parser.getHeaderMap(), errors);
            if (!errors.isEmpty()) {
                return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias, errors);
            }

            for (CSVRecord record : parser) {
                totalRows++;
                long rowNumber = record.getRecordNumber() + 1;

                try {
                    String sku = required(record, "sku");
                    String nombre = required(record, "nombre");
                    BigDecimal precio = parseBigDecimal(required(record, "precio"));
                    Integer stockActual = parseInteger(required(record, "stock_actual"));
                    Integer stockMinimo = parseInteger(required(record, "stock_minimo"));
                    String categoriaNombre = required(record, "categoria");
                    String descripcion = optional(record, "descripcion");
                    String categoriaDescripcion = optional(record, "categoria_descripcion");

                    if (!seenSkus.add(sku.toLowerCase(Locale.ROOT))) {
                        throw new IllegalArgumentException("SKU duplicado dentro del archivo: " + sku);
                    }
                    if (stockActual < 0 || stockMinimo < 0) {
                        throw new IllegalArgumentException("stock_actual y stock_minimo deben ser >= 0");
                    }
                    if (precio.signum() < 0) {
                        throw new IllegalArgumentException("precio debe ser >= 0");
                    }

                    Categoria categoria = resolveCategoria(categoriaNombre, categoriaDescripcion, categoriasCache, dryRun);
                    if (categoria != null && categoria.getId() == null) {
                        createdCategorias++;
                    }

                    Optional<Producto> existing = productoRepository.findBySku(sku);
                    Producto producto = existing.orElseGet(Producto::new);

                    producto.setSku(sku);
                    producto.setNombre(nombre);
                    producto.setDescripcion(descripcion);
                    producto.setPrecio(precio);
                    producto.setStockActual(stockActual);
                    producto.setStockMinimo(stockMinimo);
                    producto.setCategoria(categoria);

                    if (existing.isPresent()) {
                        updatedProductos++;
                    } else {
                        createdProductos++;
                    }

                    if (!dryRun) {
                        if (categoria != null && categoria.getId() == null) {
                            categoria = categoriaRepository.save(categoria);
                            categoriasCache.put(categoriaNombre.toLowerCase(Locale.ROOT), categoria);
                            producto.setCategoria(categoria);
                        }
                        productoRepository.save(producto);
                    }

                    processedRows++;
                } catch (Exception ex) {
                    errors.add(ImportRowError.builder()
                            .row(rowNumber)
                            .sku(optional(record, "sku"))
                            .message(ex.getMessage())
                            .build());
                }
            }
        } catch (Exception ex) {
            errors.add(ImportRowError.builder()
                    .row(0)
                    .message("No se pudo procesar el archivo CSV: " + ex.getMessage())
                    .build());
        }

        return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias, errors);
    }

    private void validarHeaders(Map<String, Integer> headerMap, List<ImportRowError> errors) {
        Set<String> normalized = new HashSet<>();
        for (String key : headerMap.keySet()) {
            normalized.add(key.toLowerCase(Locale.ROOT));
        }

        for (String required : REQUIRED_HEADERS) {
            if (!normalized.contains(required)) {
                errors.add(ImportRowError.builder()
                        .row(0)
                        .message("Falta la columna requerida: " + required)
                        .build());
            }
        }
    }

    private Categoria resolveCategoria(
            String nombre,
            String descripcion,
            Map<String, Categoria> cache,
            boolean dryRun
    ) {
        String key = nombre.toLowerCase(Locale.ROOT);

        if (cache.containsKey(key)) {
            return cache.get(key);
        }

        Optional<Categoria> existing = categoriaRepository.findByNombre(nombre);
        if (existing.isPresent()) {
            cache.put(key, existing.get());
            return existing.get();
        }

        Categoria nueva = Categoria.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .build();

        cache.put(key, nueva);

        if (!dryRun) {
            return nueva;
        }
        return nueva;
    }

    private ProductosImportResult buildResult(
            boolean dryRun,
            int totalRows,
            int processedRows,
            int createdProductos,
            int updatedProductos,
            int createdCategorias,
            List<ImportRowError> errors
    ) {
        return ProductosImportResult.builder()
                .dryRun(dryRun)
                .totalRows(totalRows)
                .processedRows(processedRows)
                .createdProductos(createdProductos)
                .updatedProductos(updatedProductos)
                .createdCategorias(createdCategorias)
                .errors(errors)
                .build();
    }

    private String required(CSVRecord record, String header) {
        String value = optional(record, header);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Columna " + header + " es obligatoria");
        }
        return value.trim();
    }

    private String optional(CSVRecord record, String header) {
        if (!record.isMapped(header)) {
            return null;
        }
        return record.get(header);
    }

    private Integer parseInteger(String value) {
        try {
            return Integer.parseInt(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Valor entero inválido: " + value);
        }
    }

    private BigDecimal parseBigDecimal(String value) {
        try {
            return new BigDecimal(value.trim());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Valor decimal inválido: " + value);
        }
    }
}
