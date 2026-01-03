package com.flux.server.controller;

import com.flux.server.dto.UserDTO;
import com.flux.server.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/google")
    public ResponseEntity<UserDTO> googleLogin(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String pictureUrl = payload.get("picture");
        String name = payload.get("name");

        if (email == null) {
            return ResponseEntity.badRequest().build();
        }


        UserDTO userDto = userService.handleGoogleLogin(email, name, pictureUrl);

        return ResponseEntity.ok(userDto);
    }
}