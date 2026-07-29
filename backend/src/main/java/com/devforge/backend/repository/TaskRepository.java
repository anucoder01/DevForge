package com.devforge.backend.repository;

import com.devforge.backend.model.Project;
import com.devforge.backend.model.Task;
import com.devforge.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject(Project project);
    List<Task> findByProjectId(Long projectId);
    List<Task> findByAssignee(User assignee);
}
