package com.devforge.backend.service;

import com.devforge.backend.model.*;
import com.devforge.backend.repository.BoardAutomationRuleRepository;
import com.devforge.backend.repository.TaskRepository;
import com.devforge.backend.repository.ActivityLogRepository;
import com.devforge.backend.repository.NotificationRepository;
import com.devforge.backend.repository.SubtaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BoardAutomationService {

    @Autowired
    BoardAutomationRuleRepository ruleRepository;

    @Autowired
    TaskRepository taskRepository;

    @Autowired
    ActivityLogRepository activityLogRepository;

    @Autowired
    NotificationRepository notificationRepository;

    @Autowired
    SubtaskRepository subtaskRepository;

    public void executeTaskCreatedRules(Task task, User actor) {
        List<BoardAutomationRule> rules = ruleRepository.findByProjectIdAndActiveTrue(task.getProject().getId());

        for (BoardAutomationRule rule : rules) {
            if ("TASK_CREATED".equals(rule.getTriggerType())) {
                boolean taskUpdated = false;

                if ("AUTO_ASSIGN".equals(rule.getActionType())) {
                    if ("OWNER".equals(rule.getActionValue())) {
                        task.setAssignee(task.getProject().getOwner());
                        taskUpdated = true;
                    } else if ("ACTOR".equals(rule.getActionValue()) && actor != null) {
                        task.setAssignee(actor);
                        taskUpdated = true;
                    }
                }

                if (taskUpdated) {
                    taskRepository.save(task);
                    logAutomationEvent(
                            "Automation Assign",
                            "Task \"" + task.getTitle() + "\" automatically assigned to " + task.getAssignee().getUsername() + " by automation rule: " + rule.getName(),
                            task.getProject()
                    );
                }
            }
        }
    }

    public void executeTaskMovedRules(Task task, TaskStatus oldStatus, User actor) {
        if (task.getStatus() == oldStatus) return;

        List<BoardAutomationRule> rules = ruleRepository.findByProjectIdAndActiveTrue(task.getProject().getId());

        for (BoardAutomationRule rule : rules) {
            if ("TASK_MOVED".equals(rule.getTriggerType()) && task.getStatus().name().equals(rule.getTriggerValue())) {
                boolean taskUpdated = false;

                if ("AUTO_ASSIGN".equals(rule.getActionType())) {
                    if ("ACTOR".equals(rule.getActionValue()) && actor != null) {
                        task.setAssignee(actor);
                        taskUpdated = true;
                    } else if ("OWNER".equals(rule.getActionValue())) {
                        task.setAssignee(task.getProject().getOwner());
                        taskUpdated = true;
                    }
                }

                if (taskUpdated) {
                    taskRepository.save(task);
                    logAutomationEvent(
                            "Automation Assign",
                            "Task \"" + task.getTitle() + "\" automatically assigned to " + task.getAssignee().getUsername() + " by automation rule: " + rule.getName(),
                            task.getProject()
                    );
                }
            }
        }
    }

    public void executeSubtaskToggleRules(Task task, User actor) {
        List<Subtask> subs = subtaskRepository.findByTaskId(task.getId());
        if (subs.isEmpty()) return;

        boolean allCompleted = subs.stream().allMatch(Subtask::isCompleted);
        if (!allCompleted) return;

        List<BoardAutomationRule> rules = ruleRepository.findByProjectIdAndActiveTrue(task.getProject().getId());

        for (BoardAutomationRule rule : rules) {
            if ("ALL_SUBTASKS_COMPLETED".equals(rule.getTriggerType())) {
                boolean taskUpdated = false;

                if ("MOVE_TASK".equals(rule.getActionType())) {
                    try {
                        TaskStatus targetStatus = TaskStatus.valueOf(rule.getActionValue());
                        if (task.getStatus() != targetStatus) {
                            task.setStatus(targetStatus);
                            taskUpdated = true;
                        }
                    } catch (IllegalArgumentException e) {
                        // Ignore invalid status mapping
                    }
                }

                if (taskUpdated) {
                    taskRepository.save(task);
                    logAutomationEvent(
                            "Automation Transition",
                            "Task \"" + task.getTitle() + "\" automatically moved to " + task.getStatus().name().replace("_", " ") + " by automation rule: " + rule.getName(),
                            task.getProject()
                    );

                    if (task.getAssignee() != null) {
                        Notification notif = new Notification(
                                "Your assigned task \"" + task.getTitle() + "\" was auto-moved to " + task.getStatus().name().replace("_", " ") + " because all checklist subtasks are complete.",
                                task.getAssignee()
                        );
                        notificationRepository.save(notif);
                    }
                }
            }
        }
    }

    private void logAutomationEvent(String action, String details, Project project) {
        ActivityLog log = new ActivityLog(action, details, null, project);
        activityLogRepository.save(log);
    }
}
