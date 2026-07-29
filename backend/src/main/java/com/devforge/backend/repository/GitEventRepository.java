package com.devforge.backend.repository;

import com.devforge.backend.model.GitEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GitEventRepository extends JpaRepository<GitEvent, Long> {
    List<GitEvent> findByTaskIdOrderByCreatedAtDesc(Long taskId);
}
