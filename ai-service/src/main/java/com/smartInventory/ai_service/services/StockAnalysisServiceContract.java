package com.smartInventory.ai_service.services;

public interface StockAnalysisServiceContract {
    String analyzeStock(String nombre, Integer actual, Integer minimo);
}