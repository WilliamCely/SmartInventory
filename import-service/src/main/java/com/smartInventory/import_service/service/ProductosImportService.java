package com.smartInventory.import_service.service;

import com.smartInventory.import_service.client.InventoryApiClient;
import com.smartInventory.import_service.dto.ImportRowError;
import com.smartInventory.import_service.dto.ProductosImportResult;
import com.smartInventory.import_service.dto.remote.CategoriaDto;
import com.smartInventory.import_service.dto.remote.MovimientoCreateRequest;
import com.smartInventory.import_service.dto.remote.ProductoDto;
import com.smartInventory.import_service.dto.remote.UsuarioDto;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
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
import java.util.concurrent.atomic.AtomicInteger;

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

    private final InventoryApiClient inventoryApiClient;

    public ProductosImportResult importCsv(MultipartFile file, boolean dryRun, String authorizationHeader) {
        List<ImportRowError> errors = new ArrayList<>();

        int totalRows = 0;
        int processedRows = 0;
        int createdProductos = 0;
        int updatedProductos = 0;
        AtomicInteger createdCategorias = new AtomicInteger(0);

        if (file == null || file.isEmpty()) {
            errors.add(ImportRowError.builder()
                    .row(0)
                    .message("Archivo vacío o no proporcionado")
                    .build());
            return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias.get(), errors);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication == null ? null : authentication.getName();
        
        Long currentUserId;
        try {
            currentUserId = resolveCurrentUserId(username, authorizationHeader);
        } catch (Exception ex) {
            errors.add(ImportRowError.builder()
                    .row(0)
                    .message("Error al resolver usuario autenticado: " + ex.getMessage())
                    .build());
            return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias.get(), errors);
        }

        Set<String> seenSkus = new HashSet<>();
        Map<String, CategoriaDto> categoriasCache = new HashMap<>();
        Map<String, ProductoDto> productosCache = new HashMap<>();

        try {
            inventoryApiClient.getProductos(authorizationHeader).forEach(producto -> productosCache.put(normalize(producto.getSku()), producto));
        } catch (Exception ex) {
            errors.add(ImportRowError.builder()
                    .row(0)
                    .message("Error al obtener productos existentes: " + ex.getMessage())
                    .build());
        }
        
        try {
            inventoryApiClient.getCategorias(authorizationHeader).forEach(categoria -> categoriasCache.put(normalize(categoria.getNombre()), categoria));
        } catch (Exception ex) {
            errors.add(ImportRowError.builder()
                    .row(0)
                    .message("Error al obtener categorías existentes: " + ex.getMessage())
                    .build());
        }

        if (!errors.isEmpty()) {
            return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias.get(), errors);
        }

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
                return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias.get(), errors);
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

                    if (!seenSkus.add(normalize(sku))) {
                        throw new IllegalArgumentException("SKU duplicado dentro del archivo: " + sku);
                    }
                    if (stockActual < 0 || stockMinimo < 0) {
                        throw new IllegalArgumentException("stock_actual y stock_minimo deben ser >= 0");
                    }
                    if (precio.signum() < 0) {
                        throw new IllegalArgumentException("precio debe ser >= 0");
                    }

                    ProductoDto existing = productosCache.get(normalize(sku));
                    CategoriaDto categoria = resolveCategoria(categoriaNombre, categoriaDescripcion, categoriasCache, dryRun, authorizationHeader, createdCategorias);

                    ProductoDto payload = ProductoDto.builder()
                            .id(existing == null ? null : existing.getId())
                            .sku(sku)
                            .nombre(nombre)
                            .descripcion(descripcion)
                            .precio(precio)
                            .stockActual(stockActual)
                            .stockMinimo(stockMinimo)
                            .categoria(categoria)
                            .build();

                    if (existing == null) {
                        createdProductos++;
                        if (!dryRun) {
                            ProductoDto created = inventoryApiClient.createProducto(payload, authorizationHeader);
                            productosCache.put(normalize(created.getSku()), created);
                        }
                    } else {
                        updatedProductos++;
                        if (!dryRun) {
                            ProductoDto updated = inventoryApiClient.updateProducto(existing.getId(), payload, authorizationHeader);
                            productosCache.put(normalize(updated.getSku()), updated);

                            ajustarStockSiEsNecesario(updated, stockActual, currentUserId, authorizationHeader);
                        }
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

        return buildResult(dryRun, totalRows, processedRows, createdProductos, updatedProductos, createdCategorias.get(), errors);
    }

    private void ajustarStockSiEsNecesario(ProductoDto producto, Integer stockObjetivo, Long usuarioId, String authorizationHeader) {
        Integer stockActual = producto.getStockActual() == null ? 0 : producto.getStockActual();
        int delta = stockObjetivo - stockActual;
        if (delta == 0) {
            return;
        }

        MovimientoCreateRequest movimiento = MovimientoCreateRequest.builder()
                .producto(MovimientoCreateRequest.Ref.builder().id(producto.getId()).build())
                .usuario(MovimientoCreateRequest.Ref.builder().id(usuarioId).build())
                .tipo(delta > 0 ? "ENTRADA" : "SALIDA")
                .cantidad(Math.abs(delta))
                .build();

        inventoryApiClient.createMovimiento(movimiento, authorizationHeader);
    }

    private Long resolveCurrentUserId(String username, String authorizationHeader) {
        if (username == null || username.isBlank()) {
            throw new IllegalStateException("No se pudo resolver el usuario autenticado");
        }

        Optional<UsuarioDto> usuario = inventoryApiClient.getUsuarios(authorizationHeader).stream()
                .filter(u -> username.equalsIgnoreCase(u.getUsername()))
                .findFirst();

        return usuario.map(UsuarioDto::getId)
                .orElseThrow(() -> new IllegalStateException("No se encontró un usuario operativo para: " + username));
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

    private CategoriaDto resolveCategoria(
            String nombre,
            String descripcion,
            Map<String, CategoriaDto> cache,
            boolean dryRun,
                String authorizationHeader,
                AtomicInteger createdCategorias
    ) {
        String key = normalize(nombre);

        if (cache.containsKey(key)) {
            return cache.get(key);
        }

        CategoriaDto nueva = CategoriaDto.builder()
                .nombre(nombre)
                .descripcion(descripcion)
                .build();

        createdCategorias.incrementAndGet();

        if (!dryRun) {
            nueva = inventoryApiClient.createCategoria(nueva, authorizationHeader);
        }

        cache.put(key, nueva);
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

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
