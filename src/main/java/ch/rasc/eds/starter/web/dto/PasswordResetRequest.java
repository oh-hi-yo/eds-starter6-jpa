package ch.rasc.eds.starter.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PasswordResetRequest(@NotBlank String email) {
}
