package com.flux.server.dto;

import com.flux.server.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String username;
    private String name;
    private String pictureUrl;
    private String phoneNumber;
    private LocalDateTime createdAt;

}