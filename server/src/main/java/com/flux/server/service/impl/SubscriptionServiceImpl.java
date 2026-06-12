package com.flux.server.service.impl;

import com.flux.server.dto.PaymentDTO;
import com.flux.server.dto.SubscriptionDTO;
import com.flux.server.entity.Subscription;
import com.flux.server.entity.User;
import com.flux.server.repository.SubscriptionRepository;
import com.flux.server.repository.UserRepository;
import com.flux.server.service.PaymentService;
import com.flux.server.service.SubscriptionService;
import com.flux.server.utils.EncryptionUtils;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final EncryptionUtils encryptionUtils;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public SubscriptionDTO addSubscription(SubscriptionDTO subscriptionDTO) {
        User user = userRepository.findById(subscriptionDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Subscription subscription = modelMapper.map(subscriptionDTO, Subscription.class);
        subscription.setUser(user);
        
        // Encrypt sensitive details before saving
        String originalTitle = subscriptionDTO.getTitle();
        subscription.setTitle(encryptionUtils.encrypt(originalTitle));

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        SubscriptionDTO response = modelMapper.map(savedSubscription, SubscriptionDTO.class);
        response.setTitle(originalTitle);
        return response;
    }

    @Override
    @Transactional
    public SubscriptionDTO updateSubscription(Long id, SubscriptionDTO subscriptionDTO) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        subscription.setAmount(subscriptionDTO.getAmount());
        subscription.setCategory(subscriptionDTO.getCategory());
        subscription.setBillingCycle(subscriptionDTO.getBillingCycle());
        subscription.setNextBillingDate(subscriptionDTO.getNextBillingDate());
        subscription.setStatus(subscriptionDTO.getStatus());

        // Encrypt updated title
        String originalTitle = subscriptionDTO.getTitle();
        subscription.setTitle(encryptionUtils.encrypt(originalTitle));

        Subscription savedSubscription = subscriptionRepository.save(subscription);

        SubscriptionDTO response = modelMapper.map(savedSubscription, SubscriptionDTO.class);
        response.setTitle(originalTitle);
        return response;
    }

    @Override
    @Transactional
    public void deleteSubscription(Long id) {
        Subscription subscription = subscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
        subscriptionRepository.delete(subscription);
    }

    @Override
    public List<SubscriptionDTO> getSubscriptionsByUser(Long userId) {
        List<Subscription> subscriptions = subscriptionRepository.findByUserIdOrderByNextBillingDateAsc(userId);

        return subscriptions.stream().map(sub -> {
            SubscriptionDTO dto = modelMapper.map(sub, SubscriptionDTO.class);
            try {
                dto.setTitle(encryptionUtils.decrypt(sub.getTitle()));
            } catch (Exception e) {
                System.err.println("Decryption failed for subscription ID " + sub.getId());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void processRecurringPayments() {
        LocalDateTime now = LocalDateTime.now();
        List<Subscription> dueSubscriptions = subscriptionRepository.findByStatusAndNextBillingDateBefore("ACTIVE", now);

        for (Subscription sub : dueSubscriptions) {
            String decryptedTitle = "Subscription";
            try {
                decryptedTitle = encryptionUtils.decrypt(sub.getTitle());
            } catch (Exception e) {
                System.err.println("Decryption failed for due subscription ID " + sub.getId());
            }

            // Loop to catch up on missed billing cycles (e.g. if the server was down)
            while (sub.getNextBillingDate().isBefore(now)) {
                // Log a payment using the payment service (which encrypts automatically)
                PaymentDTO paymentDTO = new PaymentDTO();
                paymentDTO.setUserId(sub.getUser().getId());
                paymentDTO.setTitle(decryptedTitle);
                paymentDTO.setAmount(sub.getAmount());
                paymentDTO.setCategory(sub.getCategory());
                paymentDTO.setType("DEBIT");
                paymentDTO.setDate(sub.getNextBillingDate());
                paymentDTO.setDescription("Auto-logged payment for subscription: " + decryptedTitle);

                paymentService.addPayment(paymentDTO);

                // Advance the billing date
                sub.setNextBillingDate(advanceBillingDate(sub.getNextBillingDate(), sub.getBillingCycle()));
            }

            subscriptionRepository.save(sub);
        }
    }

    private LocalDateTime advanceBillingDate(LocalDateTime currentDate, String cycle) {
        if (cycle == null) {
            return currentDate.plusMonths(1);
        }
        switch (cycle.toUpperCase()) {
            case "WEEKLY":
                return currentDate.plusWeeks(1);
            case "YEARLY":
                return currentDate.plusYears(1);
            case "MONTHLY":
            default:
                return currentDate.plusMonths(1);
        }
    }
}
