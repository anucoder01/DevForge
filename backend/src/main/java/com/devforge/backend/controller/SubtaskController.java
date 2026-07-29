package com.devforge.backend.controller;

import com.devforge.backend.model.*;
import com.devforge.backend.payload.request.SubtaskRequest;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.*;
import com.devforge.backend.security.UserDetailsImpl;
import com.devforge.backend.service.BoardAutomationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class SubtaskController {

    @Autowired
    SubtaskRepository subtaskRepository;

    @Autowired
    BoardAutomationService boardAutomationService;

    @Autowired
    TaskRepository taskRepository;

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ActivityLogRepository activityLogRepository;

    private User getAuthenticatedUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: Authenticated user not found."));
    }

    private boolean isProjectInvolved(Project project, User user) {
        boolean isOwner = project.getOwner().getId().equals(user.getId());
        boolean isMember = project.getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()));
        return isOwner || isMember;
    }

    @GetMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<?> getSubtasksByTask(@PathVariable Long taskId) {
        User currentUser = getAuthenticatedUser();
        Optional<Task> taskOpt = taskRepository.findById(taskId);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        if (!isProjectInvolved(task.getProject(), currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to view subtasks for this task."));
        }

        List<Subtask> subtasks = subtaskRepository.findByTaskId(taskId);
        return ResponseEntity.ok(subtasks);
    }

    @PostMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<?> createSubtask(@PathVariable Long taskId, @Valid @RequestBody SubtaskRequest subtaskRequest) {
        User currentUser = getAuthenticatedUser();
        Optional<Task> taskOpt = taskRepository.findById(taskId);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        Project project = task.getProject();
        if (!isProjectInvolved(project, currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to add subtasks to this task."));
        }

        Subtask subtask = new Subtask(subtaskRequest.getTitle(), task);
        Subtask savedSubtask = subtaskRepository.save(subtask);

        ActivityLog log = new ActivityLog(
                "Subtask Created",
                currentUser.getUsername() + " added subtask \"" + subtask.getTitle() + "\" to task \"" + task.getTitle() + "\"",
                currentUser,
                project
        );
        activityLogRepository.save(log);

        return ResponseEntity.ok(savedSubtask);
    }

    @PutMapping("/subtasks/{id}")
    public ResponseEntity<?> updateSubtask(@PathVariable Long id, @Valid @RequestBody SubtaskRequest subtaskRequest) {
        User currentUser = getAuthenticatedUser();
        Optional<Subtask> subtaskOpt = subtaskRepository.findById(id);

        if (subtaskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Subtask subtask = subtaskOpt.get();
        Task task = subtask.getTask();
        Project project = task.getProject();

        if (!isProjectInvolved(project, currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to update this subtask."));
        }

        boolean prevCompleted = subtask.isCompleted();
        subtask.setTitle(subtaskRequest.getTitle());
        subtask.setCompleted(subtaskRequest.isCompleted());
        Subtask updatedSubtask = subtaskRepository.save(subtask);

        if (subtaskRequest.isCompleted() && !prevCompleted) {
            boardAutomationService.executeSubtaskToggleRules(task, currentUser);
        }

        if (prevCompleted != subtaskRequest.isCompleted()) {
            String stateStr = subtaskRequest.isCompleted() ? "completed" : "incomplete";
            ActivityLog log = new ActivityLog(
                    "Subtask Toggle",
                    currentUser.getUsername() + " marked subtask \"" + subtask.getTitle() + "\" as " + stateStr + " on task \"" + task.getTitle() + "\"",
                    currentUser,
                    project
            );
            activityLogRepository.save(log);
        }

        return ResponseEntity.ok(updatedSubtask);
    }

    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<?> deleteSubtask(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Subtask> subtaskOpt = subtaskRepository.findById(id);

        if (subtaskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Subtask subtask = subtaskOpt.get();
        Task task = subtask.getTask();
        Project project = task.getProject();

        if (!isProjectInvolved(project, currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to delete this subtask."));
        }

        subtaskRepository.delete(subtask);

        ActivityLog log = new ActivityLog(
                "Subtask Deleted",
                currentUser.getUsername() + " deleted subtask \"" + subtask.getTitle() + "\" from task \"" + task.getTitle() + "\"",
                currentUser,
                project
        );
        activityLogRepository.save(log);

        return ResponseEntity.ok(new MessageResponse("Subtask deleted successfully!"));
    }
}
