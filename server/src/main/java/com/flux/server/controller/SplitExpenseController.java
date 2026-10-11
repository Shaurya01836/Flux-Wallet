package com.flux.server.controller;

import com.flux.server.dto.SplitBalanceDTO;
import com.flux.server.dto.SplitExpenseDTO;
import com.flux.server.dto.UserDTO;
import com.flux.server.service.SplitExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/split")
public class SplitExpenseController {

    private final SplitExpenseService splitExpenseService;

    @PostMapping("/expense")
    public ResponseEntity<SplitExpenseDTO> addExpense(@RequestBody SplitExpenseDTO dto) {
        return ResponseEntity.ok(splitExpenseService.addExpense(dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SplitExpenseDTO>> getAllExpenses(@PathVariable Long userId) {
        return ResponseEntity.ok(splitExpenseService.getAllExpenses(userId));
    }

    @GetMapping("/between")
    public ResponseEntity<List<SplitExpenseDTO>> getExpensesBetween(
            @RequestParam Long user1,
            @RequestParam Long user2) {
        return ResponseEntity.ok(splitExpenseService.getExpensesBetween(user1, user2));
    }

    @GetMapping("/balances/{userId}")
    public ResponseEntity<SplitBalanceDTO> getBalances(@PathVariable Long userId) {
        return ResponseEntity.ok(splitExpenseService.getBalances(userId));
    }

    @PutMapping("/settle/{expenseId}")
    public ResponseEntity<SplitExpenseDTO> settleExpense(@PathVariable Long expenseId) {
        return ResponseEntity.ok(splitExpenseService.settleExpense(expenseId));
    }

    @PostMapping("/settle-friend")
    public ResponseEntity<Void> settleAllWithFriend(
            @RequestParam Long currentUserId,
            @RequestParam Long friendId) {
        splitExpenseService.settleAllWithFriend(currentUserId, friendId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/expense/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long expenseId,
            @RequestParam Long currentUserId) {
        splitExpenseService.deleteExpense(expenseId, currentUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/search-users")
    public ResponseEntity<List<UserDTO>> searchUsers(
            @RequestParam String query,
            @RequestParam Long currentUserId) {
        return ResponseEntity.ok(splitExpenseService.searchUsers(query, currentUserId));
    }

    @PostMapping("/add-friend")
    public ResponseEntity<UserDTO> addFriend(
            @RequestParam Long currentUserId,
            @RequestParam String name,
            @RequestParam String email) {
        return ResponseEntity.ok(splitExpenseService.addFriendByContact(currentUserId, name, email));
    }
}
