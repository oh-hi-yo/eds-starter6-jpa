package ch.rasc.eds.starter.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetConfirm(
		@NotBlank String token,
		@NotBlank String newPassword,
		@NotBlank String newPasswordRetype) {
}
