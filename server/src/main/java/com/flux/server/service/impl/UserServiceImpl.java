package com.flux.server.service.impl;

import com.flux.server.dto.BudgetDto;
import com.flux.server.dto.UserDTO;
import com.flux.server.entity.Budget;
import com.flux.server.entity.User;
import com.flux.server.repository.BudgetRepository;
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
    private final BudgetRepository budgetRepository;
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

    @Override
    public BudgetDto addBudget(BudgetDto budgetDto) {
        User user = userRepository.findById(budgetDto.getUser_id()).orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Budget> existingBudget = budgetRepository.findByUserAndMonth(user, budgetDto.getMonth());

        Budget budget;
        if (existingBudget.isPresent()) {
            budget = existingBudget.get();
            budget.setAmount(budgetDto.getAmount());
        } else {
            budget = modelMapper.map(budgetDto, Budget.class);
            budget.setUser(user);
        }

        Budget savedBudget = budgetRepository.save(budget);
        return modelMapper.map(savedBudget, BudgetDto.class);

    }

    @Override
    public BudgetDto getBudget(Long userId, String month) {
        User user = userRepository.findById(userId).orElseThrow();

        Optional<Budget> budget = budgetRepository.findByUserAndMonth(user, month);


        if (budget.isPresent()) {
            return modelMapper.map(budget.get(), BudgetDto.class);
        } else {
            BudgetDto emptyBudget = new BudgetDto();

            emptyBudget.setAmount(0.00);
            emptyBudget.setUser_id(userId);
            emptyBudget.setMonth(month);
            return emptyBudget;
        }


    }
}