package com.smartInventory.ai_service.services;

import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

@Service
public class StockAnalysisService implements StockAnalysisServiceContract {

    private final ChatModel chatModel;

    public StockAnalysisService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @Override
    public String analyzeStock(String nombre, Integer actual, Integer minimo) {
        String promptText = String.format(
                "Actua como experto logistico. El producto %s tiene stock %d (minimo %d). " +
                        "Responde SOLO en JSON con campos: 'cantidad_sugerida', 'prioridad' y 'razon'.",
                nombre, actual, minimo
        );

        Prompt prompt = new Prompt(new UserMessage(promptText));
        return chatModel.call(prompt).getResult().getOutput().getText();
    }
}