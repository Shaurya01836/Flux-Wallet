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

    // Settlement approval workflow
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "settle_requested_by_user_id")
    private User settlementRequestedBy;

    private LocalDateTime settlementRequestedAt;

    // Delete approval workflow
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "delete_requested_by_user_id")
    private User deleteRequestedBy;

    private LocalDateTime deleteRequestedAt;

    // Date of expense (defaults to now if not provided, customizable on edit)
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
