package com.devforge.backend.controller;

import com.devforge.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class GeminiController {

    private final GeminiService geminiService;

    @Autowired
    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/plan")
    public ResponseEntity<List<String>> suggestSubtasks(@RequestBody Map<String, String> request) {
        String title = request.getOrDefault("title", "");
        String description = request.getOrDefault("description", "");
        
        List<String> subtasks = geminiService.generateSubtasks(title, description);
        return ResponseEntity.ok(subtasks);
    }
}
