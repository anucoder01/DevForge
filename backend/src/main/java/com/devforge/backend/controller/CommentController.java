package com.devforge.backend.controller;

import com.devforge.backend.model.*;
import com.devforge.backend.payload.request.CommentRequest;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.*;
import com.devforge.backend.security.UserDetailsImpl;
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
public class CommentController {

    @Autowired
    CommentRepository commentRepository;

    @Autowired
    TaskRepository taskRepository;

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

    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<?> getCommentsByTask(@PathVariable Long taskId) {
        User currentUser = getAuthenticatedUser();
        Optional<Task> taskOpt = taskRepository.findById(taskId);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        if (!isProjectInvolved(task.getProject(), currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to view comments for this task."));
        }

        List<Comment> comments = commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<?> addCommentToTask(@PathVariable Long taskId, @Valid @RequestBody CommentRequest commentRequest) {
        User currentUser = getAuthenticatedUser();
        Optional<Task> taskOpt = taskRepository.findById(taskId);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        if (!isProjectInvolved(task.getProject(), currentUser)) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to add comments to this task."));
        }

        Comment comment = new Comment(commentRequest.getText(), currentUser, task);
        Comment savedComment = commentRepository.save(comment);

        ActivityLog log = new ActivityLog(
            "Comment Added",
            currentUser.getUsername() + " commented on task \"" + task.getTitle() + "\"",
            currentUser,
            task.getProject()
        );
        activityLogRepository.save(log);

        if (task.getAssignee() != null && !task.getAssignee().getId().equals(currentUser.getId())) {
            Notification notif = new Notification(
                currentUser.getUsername() + " commented on task \"" + task.getTitle() + "\"",
                task.getAssignee()
            );
            notificationRepository.save(notif);
        }

        return ResponseEntity.ok(savedComment);
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<?> deleteComment(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Comment> commentOpt = commentRepository.findById(id);

        if (commentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Comment comment = commentOpt.get();
        Project project = comment.getTask().getProject();

        boolean isAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isProjectOwner = project.getOwner().getId().equals(currentUser.getId());

        if (!isAuthor && !isProjectOwner) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Only the comment author or project owner can delete this comment."));
        }

        commentRepository.delete(comment);
        return ResponseEntity.ok(new MessageResponse("Comment deleted successfully!"));
    }
}
