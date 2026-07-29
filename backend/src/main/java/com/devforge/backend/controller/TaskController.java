package com.devforge.backend.controller;

import com.devforge.backend.model.*;
import com.devforge.backend.payload.request.TaskRequest;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.ProjectRepository;
import com.devforge.backend.repository.TaskRepository;
import com.devforge.backend.repository.UserRepository;
import com.devforge.backend.repository.ActivityLogRepository;
import com.devforge.backend.repository.NotificationRepository;
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
public class TaskController {

    @Autowired
    TaskRepository taskRepository;

    @Autowired
    BoardAutomationService boardAutomationService;

    @Autowired
    ProjectRepository projectRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ActivityLogRepository activityLogRepository;

    @Autowired
    NotificationRepository notificationRepository;

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

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<?> getTasksByProject(@PathVariable Long projectId) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(projectId);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        if (!isProjectInvolved(project, currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to access this project's tasks."));
        }

        List<Task> tasks = taskRepository.findByProjectId(projectId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<?> createTask(@PathVariable Long projectId, @Valid @RequestBody TaskRequest taskRequest) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(projectId);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        if (!isProjectInvolved(project, currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to create tasks in this project."));
        }

        TaskStatus status = TaskStatus.TO_DO;
        if (taskRequest.getStatus() != null) {
            try {
                status = TaskStatus.valueOf(taskRequest.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid task status. Use TO_DO, IN_PROGRESS, or DONE."));
            }
        }

        TaskPriority priority = TaskPriority.MEDIUM;
        if (taskRequest.getPriority() != null) {
            try {
                priority = TaskPriority.valueOf(taskRequest.getPriority().toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid task priority. Use LOW, MEDIUM, or HIGH."));
            }
        }

        User assignee = null;
        if (taskRequest.getAssigneeId() != null) {
            Optional<User> assigneeOpt = userRepository.findById(taskRequest.getAssigneeId());
            if (assigneeOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Assignee user not found."));
            }
            assignee = assigneeOpt.get();
            User finalAssignee = assignee;
            boolean isAssigneeMember = project.getMembers().stream().anyMatch(m -> m.getId().equals(finalAssignee.getId()));
            if (!isAssigneeMember) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Assignee must be a member of the project."));
            }
        }

        Task task = new Task(taskRequest.getTitle(), taskRequest.getDescription(), status, priority, project);
        task.setAssignee(assignee);
        task.setDueDate(taskRequest.getDueDate());

        Task savedTask = taskRepository.save(task);
        boardAutomationService.executeTaskCreatedRules(savedTask, currentUser);

        ActivityLog log = new ActivityLog(
            "Task Created",
            currentUser.getUsername() + " created task \"" + savedTask.getTitle() + "\"",
            currentUser,
            project
        );
        activityLogRepository.save(log);

        if (assignee != null) {
            Notification notif = new Notification(
                "You have been assigned task \"" + savedTask.getTitle() + "\" in project \"" + project.getName() + "\"",
                assignee
            );
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(savedTask);
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Task> taskOpt = taskRepository.findById(id);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        if (!isProjectInvolved(task.getProject(), currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to access this task."));
        }

        return ResponseEntity.ok(task);
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest taskRequest) {
        User currentUser = getAuthenticatedUser();
        Optional<Task> taskOpt = taskRepository.findById(id);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        Project project = task.getProject();
        Long oldAssigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;

        if (!isProjectInvolved(project, currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to update tasks in this project."));
        }

        TaskStatus oldStatus = task.getStatus();

        if (taskRequest.getStatus() != null) {
            try {
                task.setStatus(TaskStatus.valueOf(taskRequest.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid task status. Use TO_DO, IN_PROGRESS, or DONE."));
            }
        }

        if (taskRequest.getPriority() != null) {
            try {
                task.setPriority(TaskPriority.valueOf(taskRequest.getPriority().toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid task priority. Use LOW, MEDIUM, or HIGH."));
            }
        }

        if (taskRequest.getAssigneeId() != null) {
            Optional<User> assigneeOpt = userRepository.findById(taskRequest.getAssigneeId());
            if (assigneeOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Assignee user not found."));
            }
            User assignee = assigneeOpt.get();
            boolean isAssigneeMember = project.getMembers().stream().anyMatch(m -> m.getId().equals(assignee.getId()));
            if (!isAssigneeMember) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Assignee must be a member of the project."));
            }
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        task.setTitle(taskRequest.getTitle());
        task.setDescription(taskRequest.getDescription());
        task.setDueDate(taskRequest.getDueDate());

        Task updatedTask = taskRepository.save(task);
        boardAutomationService.executeTaskMovedRules(updatedTask, oldStatus, currentUser);

        String actionStr = "Task Updated";
        String descStr = currentUser.getUsername() + " updated task \"" + updatedTask.getTitle() + "\"";
        if (oldStatus != updatedTask.getStatus()) {
            actionStr = "Task Moved";
            descStr = currentUser.getUsername() + " moved task \"" + updatedTask.getTitle() + "\" to " + updatedTask.getStatus().name().replace("_", " ");
        }

        ActivityLog log = new ActivityLog(actionStr, descStr, currentUser, project);
        activityLogRepository.save(log);

        if (updatedTask.getAssignee() != null && (oldAssigneeId == null || !oldAssigneeId.equals(updatedTask.getAssignee().getId()))) {
            Notification notif = new Notification(
                "You have been assigned task \"" + updatedTask.getTitle() + "\" in project \"" + project.getName() + "\"",
                updatedTask.getAssignee()
            );
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Task> taskOpt = taskRepository.findById(id);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        if (!isProjectInvolved(task.getProject(), currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to delete tasks in this project."));
        }

        taskRepository.delete(task);

        ActivityLog log = new ActivityLog(
            "Task Deleted",
            currentUser.getUsername() + " deleted task \"" + task.getTitle() + "\"",
            currentUser,
            task.getProject()
        );
        activityLogRepository.save(log);

        return ResponseEntity.ok(new MessageResponse("Task deleted successfully!"));
    }
}
