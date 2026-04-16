package com.smartInventory.ai_service.controllers;

import lombok.Data;
import com.smartInventory.ai_service.services.StockAnalysisServiceContract;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class AIController {

    private final StockAnalysisServiceContract stockAnalysisService;

    public AIController(StockAnalysisServiceContract stockAnalysisService) {
        this.stockAnalysisService = stockAnalysisService;
    }

    @PostMapping("/analyze-stock")
    public String analyzeStock(@RequestBody StockDataDTO data) {
        return stockAnalysisService.analyzeStock(data.getNombre(), data.getActual(), data.getMinimo());
    }

    @GetMapping("/health/model")
    public ResponseEntity<ModelHealthDTO> modelHealth() {
        long start = System.currentTimeMillis();

        try {
            String reply = stockAnalysisService.pingModel();
            long latencyMs = System.currentTimeMillis() - start;
            return ResponseEntity.ok(new ModelHealthDTO("UP", latencyMs, reply));
        } catch (Exception ex) {
            long latencyMs = System.currentTimeMillis() - start;
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ModelHealthDTO("DOWN", latencyMs, ex.getMessage()));
        }
    }

}
@Data
class StockDataDTO {
    private String nombre;
    private Integer actual;
    private Integer minimo;
}

@Data
class ModelHealthDTO {
    private final String status;
    private final Long latencyMs;
    private final String details;
}
