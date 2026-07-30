package com.devforge.backend.repository;

import com.devforge.backend.model.Project;
import com.devforge.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwner(User owner);
    List<Project> findByMembersContaining(User member);
    List<Project> findByOwnerOrMembersContaining(User owner, User member);
    Optional<Project> findByInboxEmailAddress(String inboxEmailAddress);
}
