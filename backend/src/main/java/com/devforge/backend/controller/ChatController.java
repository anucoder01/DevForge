package com.devforge.backend.controller;

import com.devforge.backend.model.ChatMessage;
import com.devforge.backend.model.User;
import com.devforge.backend.repository.ChatMessageRepository;
import com.devforge.backend.repository.UserRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatController(ChatMessageRepository chatMessageRepository, UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    public static class ChatMessageRequest {
        public Long senderId;
        public String content;
    }

    @MessageMapping("/chat/{projectId}")
    @SendTo("/topic/chat/{projectId}")
    public ChatMessage sendMessage(@DestinationVariable Long projectId, @Payload ChatMessageRequest request) {
        User sender = userRepository.findById(request.senderId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        ChatMessage message = new ChatMessage(projectId, sender, request.content);
        message.setTimestamp(LocalDateTime.now());
        
        return chatMessageRepository.save(message);
    }

    @GetMapping("/api/projects/{projectId}/chat-history")
    public List<ChatMessage> getChatHistory(@PathVariable Long projectId) {
        return chatMessageRepository.findByProjectIdOrderByTimestampAsc(projectId);
    }
}
