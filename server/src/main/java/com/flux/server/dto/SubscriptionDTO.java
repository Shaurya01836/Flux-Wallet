package com.flux.server.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SubscriptionDTO {
    private Long id;
    private String title;
    private Double amount;
    private String category;
    private String billingCycle;
    private LocalDateTime nextBillingDate;
    private String status;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
