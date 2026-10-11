package com.flux.server.service;

import com.flux.server.dto.SplitBalanceDTO;
import com.flux.server.dto.SplitExpenseDTO;
import com.flux.server.dto.UserDTO;

import java.util.List;

public interface SplitExpenseService {
    SplitExpenseDTO addExpense(SplitExpenseDTO dto);

    SplitExpenseDTO updateExpense(Long expenseId, SplitExpenseDTO dto, Long currentUserId);
    
    List<SplitExpenseDTO> getAllExpenses(Long userId);

    List<SplitExpenseDTO> getExpensesBetween(Long userId1, Long userId2);

    SplitBalanceDTO getBalances(Long userId);

    SplitExpenseDTO settleExpense(Long expenseId, Long currentUserId);

    SplitExpenseDTO rejectSettleExpense(Long expenseId, Long currentUserId);

    void settleAllWithFriend(Long currentUserId, Long friendId);

    void deleteExpense(Long expenseId, Long currentUserId);

    SplitExpenseDTO rejectDeleteExpense(Long expenseId, Long currentUserId);

    List<UserDTO> searchUsers(String query, Long currentUserId);

    UserDTO addFriendByContact(Long currentUserId, String name, String email);

    UserDTO linkFriendEmail(Long currentUserId, Long friendId, String newEmail);

    void deleteFriend(Long currentUserId, Long friendId);
}
