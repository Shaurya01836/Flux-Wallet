package com.flux.server.repository;

import com.flux.server.entity.Payment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment , Long> {

    List<Payment> findByUserIdOrderByDateDesc(Long userId , Pageable pageable);

    //  Monthly Stats
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.user.id = :userId AND p.type = 'CREDIT' AND p.date BETWEEN :startDate AND :endDate")
    Double getMonthlyCredit(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.user.id = :userId AND p.type = 'DEBIT' AND p.date BETWEEN :startDate AND :endDate")
    Double getMonthlyDebit(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

}