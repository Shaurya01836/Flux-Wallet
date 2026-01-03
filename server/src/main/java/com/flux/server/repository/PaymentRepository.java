package com.flux.server.repository;

import com.flux.server.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment , Long> {

    List<Payment> findByUserIdOrderByDateDesc(Long userId);


    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.user.id = :userId AND p.type = 'CREDIT'")
    Double getTotalCredit(@Param("userId") Long userId);


    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.user.id = :userId AND p.type = 'DEBIT'")
    Double getTotalDebit(@Param("userId") Long userId);

}
