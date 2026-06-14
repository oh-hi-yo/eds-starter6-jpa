package ch.rasc.eds.starter.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(boolean mfaRequired, MeResponse user) {
}
