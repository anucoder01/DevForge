package com.devforge.backend.controller;

import com.devforge.backend.model.GitEvent;
import com.devforge.backend.model.Task;
import com.devforge.backend.model.TaskStatus;
import com.devforge.backend.model.ActivityLog;
import com.devforge.backend.model.Notification;
import com.devforge.backend.payload.request.GitWebhookPayload;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.GitEventRepository;
import com.devforge.backend.repository.TaskRepository;
import com.devforge.backend.repository.ActivityLogRepository;
import com.devforge.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class GitController {

    @Autowired
    GitEventRepository gitEventRepository;

    @Autowired
    TaskRepository taskRepository;

    @Autowired
    ActivityLogRepository activityLogRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @GetMapping("/tasks/{taskId}/git-events")
    public ResponseEntity<List<GitEvent>> getGitEventsForTask(@PathVariable Long taskId) {
        List<GitEvent> events = gitEventRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
        return ResponseEntity.ok(events);
    }

    @PostMapping("/git/webhook")
    public ResponseEntity<?> handleGitWebhook(@Valid @RequestBody GitWebhookPayload payload) {
        Long taskId = parseTaskId(payload.getMessage());
        if (taskId == null) {
            taskId = parseTaskId(payload.getRefName());
        }

        if (taskId == null) {
            return ResponseEntity.ok(new MessageResponse("Webhook received. No task reference found."));
        }

        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.ok(new MessageResponse("Webhook received. Task ID #" + taskId + " not found."));
        }

        Task task = taskOpt.get();
        String eventType = payload.getType().startsWith("PR") ? "PR" : "COMMIT";
        String prStatus = null;

        if (payload.getType().equals("PR_OPEN")) {
            prStatus = "OPEN";
        } else if (payload.getType().equals("PR_MERGE")) {
            prStatus = "MERGED";
        }

        GitEvent gitEvent = new GitEvent(
                eventType,
                payload.getRefName(),
                payload.getAuthor(),
                payload.getUrl(),
                payload.getMessage(),
                prStatus,
                task
        );

        gitEventRepository.save(gitEvent);

        if ("PR_MERGE".equals(payload.getType())) {
            task.setStatus(TaskStatus.DONE);
            taskRepository.save(task);

            ActivityLog log = new ActivityLog(
                    "PR Merged",
                    "Task \"" + task.getTitle() + "\" auto-closed by merged PR from " + payload.getAuthor(),
                    null,
                    task.getProject()
            );
            activityLogRepository.save(log);

            if (task.getAssignee() != null) {
                Notification notif = new Notification(
                        "Your assigned task \"" + task.getTitle() + "\" was closed by merged PR from " + payload.getAuthor(),
                        task.getAssignee()
                );
                notificationRepository.save(notif);
            }
        }

        return ResponseEntity.ok(new MessageResponse("Webhook processed. Git event successfully linked to task #" + taskId));
    }

    private Long parseTaskId(String text) {
        if (text == null) return null;
        Pattern pattern = Pattern.compile("(?i)(?:#|task-|DF-)(\\d+)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return Long.parseLong(matcher.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
