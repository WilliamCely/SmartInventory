package com.smartInventory.inventory_service.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.ZonedDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "ordenes_compra_ai")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrdenCompraAi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_generacion", nullable = false, updatable = false)
    private ZonedDateTime fechaGeneracion;

    @Column(name = "prompt_usado", columnDefinition = "TEXT")
    private String promptUsado;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "respuesta_raw_json", columnDefinition = "jsonb")
    private String respuestaRawJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoOrdenCompra estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_aprobador_id")
    private Usuario usuarioAprobador;

    @PrePersist
    protected void onCreate() {
        if (fechaGeneracion == null) {
            fechaGeneracion = ZonedDateTime.now(ZoneId.of("America/Santiago"));
        }
        if (estado == null) {
            estado = EstadoOrdenCompra.SUGERIDA;
        }
    }
}
