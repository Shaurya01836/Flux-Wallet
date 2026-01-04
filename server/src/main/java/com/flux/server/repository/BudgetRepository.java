package com.flux.server.repository;

import com.flux.server.entity.Budget;
import com.flux.server.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByUserAndMonth(User user, String Month);
}