package com.flux.server.service.impl;

import com.flux.server.dto.SplitBalanceDTO;
import com.flux.server.dto.SplitExpenseDTO;
import com.flux.server.dto.UserDTO;
import com.flux.server.entity.SplitExpense;
import com.flux.server.entity.User;
import com.flux.server.repository.SplitExpenseRepository;
import com.flux.server.repository.UserRepository;
import com.flux.server.service.SplitExpenseService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SplitExpenseServiceImpl implements SplitExpenseService {

    private final SplitExpenseRepository splitExpenseRepository;
    private final UserRepository userRepository;
    private final com.flux.server.repository.FriendshipRepository friendshipRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public SplitExpenseDTO addExpense(SplitExpenseDTO dto) {
        if (dto.getPaidById().equals(dto.getOwedById())) {
            throw new IllegalArgumentException("Cannot split expense with yourself");
        }

        User paidBy = userRepository.findById(dto.getPaidById())
                .orElseThrow(() -> new RuntimeException("Payer user not found"));
        User owedBy = userRepository.findById(dto.getOwedById())
                .orElseThrow(() -> new RuntimeException("Owed user not found"));

        SplitExpense expense = new SplitExpense();
        expense.setTitle(dto.getTitle());
        expense.setAmount(dto.getAmount());
        expense.setNotes(dto.getNotes());
        expense.setCategory(dto.getCategory() != null ? dto.getCategory() : "General");
        expense.setPaidBy(paidBy);
        expense.setOwedBy(owedBy);
        expense.setIsSettled(false);
        if (dto.getCreatedAt() != null) {
            expense.setCreatedAt(dto.getCreatedAt());
        }

        SplitExpense saved = splitExpenseRepository.save(expense);

        // Ensure friendship records exist mutually
        ensureFriendship(paidBy, owedBy);
        ensureFriendship(owedBy, paidBy);

        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public SplitExpenseDTO updateExpense(Long expenseId, SplitExpenseDTO dto, Long currentUserId) {
        SplitExpense expense = splitExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (!expense.getPaidBy().getId().equals(currentUserId) && !expense.getOwedBy().getId().equals(currentUserId)) {
            throw new RuntimeException("Unauthorized: you are not part of this split expense");
        }

        if (Boolean.TRUE.equals(expense.getIsSettled())) {
            throw new RuntimeException("Cannot edit an already settled expense");
        }

        if (dto.getPaidById() != null && dto.getOwedById() != null) {
            if (dto.getPaidById().equals(dto.getOwedById())) {
                throw new IllegalArgumentException("Cannot split expense with yourself");
            }
            User paidBy = userRepository.findById(dto.getPaidById())
                    .orElseThrow(() -> new RuntimeException("Payer user not found"));
            User owedBy = userRepository.findById(dto.getOwedById())
                    .orElseThrow(() -> new RuntimeException("Owed user not found"));
            expense.setPaidBy(paidBy);
            expense.setOwedBy(owedBy);
            ensureFriendship(paidBy, owedBy);
            ensureFriendship(owedBy, paidBy);
        }

        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            expense.setTitle(dto.getTitle().trim());
        }
        if (dto.getAmount() != null && dto.getAmount() > 0) {
            expense.setAmount(dto.getAmount());
        }
        if (dto.getCategory() != null) {
            expense.setCategory(dto.getCategory());
        }
        expense.setNotes(dto.getNotes() != null ? dto.getNotes().trim() : null);

        if (dto.getCreatedAt() != null) {
            expense.setCreatedAt(dto.getCreatedAt());
        }

        // Reset any pending settlement/deletion requests after an edit
        expense.setSettlementRequestedBy(null);
        expense.setSettlementRequestedAt(null);
        expense.setDeleteRequestedBy(null);
        expense.setDeleteRequestedAt(null);

        SplitExpense saved = splitExpenseRepository.save(expense);
        return mapToDTO(saved);
    }

    private void ensureFriendship(User u1, User u2) {
        if (!friendshipRepository.findByUserAndFriend(u1.getId(), u2.getId()).isPresent()) {
            com.flux.server.entity.Friendship f = new com.flux.server.entity.Friendship();
            f.setUser(u1);
            f.setFriend(u2);
            friendshipRepository.save(f);
        }
    }

    @Override
    public List<SplitExpenseDTO> getAllExpenses(Long userId) {
        List<SplitExpense> list = splitExpenseRepository.findAllUserExpenses(userId);
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public List<SplitExpenseDTO> getExpensesBetween(Long userId1, Long userId2) {
        List<SplitExpense> list = splitExpenseRepository.findExpensesBetweenUsers(userId1, userId2);
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public SplitBalanceDTO getBalances(Long userId) {
        List<SplitExpense> unpaidPaidByMe = splitExpenseRepository.findUnsettledPaidByUser(userId);
        List<SplitExpense> unpaidOwedByMe = splitExpenseRepository.findUnsettledOwedByUser(userId);

        Map<Long, User> userMap = new HashMap<>();
        Map<Long, Double> youPaidForThemMap = new HashMap<>();
        Map<Long, Double> theyPaidForYouMap = new HashMap<>();

        for (SplitExpense exp : unpaidPaidByMe) {
            Long friendId = exp.getOwedBy().getId();
            userMap.put(friendId, exp.getOwedBy());
            youPaidForThemMap.put(friendId, youPaidForThemMap.getOrDefault(friendId, 0.0) + exp.getAmount());
        }

        for (SplitExpense exp : unpaidOwedByMe) {
            Long friendId = exp.getPaidBy().getId();
            userMap.put(friendId, exp.getPaidBy());
            theyPaidForYouMap.put(friendId, theyPaidForYouMap.getOrDefault(friendId, 0.0) + exp.getAmount());
        }

        // Also fetch all explicit friends added by this user (even if 0 balance)
        List<com.flux.server.entity.Friendship> friendships = friendshipRepository.findByUserId(userId);
        for (com.flux.server.entity.Friendship f : friendships) {
            User friend = f.getFriend();
            if (!userMap.containsKey(friend.getId())) {
                userMap.put(friend.getId(), friend);
            }
        }

        double totalOwedToYou = 0.0;
        double totalYouOwe = 0.0;
        List<SplitBalanceDTO.FriendBalanceDTO> friendBalances = new ArrayList<>();

        for (Long friendId : userMap.keySet()) {
            User friend = userMap.get(friendId);
            double youPaid = youPaidForThemMap.getOrDefault(friendId, 0.0);
            double theyPaid = theyPaidForYouMap.getOrDefault(friendId, 0.0);
            double net = youPaid - theyPaid;

            if (net > 0) {
                totalOwedToYou += net;
            } else if (net < 0) {
                totalYouOwe += Math.abs(net);
            }

            SplitBalanceDTO.FriendBalanceDTO fb = new SplitBalanceDTO.FriendBalanceDTO();
            fb.setFriendId(friend.getId());
            fb.setFriendName(friend.getName());
            fb.setFriendEmail(friend.getEmail());
            fb.setFriendPhoneNumber(friend.getPhoneNumber());
            fb.setFriendPicture(friend.getPictureUrl());
            // Onboarded if user has logged in (lastLoginAt != null)
            fb.setIsOnboarded(friend.getLastLoginAt() != null);
            fb.setNetAmount(Math.round(net * 100.0) / 100.0);
            fb.setYouPaidForThem(Math.round(youPaid * 100.0) / 100.0);
            fb.setTheyPaidForYou(Math.round(theyPaid * 100.0) / 100.0);

            friendBalances.add(fb);
        }

        // Sort friend balances: non-zero balances first, then alphabetically
        friendBalances.sort((a, b) -> {
            int cmp = Double.compare(Math.abs(b.getNetAmount()), Math.abs(a.getNetAmount()));
            if (cmp != 0) return cmp;
            return a.getFriendName().compareToIgnoreCase(b.getFriendName());
        });

        SplitBalanceDTO result = new SplitBalanceDTO();
        result.setTotalOwedToYou(Math.round(totalOwedToYou * 100.0) / 100.0);
        result.setTotalYouOwe(Math.round(totalYouOwe * 100.0) / 100.0);
        result.setNetBalance(Math.round((totalOwedToYou - totalYouOwe) * 100.0) / 100.0);
        result.setFriends(friendBalances);

        return result;
    }

    @Override
    @Transactional
    public UserDTO addFriendByContact(Long currentUserId, String name, String email) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Friend's name is required");
        }
        String cleanName = name.trim();

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        User friendUser;

        if (email != null && !email.trim().isEmpty() && email.contains("@")) {
            String cleanEmail = email.trim().toLowerCase();
            if (currentUser.getEmail() != null && currentUser.getEmail().equalsIgnoreCase(cleanEmail)) {
                throw new IllegalArgumentException("You cannot add yourself as a friend");
            }

            Optional<User> existing = userRepository.findByEmail(cleanEmail);
            if (existing.isPresent()) {
                friendUser = existing.get();
            } else {
                friendUser = new User();
                friendUser.setName(cleanName);
                friendUser.setEmail(cleanEmail);
                friendUser.setCreatedAt(LocalDateTime.now());
                friendUser = userRepository.save(friendUser);
            }
        } else {
            // No email provided: create an offline dummy friend placeholder
            String dummyEmail = "offline_" + UUID.randomUUID().toString().substring(0, 8) + "@offline.flux";
            friendUser = new User();
            friendUser.setName(cleanName);
            friendUser.setEmail(dummyEmail);
            friendUser.setCreatedAt(LocalDateTime.now());
            friendUser = userRepository.save(friendUser);
        }

        // Add Friendship for current user if not already present
        if (!friendshipRepository.findByUserAndFriend(currentUser.getId(), friendUser.getId()).isPresent()) {
            com.flux.server.entity.Friendship f = new com.flux.server.entity.Friendship();
            f.setUser(currentUser);
            f.setFriend(friendUser);
            friendshipRepository.save(f);
        }

        return modelMapper.map(friendUser, UserDTO.class);
    }

    @Override
    @Transactional
    public UserDTO linkFriendEmail(Long currentUserId, Long friendId, String newEmail) {
        if (newEmail == null || newEmail.trim().isEmpty() || !newEmail.contains("@")) {
            throw new IllegalArgumentException("A valid email address is required");
        }
        String cleanEmail = newEmail.trim().toLowerCase();

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (currentUser.getEmail() != null && currentUser.getEmail().equalsIgnoreCase(cleanEmail)) {
            throw new IllegalArgumentException("You cannot link your own email to a friend");
        }

        User friendUser = userRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend record not found"));

        Optional<User> existingUserWithEmail = userRepository.findByEmail(cleanEmail);

        if (existingUserWithEmail.isPresent()) {
            User targetUser = existingUserWithEmail.get();

            if (targetUser.getId().equals(friendId)) {
                return modelMapper.map(targetUser, UserDTO.class);
            }

            // Merge friendUser (dummy/placeholder) into targetUser
            // 1. Reassign all SplitExpenses where friendUser was paidBy
            List<SplitExpense> expensesPaidByFriend = splitExpenseRepository.findAll()
                    .stream()
                    .filter(e -> e.getPaidBy().getId().equals(friendId))
                    .collect(Collectors.toList());
            for (SplitExpense exp : expensesPaidByFriend) {
                exp.setPaidBy(targetUser);
                splitExpenseRepository.save(exp);
            }

            // 2. Reassign all SplitExpenses where friendUser was owedBy
            List<SplitExpense> expensesOwedByFriend = splitExpenseRepository.findAll()
                    .stream()
                    .filter(e -> e.getOwedBy().getId().equals(friendId))
                    .collect(Collectors.toList());
            for (SplitExpense exp : expensesOwedByFriend) {
                exp.setOwedBy(targetUser);
                splitExpenseRepository.save(exp);
            }

            // 3. Re-link friendships
            ensureFriendship(currentUser, targetUser);

            // Clean up old dummy friendship
            friendshipRepository.findByUserAndFriend(currentUserId, friendId)
                    .ifPresent(friendshipRepository::delete);
            friendshipRepository.findByUserAndFriend(friendId, currentUserId)
                    .ifPresent(friendshipRepository::delete);

            // If friendUser was an unboarded dummy/offline user, delete it
            if (friendUser.getLastLoginAt() == null && (friendUser.getEmail() == null || friendUser.getEmail().endsWith("@offline.flux"))) {
                userRepository.delete(friendUser);
            }

            return modelMapper.map(targetUser, UserDTO.class);
        } else {
            // No user has this email yet - simply update the friend's email
            friendUser.setEmail(cleanEmail);
            User saved = userRepository.save(friendUser);
            return modelMapper.map(saved, UserDTO.class);
        }
    }

    @Override
    @Transactional
    public SplitExpenseDTO settleExpense(Long expenseId, Long currentUserId) {
        SplitExpense exp = splitExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        if (Boolean.TRUE.equals(exp.getIsSettled())) {
            return mapToDTO(exp);
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        boolean isPaidBy = exp.getPaidBy().getId().equals(currentUserId);
        boolean isOwedBy = exp.getOwedBy().getId().equals(currentUserId);

        if (!isPaidBy && !isOwedBy) {
            throw new RuntimeException("Unauthorized: you are not part of this split expense");
        }

        User otherUser = isPaidBy ? exp.getOwedBy() : exp.getPaidBy();
        boolean otherIsOffline = otherUser.getLastLoginAt() == null || 
                (otherUser.getEmail() != null && otherUser.getEmail().endsWith("@offline.flux"));

        // Rule:
        // 1. If current user is owed the money (paidBy), they can instantly settle,
        //    OR if the other user is offline/dummy (cannot log in to approve), settle immediately.
        // 2. If other user already requested settlement, current user confirms it -> settled!
        if (isPaidBy || otherIsOffline || 
            (exp.getSettlementRequestedBy() != null && !exp.getSettlementRequestedBy().getId().equals(currentUserId))) {
            exp.setIsSettled(true);
            exp.setSettledAt(LocalDateTime.now());
            exp.setSettlementRequestedBy(null);
            exp.setSettlementRequestedAt(null);
        } else {
            // Current user is the debtor (owedBy) -> mark settlement requested so creditor must approve
            exp.setSettlementRequestedBy(currentUser);
            exp.setSettlementRequestedAt(LocalDateTime.now());
        }

        SplitExpense saved = splitExpenseRepository.save(exp);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public SplitExpenseDTO rejectSettleExpense(Long expenseId, Long currentUserId) {
        SplitExpense exp = splitExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        exp.setSettlementRequestedBy(null);
        exp.setSettlementRequestedAt(null);
        SplitExpense saved = splitExpenseRepository.save(exp);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public void settleAllWithFriend(Long currentUserId, Long friendId) {
        List<SplitExpense> expenses = splitExpenseRepository.findExpensesBetweenUsers(currentUserId, friendId);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new RuntimeException("Friend not found"));

        boolean friendIsOffline = friend.getLastLoginAt() == null || 
                (friend.getEmail() != null && friend.getEmail().endsWith("@offline.flux"));

        LocalDateTime now = LocalDateTime.now();
        boolean changed = false;
        boolean settledAny = false;
        boolean requestedAny = false;
        for (SplitExpense exp : expenses) {
            if (!Boolean.TRUE.equals(exp.getIsSettled())) {
                changed = true;
                boolean isPaidBy = exp.getPaidBy().getId().equals(currentUserId);
                if (isPaidBy || friendIsOffline || 
                    (exp.getSettlementRequestedBy() != null && !exp.getSettlementRequestedBy().getId().equals(currentUserId))) {
                    exp.setIsSettled(true);
                    exp.setSettledAt(now);
                    exp.setSettlementRequestedBy(null);
                    exp.setSettlementRequestedAt(null);
                    settledAny = true;
                } else {
                    exp.setSettlementRequestedBy(currentUser);
                    exp.setSettlementRequestedAt(now);
                    requestedAny = true;
                }
                splitExpenseRepository.save(exp);
            }
        }

        // Create a distinct settlement record in activity so the user can see
        // "settled all" performed at this date (separate from normal expenses).
        if (changed) {
            SplitExpense settlement = new SplitExpense();
            if (settledAny && !requestedAny) {
                settlement.setTitle("Settled All");
                settlement.setNotes("All pending balances settled on this date.");
                settlement.setCategory("Settlement");
            } else if (requestedAny && !settledAny) {
                settlement.setTitle("Settle All Requested");
                settlement.setNotes("Settlement request sent for approval.");
                settlement.setCategory("Settlement Request");
            } else {
                settlement.setTitle("Settle All");
                settlement.setNotes("Settlement completed where possible; some requests sent for approval.");
                settlement.setCategory("Settlement");
            }
            settlement.setAmount(0.0);
            settlement.setPaidBy(currentUser);
            settlement.setOwedBy(friend);
            settlement.setIsSettled(settledAny && !requestedAny);
            settlement.setSettledAt(settledAny && !requestedAny ? now : null);
            settlement.setCreatedAt(now);
            splitExpenseRepository.save(settlement);
            ensureFriendship(currentUser, friend);
            ensureFriendship(friend, currentUser);
        }
    }

    @Override
    @Transactional
    public void deleteExpense(Long expenseId, Long currentUserId) {
        SplitExpense exp = splitExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        boolean isPaidBy = exp.getPaidBy().getId().equals(currentUserId);
        boolean isOwedBy = exp.getOwedBy().getId().equals(currentUserId);

        if (!isPaidBy && !isOwedBy) {
            throw new RuntimeException("Unauthorized to delete this expense");
        }

        User otherUser = isPaidBy ? exp.getOwedBy() : exp.getPaidBy();
        boolean otherIsOffline = otherUser.getLastLoginAt() == null || 
                (otherUser.getEmail() != null && otherUser.getEmail().endsWith("@offline.flux"));

        // If other user is offline, OR expense already settled, OR other user already requested deletion -> delete immediately
        if (Boolean.TRUE.equals(exp.getIsSettled()) || otherIsOffline || 
            (exp.getDeleteRequestedBy() != null && !exp.getDeleteRequestedBy().getId().equals(currentUserId))) {
            splitExpenseRepository.delete(exp);
        } else {
            // Payer or debtor requests delete -> notify/require approval from other party
            User currentUser = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
            exp.setDeleteRequestedBy(currentUser);
            exp.setDeleteRequestedAt(LocalDateTime.now());
            splitExpenseRepository.save(exp);
        }
    }

    @Override
    @Transactional
    public SplitExpenseDTO rejectDeleteExpense(Long expenseId, Long currentUserId) {
        SplitExpense exp = splitExpenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        exp.setDeleteRequestedBy(null);
        exp.setDeleteRequestedAt(null);
        SplitExpense saved = splitExpenseRepository.save(exp);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public void deleteFriend(Long currentUserId, Long friendId) {
        // Remove friendship records in both directions if any
        friendshipRepository.findByUserAndFriend(currentUserId, friendId)
                .ifPresent(friendshipRepository::delete);
        friendshipRepository.findByUserAndFriend(friendId, currentUserId)
                .ifPresent(friendshipRepository::delete);

        // Retain split expenses in DB so transaction history, audits, and settlement records are never lost
    }

    @Override
    public List<UserDTO> searchUsers(String query, Long currentUserId) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String cleanQuery = query.trim().toLowerCase();
        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .filter(u -> (u.getEmail() != null && u.getEmail().toLowerCase().contains(cleanQuery)) ||
                             (u.getName() != null && u.getName().toLowerCase().contains(cleanQuery)) ||
                             (u.getUsername() != null && u.getUsername().toLowerCase().contains(cleanQuery)))
                .limit(10)
                .map(u -> modelMapper.map(u, UserDTO.class))
                .collect(Collectors.toList());
    }

    private SplitExpenseDTO mapToDTO(SplitExpense entity) {
        SplitExpenseDTO dto = new SplitExpenseDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setAmount(entity.getAmount());
        dto.setNotes(entity.getNotes());
        dto.setCategory(entity.getCategory());
        dto.setIsSettled(entity.getIsSettled());
        dto.setSettledAt(entity.getSettledAt());
        dto.setCreatedAt(entity.getCreatedAt());

        if (entity.getSettlementRequestedBy() != null) {
            dto.setSettleRequestedById(entity.getSettlementRequestedBy().getId());
            dto.setSettleRequestedByName(entity.getSettlementRequestedBy().getName());
            dto.setSettlementRequestedAt(entity.getSettlementRequestedAt());
        }

        if (entity.getDeleteRequestedBy() != null) {
            dto.setDeleteRequestedById(entity.getDeleteRequestedBy().getId());
            dto.setDeleteRequestedByName(entity.getDeleteRequestedBy().getName());
            dto.setDeleteRequestedAt(entity.getDeleteRequestedAt());
        }

        if (entity.getPaidBy() != null) {
            dto.setPaidById(entity.getPaidBy().getId());
            dto.setPaidByName(entity.getPaidBy().getName());
            dto.setPaidByEmail(entity.getPaidBy().getEmail());
            dto.setPaidByPicture(entity.getPaidBy().getPictureUrl());
        }

        if (entity.getOwedBy() != null) {
            dto.setOwedById(entity.getOwedBy().getId());
            dto.setOwedByName(entity.getOwedBy().getName());
            dto.setOwedByEmail(entity.getOwedBy().getEmail());
            dto.setOwedByPicture(entity.getOwedBy().getPictureUrl());
        }

        return dto;
    }
}
