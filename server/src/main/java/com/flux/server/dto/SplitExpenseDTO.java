package com.flux.server.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SplitExpenseDTO {
    private Long id;
    private String title;
    private Double amount;
    private String notes;
    private String category;
    
    // User IDs & User Info
    private Long paidById;
    private String paidByName;
    private String paidByEmail;
    private String paidByPicture;

    private Long owedById;
    private String owedByName;
    private String owedByEmail;
    private String owedByPicture;

    private Boolean isSettled;
    private LocalDateTime settledAt;
    private LocalDateTime createdAt;
}
