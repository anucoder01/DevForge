package com.devforge.backend.controller;

import com.devforge.backend.model.*;
import com.devforge.backend.payload.request.EmailWebhookRequest;
import com.devforge.backend.repository.ActivityLogRepository;
import com.devforge.backend.repository.ProjectRepository;
import com.devforge.backend.repository.TaskRepository;
import com.devforge.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/webhooks")
public class EmailIngestionController {

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    TaskRepository taskRepository;

    @Autowired
    ActivityLogRepository activityLogRepository;

    @PostMapping("/email-intake")
    public ResponseEntity<?> handleEmailIntake(@RequestBody EmailWebhookRequest request) {
        String toAddress = extractEmail(request.getTo());
        String fromAddress = extractEmail(request.getFrom());
        
        Optional<Project> projectOpt = projectRepository.findByInboxEmailAddress(toAddress);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Project not found for email: " + toAddress);
        }

        Project project = projectOpt.get();
        Optional<User> senderOpt = userRepository.findByEmail(fromAddress);
        
        User actor = senderOpt.orElse(project.getOwner());

        String title = request.getSubject() != null && !request.getSubject().isBlank() ? request.getSubject() : "Ingested Task";
        String description = request.getText() != null ? request.getText() : "";
        if (title.length() > 100) {
            title = title.substring(0, 97) + "...";
        }
        if (description.length() > 1000) {
            description = description.substring(0, 997) + "...";
        }

        Task task = new Task(title, description, TaskStatus.TO_DO, TaskPriority.MEDIUM, project);
        task.setAssignee(actor);
        taskRepository.save(task);

        ActivityLog log = new ActivityLog(
            "Task Created via Email", 
            "Task '" + task.getTitle() + "' was generated from an inbound email sent by " + request.getFrom(), 
            actor, 
            project
        );
        activityLogRepository.save(log);

        return ResponseEntity.ok("Task generated successfully");
    }

    private String extractEmail(String addressField) {
        if (addressField == null) return "";
        Pattern pattern = Pattern.compile("<([^>]+)>");
        Matcher matcher = pattern.matcher(addressField);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return addressField.trim();
    }
}
