package com.smartInventory.ai_service.controllers;

import lombok.Data;
import com.smartInventory.ai_service.services.StockAnalysisServiceContract;
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

}
@Data
class StockDataDTO {
    private String nombre;
    private Integer actual;
    private Integer minimo;
}
