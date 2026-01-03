package com.flux.server.dto;

import com.flux.server.entity.User;
import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String username;
    private String name;
    private String pictureUrl;
    private String phoneNumber;

}