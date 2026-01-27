package com.flux.server.entity;


import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String type;

    private String description;

    @Column(nullable = false)
    private String category ;

    @Column(nullable = false)
    private LocalDateTime date;

    @ManyToOne()
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


}
