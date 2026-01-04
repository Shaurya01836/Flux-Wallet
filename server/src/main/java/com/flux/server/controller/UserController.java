package com.flux.server.controller;

import com.flux.server.dto.BudgetDto;
import com.flux.server.dto.UserDTO;
import com.flux.server.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    @PutMapping("/{id}")
    public UserDTO updateUserInfo(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        return userService.updateUserInfo(id, userDTO);
    }


    @PostMapping("/budget")
    public BudgetDto addBudget(@RequestBody BudgetDto budgetDto) {
        return userService.addBudget(budgetDto);
    }

    @GetMapping("/{userId}")
    public BudgetDto getBudget(@PathVariable Long userId , @RequestParam String month){
        return userService.getBudget(userId , month) ;
    }


}
