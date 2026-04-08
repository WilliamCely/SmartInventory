package com.smartInventory.import_service.client;

import com.smartInventory.import_service.dto.remote.CategoriaDto;
import com.smartInventory.import_service.dto.remote.MovimientoCreateRequest;
import com.smartInventory.import_service.dto.remote.ProductoDto;
import com.smartInventory.import_service.dto.remote.UsuarioDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class InventoryApiClient {

    private final RestClient restClient;

    public InventoryApiClient(RestClient.Builder builder, @Value("${app.inventory.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public List<ProductoDto> getProductos(String authorizationHeader) {
        try {
            return restClient.get()
                    .uri("/inventory")
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error fetching productos from inventory service", e);
            throw new RuntimeException("Error al obtener productos: " + e.getMessage(), e);
        }
    }

    public List<CategoriaDto> getCategorias(String authorizationHeader) {
        try {
            return restClient.get()
                    .uri("/inventory/categorias")
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error fetching categorias from inventory service", e);
            throw new RuntimeException("Error al obtener categorías: " + e.getMessage(), e);
        }
    }

    public List<UsuarioDto> getUsuarios(String authorizationHeader) {
        try {
            return restClient.get()
                    .uri("/inventory/usuarios")
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error fetching usuarios from inventory service", e);
            throw new RuntimeException("Error al obtener usuarios: " + e.getMessage(), e);
        }
    }

    public ProductoDto createProducto(ProductoDto producto, String authorizationHeader) {
        try {
            return restClient.post()
                    .uri("/inventory")
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .body(producto)
                    .retrieve()
                    .body(ProductoDto.class);
        } catch (Exception e) {
            log.error("Error creating producto in inventory service", e);
            throw new RuntimeException("Error al crear producto: " + e.getMessage(), e);
        }
    }

    public ProductoDto updateProducto(Long id, ProductoDto producto, String authorizationHeader) {
        try {
            return restClient.put()
                    .uri("/inventory/{id}", id)
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .body(producto)
                    .retrieve()
                    .body(ProductoDto.class);
        } catch (Exception e) {
            log.error("Error updating producto in inventory service", e);
            throw new RuntimeException("Error al actualizar producto: " + e.getMessage(), e);
        }
    }

    public CategoriaDto createCategoria(CategoriaDto categoria, String authorizationHeader) {
        try {
            return restClient.post()
                    .uri("/inventory/categorias")
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .body(categoria)
                    .retrieve()
                    .body(CategoriaDto.class);
        } catch (Exception e) {
            log.error("Error creating categoria in inventory service", e);
            throw new RuntimeException("Error al crear categoría: " + e.getMessage(), e);
        }
    }

    public MovimientoCreateRequest createMovimiento(MovimientoCreateRequest movimiento, String authorizationHeader) {
        try {
            return restClient.post()
                    .uri("/inventory/movimientos")
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .body(movimiento)
                    .retrieve()
                    .body(MovimientoCreateRequest.class);
        } catch (Exception e) {
            log.error("Error creating movimiento in inventory service", e);
            throw new RuntimeException("Error al crear movimiento: " + e.getMessage(), e);
        }
    }
}
