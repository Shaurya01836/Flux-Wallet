package com.flux.server.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentDTO {

    private Long id;
    private String title;
    private Double amount;
    private String description;
    private String category ;
    private String type;
    private LocalDateTime date;
    private Long userId;

}
