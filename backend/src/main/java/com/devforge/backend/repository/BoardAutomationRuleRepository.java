package com.devforge.backend.repository;

import com.devforge.backend.model.BoardAutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardAutomationRuleRepository extends JpaRepository<BoardAutomationRule, Long> {
    List<BoardAutomationRule> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<BoardAutomationRule> findByProjectIdAndActiveTrue(Long projectId);
}
