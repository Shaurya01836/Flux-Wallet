package com.flux.server.service.impl;

import com.flux.server.dto.UserDTO;
import com.flux.server.entity.User;
import com.flux.server.repository.UserRepository;
import com.flux.server.service.UserService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    public UserDTO handleGoogleLogin(String email, String name, String pictureUrl) {
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setLastLoginAt(LocalDateTime.now());
            user.setPictureUrl(pictureUrl);
            user.setName(name);
        } else {
            user = new User();
            user.setEmail(email);
            user.setPictureUrl(pictureUrl);
            user.setName(name);
            user.setLastLoginAt(LocalDateTime.now());
        }

        User savedUser = userRepository.save(user);

        return modelMapper.map(savedUser, UserDTO.class);
    }

    @Override
    public UserDTO updateUserInfo(Long id, UserDTO userDTO) {

        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (userDTO.getUsername() != null && !userDTO.getUsername().isEmpty()) {

            if (userRepository.findByUsername(userDTO.getUsername()).isPresent()) {
                throw new RuntimeException("Username is present");
            } else {
                user.setUsername(userDTO.getUsername());
            }

        }

        if (userDTO.getPhoneNumber() != null && !userDTO.getPhoneNumber().isEmpty()) {
            user.setPhoneNumber(userDTO.getPhoneNumber());
        }


        User savedUser = userRepository.save(user);

        return modelMapper.map(savedUser, UserDTO.class);
    }
}