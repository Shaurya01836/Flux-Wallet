package com.flux.server.service;

import com.flux.server.dto.UserDTO;
import com.flux.server.entity.User;

import java.util.Optional;

public interface UserService {
    UserDTO handleGoogleLogin(String email, String name, String pictureUrl);

    UserDTO updateUserInfo(Long id, UserDTO userDTO);


}