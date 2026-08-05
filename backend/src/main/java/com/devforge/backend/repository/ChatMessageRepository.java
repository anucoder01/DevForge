package com.devforge.backend.repository;

import com.devforge.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProjectIdOrderByTimestampAsc(Long projectId);
}
