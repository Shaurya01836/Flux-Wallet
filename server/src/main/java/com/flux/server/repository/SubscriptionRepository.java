package com.flux.server.repository;

import com.flux.server.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    List<Subscription> findByUserIdOrderByNextBillingDateAsc(Long userId);
    List<Subscription> findByStatusAndNextBillingDateBefore(String status, LocalDateTime date);
}
