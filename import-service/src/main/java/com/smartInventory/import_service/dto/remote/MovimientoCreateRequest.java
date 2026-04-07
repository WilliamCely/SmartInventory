package com.smartInventory.import_service.dto.remote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoCreateRequest {
    private Ref producto;
    private Ref usuario;
    private String tipo;
    private Integer cantidad;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Ref {
        private Long id;
    }
}
