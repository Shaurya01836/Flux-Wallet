package com.flux.server.dto;

import lombok.Data;
import java.util.List;

@Data
public class SplitBalanceDTO {
    // Total owed to the logged in user by others (You are owed)
    private Double totalOwedToYou;
    
    // Total the logged in user owes to others (You owe)
    private Double totalYouOwe;
    
    // Net balance = totalOwedToYou - totalYouOwe
    private Double netBalance;

    // Per friend breakdown
    private List<FriendBalanceDTO> friends;

    @Data
    public static class FriendBalanceDTO {
        private Long friendId;
        private String friendName;
        private String friendEmail;
        private String friendPhoneNumber;
        private String friendPicture;
        private Boolean isOnboarded;
        // Positive if friend owes you, negative if you owe friend
        private Double netAmount;
        private Double youPaidForThem;
        private Double theyPaidForYou;
    }
}
