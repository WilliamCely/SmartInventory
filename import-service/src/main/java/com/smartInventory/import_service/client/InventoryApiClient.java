package com.smartInventory.import_service.client;

import com.smartInventory.import_service.dto.remote.CategoriaDto;
import com.smartInventory.import_service.dto.remote.MovimientoCreateRequest;
import com.smartInventory.import_service.dto.remote.ProductoDto;
import com.smartInventory.import_service.dto.remote.UsuarioDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class InventoryApiClient {

    private final RestClient restClient;

    public InventoryApiClient(RestClient.Builder builder, @Value("${app.inventory.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public List<ProductoDto> getProductos(String authorizationHeader) {
        return restClient.get()
                .uri("/inventory")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public List<CategoriaDto> getCategorias(String authorizationHeader) {
        return restClient.get()
                .uri("/inventory/categorias")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public List<UsuarioDto> getUsuarios(String authorizationHeader) {
        return restClient.get()
                .uri("/inventory/usuarios")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public ProductoDto createProducto(ProductoDto producto, String authorizationHeader) {
        return restClient.post()
                .uri("/inventory")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .body(producto)
                .retrieve()
                .body(ProductoDto.class);
    }

    public ProductoDto updateProducto(Long id, ProductoDto producto, String authorizationHeader) {
        return restClient.put()
                .uri("/inventory/{id}", id)
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .body(producto)
                .retrieve()
                .body(ProductoDto.class);
    }

    public CategoriaDto createCategoria(CategoriaDto categoria, String authorizationHeader) {
        return restClient.post()
                .uri("/inventory/categorias")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .body(categoria)
                .retrieve()
                .body(CategoriaDto.class);
    }

    public MovimientoCreateRequest createMovimiento(MovimientoCreateRequest movimiento, String authorizationHeader) {
        return restClient.post()
                .uri("/inventory/movimientos")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .body(movimiento)
                .retrieve()
                .body(MovimientoCreateRequest.class);
    }
}
