package com.devforge.backend.controller;

import com.devforge.backend.model.Project;
import com.devforge.backend.model.User;
import com.devforge.backend.model.ActivityLog;
import com.devforge.backend.model.Notification;
import com.devforge.backend.payload.request.ProjectRequest;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.ProjectRepository;
import com.devforge.backend.repository.UserRepository;
import com.devforge.backend.repository.ActivityLogRepository;
import com.devforge.backend.repository.NotificationRepository;
import com.devforge.backend.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

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

    @GetMapping("")
    public ResponseEntity<List<Project>> getAllUserProjects() {
        User currentUser = getAuthenticatedUser();
        List<Project> projects = projectRepository.findByOwnerOrMembersContaining(currentUser, currentUser);
        return ResponseEntity.ok(projects);
    }

    @PostMapping("")
    public ResponseEntity<?> createProject(@Valid @RequestBody ProjectRequest projectRequest) {
        User currentUser = getAuthenticatedUser();
        Project project = new Project(projectRequest.getName(), projectRequest.getDescription(), currentUser);
        project.getMembers().add(currentUser);
        Project savedProject = projectRepository.save(project);

        ActivityLog log = new ActivityLog(
            "Project Created",
            currentUser.getUsername() + " created project \"" + savedProject.getName() + "\"",
            currentUser,
            savedProject
        );
        activityLogRepository.save(log);

        return ResponseEntity.ok(savedProject);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(id);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isMember = project.getMembers().stream().anyMatch(m -> m.getId().equals(currentUser.getId()));

        if (!isOwner && !isMember) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to access this project."));
        }

        return ResponseEntity.ok(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest projectRequest) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(id);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Only the project owner can update this project."));
        }

        project.setName(projectRequest.getName());
        project.setDescription(projectRequest.getDescription());
        Project updatedProject = projectRepository.save(project);
        return ResponseEntity.ok(updatedProject);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(id);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Only the project owner can delete this project."));
        }

        projectRepository.delete(project);
        return ResponseEntity.ok(new MessageResponse("Project deleted successfully!"));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(@PathVariable Long id, @RequestBody Map<String, Long> payload) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(id);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Only the project owner can add members."));
        }

        Long memberId = payload.get("userId");
        if (memberId == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: userId is required."));
        }

        Optional<User> memberOpt = userRepository.findById(memberId);
        if (memberOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User to add not found."));
        }

        User memberToAdd = memberOpt.get();
        project.getMembers().add(memberToAdd);
        projectRepository.save(project);

        ActivityLog log = new ActivityLog(
            "Member Added",
            currentUser.getUsername() + " added user \"" + memberToAdd.getUsername() + "\" to the project",
            currentUser,
            project
        );
        activityLogRepository.save(log);

        Notification notif = new Notification(
            "You have been added to project \"" + project.getName() + "\" by " + currentUser.getUsername(),
            memberToAdd
        );
        notificationRepository.save(notif);

        return ResponseEntity.ok(new MessageResponse("Member added successfully!"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(id);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Only the project owner can remove members."));
        }

        if (project.getOwner().getId().equals(userId)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Cannot remove the project owner."));
        }

        Optional<User> memberToRemoveOpt = userRepository.findById(userId);
        boolean removed = project.getMembers().removeIf(m -> m.getId().equals(userId));
        if (!removed) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: User is not a member of this project."));
        }

        projectRepository.save(project);

        String memberName = memberToRemoveOpt.map(User::getUsername).orElse("Unknown User");
        ActivityLog log = new ActivityLog(
            "Member Removed",
            currentUser.getUsername() + " removed user \"" + memberName + "\" from the project",
            currentUser,
            project
        );
        activityLogRepository.save(log);

        return ResponseEntity.ok(new MessageResponse("Member removed successfully!"));
    }

    @GetMapping("/{projectId}/activity")
    public ResponseEntity<?> getProjectActivity(@PathVariable Long projectId) {
        User currentUser = getAuthenticatedUser();
        Optional<Project> projectOpt = projectRepository.findById(projectId);

        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isMember = project.getMembers().stream().anyMatch(m -> m.getId().equals(currentUser.getId()));
        if (!isOwner && !isMember) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to access activity logs."));
        }

        List<ActivityLog> logs = activityLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        return ResponseEntity.ok(logs);
    }
}
