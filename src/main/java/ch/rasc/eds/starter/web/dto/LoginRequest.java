package ch.rasc.eds.starter.web.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
		@NotBlank String loginName,
		@NotBlank String password,
		boolean rememberMe) {
}
