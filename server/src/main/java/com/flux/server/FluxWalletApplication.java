package com.flux.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FluxWalletApplication {

	public static void main(String[] args) {
		SpringApplication.run(FluxWalletApplication.class, args);
	}

}

