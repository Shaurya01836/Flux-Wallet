package com.flux.server.controller;


import com.flux.server.dto.BalanceDto;
import com.flux.server.dto.PaymentDTO;
import com.flux.server.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;


    @PostMapping()
    public ResponseEntity<PaymentDTO> addPayment(@RequestBody PaymentDTO paymentDTO) {
        return ResponseEntity.ok(paymentService.addPayment(paymentDTO));

    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PaymentDTO>> getUserPayment(@PathVariable Long userId ,
                                                           @RequestParam(defaultValue = "0") int page , @RequestParam(defaultValue = "5") int size) {
        Pageable pageable = PageRequest.of(page , size) ;
        return ResponseEntity.ok(paymentService.getPaymentsByUser(userId , pageable));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<PaymentDTO> deletePayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.deletePayment(id));
    }

    @GetMapping("/balance/{userId}")
    public ResponseEntity<BalanceDto> getUserBalance(@PathVariable Long userId , @RequestParam String month) {
        return ResponseEntity.ok(paymentService.getUserBalance(userId ,month));
    }


}
