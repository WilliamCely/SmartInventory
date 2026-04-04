package com.smartInventory.ai_service.controllers;

import lombok.Data;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
public class AIController {

    private final ChatModel chatModel;

    public AIController(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @PostMapping("/analyze-stock")
    public String analyzeStock(@RequestBody StockDataDTO data) {
        // El Prompt Engineering es clave para obtener JSON
        String promptText = String.format(
                "Actúa como experto logístico. El producto %s tiene stock %d (mínimo %d). " +
                        "Responde SOLO en JSON con campos: 'cantidad_sugerida', 'prioridad' y 'razon'.",
                data.getNombre(), data.getActual(), data.getMinimo()
        );

        Prompt prompt = new Prompt(new UserMessage(promptText));
        return chatModel.call(prompt).getResult().getOutput().getText();
    }

}
@Data
class StockDataDTO {
    private String nombre;
    private Integer actual;
    private Integer minimo;
}
