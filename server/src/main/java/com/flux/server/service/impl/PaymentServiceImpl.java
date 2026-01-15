package com.flux.server.service.impl;

import com.flux.server.dto.BalanceDto;
import com.flux.server.dto.PaymentDTO;
import com.flux.server.entity.Payment;
import com.flux.server.entity.User;
import com.flux.server.repository.PaymentRepository;
import com.flux.server.repository.UserRepository;
import com.flux.server.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;


    @Override
    public @Nullable PaymentDTO addPayment(PaymentDTO paymentDTO) {

        User user = userRepository.findById(paymentDTO.getUserId()).orElseThrow
                (() -> new RuntimeException("User not found"));

        Payment payment = modelMapper.map(paymentDTO, Payment.class);
        payment.setUser(user);

        paymentRepository.save(payment);
        return modelMapper.map(payment, PaymentDTO.class);

    }

    @Override
    public @Nullable PaymentDTO deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        paymentRepository.delete(payment);
        return modelMapper.map(payment, PaymentDTO.class);
    }

    @Override
    public @Nullable List<PaymentDTO> getPaymentsByUser(Long userId) {

        List<Payment> payments = paymentRepository.findByUserIdOrderByDateDesc(userId);

        return payments.stream().map(payment ->
                modelMapper.map(payment, PaymentDTO.class)).collect(Collectors.toList());
    }

    @Override
    public @Nullable BalanceDto getUserBalance(Long userId , String month) {

        LocalDate start = LocalDate.parse(month + "-01");
        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = start.plusMonths(1).atStartOfDay();

        Double monthlyCredit = paymentRepository.getMonthlyCredit(userId, startDateTime, endDateTime);
        Double monthlyDebit = paymentRepository.getMonthlyDebit(userId, startDateTime, endDateTime);

        if (monthlyCredit == null) monthlyCredit = 0.0;
        if (monthlyDebit == null) monthlyDebit = 0.0;

        BalanceDto balanceDto = new BalanceDto();
        balanceDto.setMonthlyCredit(monthlyCredit);
        balanceDto.setMonthlyDebit(monthlyDebit);

        return balanceDto;
    }


}
