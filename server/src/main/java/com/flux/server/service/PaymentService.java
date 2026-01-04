package com.flux.server.service;

import com.flux.server.dto.BalanceDto;
import com.flux.server.dto.PaymentDTO;
import org.jspecify.annotations.Nullable;

import java.util.List;

public interface PaymentService {
    @Nullable
    PaymentDTO addPayment(PaymentDTO paymentDTO);

    @Nullable
    PaymentDTO deletePayment(Long id);

    List<PaymentDTO> getPaymentsByUser(Long userId);

    @Nullable
    BalanceDto getUserBalance(Long userId , String month);
}
