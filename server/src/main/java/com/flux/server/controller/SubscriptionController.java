package com.flux.server.controller;

import com.flux.server.dto.SubscriptionDTO;
import com.flux.server.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<SubscriptionDTO> addSubscription(@RequestBody SubscriptionDTO subscriptionDTO) {
        return ResponseEntity.ok(subscriptionService.addSubscription(subscriptionDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionDTO> updateSubscription(@PathVariable Long id, @RequestBody SubscriptionDTO subscriptionDTO) {
        return ResponseEntity.ok(subscriptionService.updateSubscription(id, subscriptionDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubscription(@PathVariable Long id) {
        subscriptionService.deleteSubscription(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SubscriptionDTO>> getSubscriptionsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionsByUser(userId));
    }

    @PostMapping("/process-due")
    public ResponseEntity<String> triggerProcessDue() {
        subscriptionService.processRecurringPayments();
        return ResponseEntity.ok("Successfully processed due subscriptions.");
    }
}
