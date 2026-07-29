package com.devforge.backend.controller;

import com.devforge.backend.model.Notification;
import com.devforge.backend.model.User;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.NotificationRepository;
import com.devforge.backend.repository.UserRepository;
import com.devforge.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    UserRepository userRepository;

    private User getAuthenticatedUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: Authenticated user not found."));
    }

    @GetMapping("")
    public ResponseEntity<List<Notification>> getNotifications() {
        User currentUser = getAuthenticatedUser();
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Notification> notificationOpt = notificationRepository.findById(id);

        if (notificationOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Notification notification = notificationOpt.get();
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to modify this notification."));
        }

        notification.setRead(true);
        Notification updatedNotification = notificationRepository.save(notification);
        return ResponseEntity.ok(updatedNotification);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        User currentUser = getAuthenticatedUser();
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId());
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        }
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        User currentUser = getAuthenticatedUser();
        Optional<Notification> notificationOpt = notificationRepository.findById(id);

        if (notificationOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Notification notification = notificationOpt.get();
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: Unauthorized to delete this notification."));
        }

        notificationRepository.delete(notification);
        return ResponseEntity.ok(new MessageResponse("Notification deleted successfully!"));
    }
}
