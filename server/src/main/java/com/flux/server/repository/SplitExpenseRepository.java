package com.flux.server.repository;

import com.flux.server.entity.SplitExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SplitExpenseRepository extends JpaRepository<SplitExpense, Long> {

    @Query("SELECT s FROM SplitExpense s WHERE s.paidBy.id = :userId OR s.owedBy.id = :userId ORDER BY s.createdAt DESC")
    List<SplitExpense> findAllUserExpenses(@Param("userId") Long userId);

    @Query("SELECT s FROM SplitExpense s WHERE " +
           "(s.paidBy.id = :userId1 AND s.owedBy.id = :userId2) OR " +
           "(s.paidBy.id = :userId2 AND s.owedBy.id = :userId1) " +
           "ORDER BY s.createdAt DESC")
    List<SplitExpense> findExpensesBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT s FROM SplitExpense s WHERE s.paidBy.id = :userId AND s.isSettled = false")
    List<SplitExpense> findUnsettledPaidByUser(@Param("userId") Long userId);

    @Query("SELECT s FROM SplitExpense s WHERE s.owedBy.id = :userId AND s.isSettled = false")
    List<SplitExpense> findUnsettledOwedByUser(@Param("userId") Long userId);
}
