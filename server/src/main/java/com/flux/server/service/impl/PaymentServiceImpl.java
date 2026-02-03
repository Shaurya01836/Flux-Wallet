package com.flux.server.service.impl;

import com.flux.server.dto.BalanceDto;
import com.flux.server.dto.PaymentDTO;
import com.flux.server.entity.Payment;
import com.flux.server.entity.User;
import com.flux.server.repository.PaymentRepository;
import com.flux.server.repository.UserRepository;
import com.flux.server.service.PaymentService;
import com.flux.server.utils.EncryptionUtils;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Pageable;
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
    private final EncryptionUtils encryptionUtils;


    @Override
    public @Nullable PaymentDTO addPayment(PaymentDTO paymentDTO) {

        User user = userRepository.findById(paymentDTO.getUserId()).orElseThrow
                (() -> new RuntimeException("User not found"));

        Payment payment = modelMapper.map(paymentDTO, Payment.class);
        payment.setUser(user);
        payment.setDate(paymentDTO.getDate());

        String originalTitle = payment.getTitle();
        String originalDescription = payment.getDescription();

        //encrypt the data
        payment.setTitle(encryptionUtils.encrypt(originalTitle));
        if((payment.getDescription() != null) && !payment.getDescription().isEmpty())
            payment.setDescription(encryptionUtils.encrypt(originalDescription));

        paymentRepository.save(payment);

        PaymentDTO responseData = modelMapper.map(payment, PaymentDTO.class);

        responseData.setTitle(originalTitle);
        responseData.setDescription(originalDescription);

        return responseData;

    }

    @Override
    public @Nullable PaymentDTO deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        paymentRepository.delete(payment);
        PaymentDTO responseData = modelMapper.map(payment, PaymentDTO.class);

        //decrypt the data
        responseData.setTitle(encryptionUtils.decrypt(responseData.getTitle()));
        String originalDescription = responseData.getDescription() ;
        if(((originalDescription) != null) && !originalDescription.isEmpty())
            responseData.setDescription(encryptionUtils.decrypt(originalDescription));

        return responseData;
    }

    @Override
    public List<PaymentDTO> getPaymentsByUser(Long userId, Pageable pageable) {

        List<Payment> payments = paymentRepository.findByUserIdOrderByDateDesc(userId, pageable);


        return payments.stream().map(payment -> {
            PaymentDTO dto = modelMapper.map(payment, PaymentDTO.class);

            try {
                dto.setTitle(encryptionUtils.decrypt(payment.getTitle()));

                if (payment.getDescription() != null && !payment.getDescription().isEmpty()) {
                    dto.setDescription(encryptionUtils.decrypt(payment.getDescription()));
                }
            } catch (Exception e) {

                System.err.println("Decryption failed for payment ID " + payment.getId());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public @Nullable BalanceDto getUserBalance(Long userId, String month) {

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
