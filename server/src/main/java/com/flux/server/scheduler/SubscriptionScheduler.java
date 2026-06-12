package com.flux.server.scheduler;

import com.flux.server.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SubscriptionScheduler {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionScheduler.class);
    private final SubscriptionService subscriptionService;

    // Run every hour at the top of the hour
    @Scheduled(cron = "0 0 * * * *")
    public void runRecurringPaymentProcessor() {
        log.info("Starting scheduled processing of recurring payments...");
        try {
            subscriptionService.processRecurringPayments();
            log.info("Completed scheduled processing of recurring payments.");
        } catch (Exception e) {
            log.error("Failed to process recurring payments", e);
        }
    }
}
