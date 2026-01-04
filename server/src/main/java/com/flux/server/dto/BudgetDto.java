package com.flux.server.dto;

import lombok.Data;

@Data
public class BudgetDto {
    private Double amount;
    private String month;
    private Long user_id;
}
