package ch.rasc.eds.starter.web.dto;

import java.time.ZonedDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

import ch.rasc.eds.starter.entity.User;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResponse(
		Long id,
		String loginName,
		String firstName,
		String lastName,
		String email,
		String locale,
		boolean enabled,
		String authorities,
		ZonedDateTime lastAccess,
		ZonedDateTime lockedOutUntil,
		Integer failedLogins,
		boolean twoFactorAuth) {

	/** @deprecated Use {@link ch.rasc.eds.starter.web.mapper.UserMapper} instead. */
	@Deprecated
	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getLoginName(), user.getFirstName(),
				user.getLastName(), user.getEmail(), user.getLocale(), user.isEnabled(),
				user.getAuthorities(), user.getLastAccess(), user.getLockedOutUntil(),
				user.getFailedLogins(), user.isTwoFactorAuth());
	}

}
