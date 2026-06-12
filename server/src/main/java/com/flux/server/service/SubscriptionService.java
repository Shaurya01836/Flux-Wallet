package com.flux.server.service;

import com.flux.server.dto.SubscriptionDTO;
import java.util.List;

public interface SubscriptionService {
    SubscriptionDTO addSubscription(SubscriptionDTO subscriptionDTO);
    SubscriptionDTO updateSubscription(Long id, SubscriptionDTO subscriptionDTO);
    void deleteSubscription(Long id);
    List<SubscriptionDTO> getSubscriptionsByUser(Long userId);
    void processRecurringPayments();
}
