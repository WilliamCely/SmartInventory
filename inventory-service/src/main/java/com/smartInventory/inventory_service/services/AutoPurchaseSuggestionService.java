package com.smartInventory.inventory_service.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartInventory.inventory_service.models.DetalleOrdenCompra;
import com.smartInventory.inventory_service.models.EstadoOrdenCompra;
import com.smartInventory.inventory_service.models.OrdenCompraAi;
import com.smartInventory.inventory_service.models.Producto;
import com.smartInventory.inventory_service.repositories.DetalleOrdenCompraRepository;
import com.smartInventory.inventory_service.repositories.OrdenCompraAiRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Slf4j
public class AutoPurchaseSuggestionService {

    private final OrdenCompraAiRepository ordenCompraAiRepository;
    private final DetalleOrdenCompraRepository detalleOrdenCompraRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public AutoPurchaseSuggestionService(
            OrdenCompraAiRepository ordenCompraAiRepository,
            DetalleOrdenCompraRepository detalleOrdenCompraRepository,
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder,
            @Value("${app.ai.analysis-url:http://localhost:8080/api/v1/ai/analyze-stock}") String aiAnalysisUrl
    ) {
        this.ordenCompraAiRepository = ordenCompraAiRepository;
        this.detalleOrdenCompraRepository = detalleOrdenCompraRepository;
        this.objectMapper = objectMapper;
        this.restClient = restClientBuilder.baseUrl(aiAnalysisUrl).build();
    }

    public void generateSuggestionIfNeeded(Producto producto) {
        if (producto == null || producto.getId() == null) {
            return;
        }

        int stockActual = producto.getStockActual() == null ? 0 : producto.getStockActual();
        int stockMinimo = producto.getStockMinimo() == null ? 0 : producto.getStockMinimo();

        if (stockActual > stockMinimo) {
            return;
        }

        if (detalleOrdenCompraRepository.existsByProductoIdAndOrdenEstado(producto.getId(), EstadoOrdenCompra.SUGERIDA)) {
            return;
        }

        int fallbackCantidad = Math.max(stockMinimo - stockActual, 1);

        AiDecision decision = callAi(producto, stockActual, stockMinimo, fallbackCantidad);

        OrdenCompraAi orden = OrdenCompraAi.builder()
                .estado(EstadoOrdenCompra.SUGERIDA)
                .promptUsado("Sugerencia automática por stock crítico")
                .respuestaRawJson(decision.rawJson)
                .build();

        orden = ordenCompraAiRepository.save(orden);

        BigDecimal precio = producto.getPrecio() == null ? BigDecimal.ZERO : producto.getPrecio();
        BigDecimal costoEstimado = precio.multiply(BigDecimal.valueOf(decision.cantidadSugerida))
                .setScale(2, RoundingMode.HALF_UP);

        DetalleOrdenCompra detalle = DetalleOrdenCompra.builder()
                .orden(orden)
                .producto(producto)
                .cantidadSugerida(decision.cantidadSugerida)
                .costoEstimado(costoEstimado)
                .build();

        detalleOrdenCompraRepository.save(detalle);

        log.info("Sugerencia automática creada. Orden={}, SKU={}, cantidad={}",
                orden.getId(), producto.getSku(), decision.cantidadSugerida);
    }

    private AiDecision callAi(Producto producto, int actual, int minimo, int fallbackCantidad) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("nombre", producto.getNombre());
            payload.put("actual", actual);
            payload.put("minimo", minimo);

            String raw = restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            int cantidad = extractCantidad(raw, fallbackCantidad);
            String normalized = normalizeRawJson(raw, fallbackCantidad, "ai");
            return new AiDecision(cantidad, normalized);
        } catch (Exception ex) {
            log.warn("IA no disponible para SKU {}. Se usará fallback. Motivo: {}", producto.getSku(), ex.getMessage());
            String fallbackJson = normalizeRawJson(null, fallbackCantidad, "fallback");
            return new AiDecision(fallbackCantidad, fallbackJson);
        }
    }

    private int extractCantidad(String raw, int fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }

        try {
            JsonNode node = objectMapper.readTree(stripCodeFence(raw));
            JsonNode cantidadNode = node.get("cantidad_sugerida");
            if (cantidadNode == null) {
                cantidadNode = node.get("cantidadSugerida");
            }
            if (cantidadNode != null && cantidadNode.canConvertToInt()) {
                int value = cantidadNode.asInt();
                return value > 0 ? value : fallback;
            }
        } catch (Exception ignored) {
            // Si la respuesta no tiene JSON válido, usamos fallback.
        }

        return fallback;
    }

    private String normalizeRawJson(String raw, int fallbackCantidad, String source) {
        try {
            if (raw != null && !raw.isBlank()) {
                JsonNode parsed = objectMapper.readTree(stripCodeFence(raw));
                return objectMapper.writeValueAsString(parsed);
            }
        } catch (Exception ignored) {
            // Si no se puede parsear, serializamos una estructura mínima.
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("cantidad_sugerida", fallbackCantidad);
        payload.put("prioridad", "MEDIA");
        payload.put("razon", "Generado por fallback automático");
        payload.put("source", source);

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            return "{\"cantidad_sugerida\":" + fallbackCantidad + "}";
        }
    }

    private String stripCodeFence(String raw) {
        return raw
                .trim()
                .replaceFirst("^```json\\s*", "")
                .replaceFirst("^```\\s*", "")
                .replaceFirst("```$", "")
                .trim();
    }

    private record AiDecision(int cantidadSugerida, String rawJson) {
    }
}
