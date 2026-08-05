package com.devforge.backend.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Arrays;

@Service
public class GeminiService {

    public List<String> generateSubtasks(String taskTitle, String taskDescription) {
        // Mocking the Gemini API call for now
        try {
            Thread.sleep(1000); // Simulate network delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return Arrays.asList(
            "Analyze requirements for: " + taskTitle,
            "Design the component architecture",
            "Implement core logic based on description",
            "Write unit tests for edge cases",
            "Deploy and monitor"
        );
    }
}
