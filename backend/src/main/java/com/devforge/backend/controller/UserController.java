package com.devforge.backend.controller;

import com.devforge.backend.model.User;
import com.devforge.backend.payload.request.ProfileUpdateRequest;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.UserRepository;
import com.devforge.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    private User getAuthenticatedUser() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: Authenticated user not found."));
    }

    @GetMapping("")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        User currentUser = getAuthenticatedUser();

        if (!currentUser.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        currentUser.setEmail(request.getEmail());

        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Current password is required to change password."));
            }

            if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Incorrect current password."));
            }

            currentUser.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        }

        userRepository.save(currentUser);
        return ResponseEntity.ok(new MessageResponse("Profile updated successfully!"));
    }
}
