package com.devforge.backend.controller;

import com.devforge.backend.model.BoardAutomationRule;
import com.devforge.backend.model.Project;
import com.devforge.backend.payload.response.MessageResponse;
import com.devforge.backend.repository.BoardAutomationRuleRepository;
import com.devforge.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class BoardAutomationController {

    @Autowired
    BoardAutomationRuleRepository ruleRepository;

    @Autowired
    ProjectRepository projectRepository;

    @GetMapping("/projects/{projectId}/automation-rules")
    public ResponseEntity<List<BoardAutomationRule>> getRulesForProject(@PathVariable Long projectId) {
        List<BoardAutomationRule> rules = ruleRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        return ResponseEntity.ok(rules);
    }

    @PostMapping("/projects/{projectId}/automation-rules")
    public ResponseEntity<?> createRule(@PathVariable Long projectId, @RequestBody BoardAutomationRule rule) {
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        rule.setProject(projectOpt.get());
        rule.setActive(true);
        BoardAutomationRule savedRule = ruleRepository.save(rule);
        return ResponseEntity.ok(savedRule);
    }

    @PutMapping("/automation-rules/{id}/toggle")
    public ResponseEntity<?> toggleRule(@PathVariable Long id) {
        Optional<BoardAutomationRule> ruleOpt = ruleRepository.findById(id);
        if (ruleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BoardAutomationRule rule = ruleOpt.get();
        rule.setActive(!rule.isActive());
        BoardAutomationRule savedRule = ruleRepository.save(rule);
        return ResponseEntity.ok(savedRule);
    }

    @DeleteMapping("/automation-rules/{id}")
    public ResponseEntity<?> deleteRule(@PathVariable Long id) {
        Optional<BoardAutomationRule> ruleOpt = ruleRepository.findById(id);
        if (ruleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ruleRepository.delete(ruleOpt.get());
        return ResponseEntity.ok(new MessageResponse("Automation rule deleted successfully!"));
    }
}
