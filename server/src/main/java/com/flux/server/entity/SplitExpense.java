package com.flux.server.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "split_expenses")
public class SplitExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Double amount;

    private String notes;

    private String category;

    // Who paid the bill
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "paid_by_user_id", nullable = false)
    private User paidBy;

    // Who owes the money (or who it was paid for)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owed_by_user_id", nullable = false)
    private User owedBy;

    @Column(nullable = false)
    private Boolean isSettled = false;

    private LocalDateTime settledAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
