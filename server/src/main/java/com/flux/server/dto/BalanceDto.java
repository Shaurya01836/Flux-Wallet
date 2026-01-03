package com.flux.server.dto;

import lombok.Data;

@Data
public class BalanceDto {

    private Double totalCredit;
    private Double totalDebit;
    private Double balance;

}
