package com.devforge.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board_automation_rules")
public class BoardAutomationRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "trigger_type")
    private String triggerType; // ALL_SUBTASKS_COMPLETED, TASK_MOVED, TASK_CREATED

    @Column(name = "trigger_value")
    private String triggerValue; // e.g. IN_PROGRESS

    @Column(name = "action_type")
    private String actionType; // MOVE_TASK, AUTO_ASSIGN

    @Column(name = "action_value")
    private String actionValue; // e.g. DONE, ACTOR, OWNER

    private boolean active;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    private LocalDateTime createdAt;

    public BoardAutomationRule() {
    }

    public BoardAutomationRule(String name, String triggerType, String triggerValue, String actionType, String actionValue, Project project) {
        this.name = name;
        this.triggerType = triggerType;
        this.triggerValue = triggerValue;
        this.actionType = actionType;
        this.actionValue = actionValue;
        this.project = project;
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public void setTriggerType(String triggerType) {
        this.triggerType = triggerType;
    }

    public String getTriggerValue() {
        return triggerValue;
    }

    public void setTriggerValue(String triggerValue) {
        this.triggerValue = triggerValue;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getActionValue() {
        return actionValue;
    }

    public void setActionValue(String actionValue) {
        this.actionValue = actionValue;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
