package ch.rasc.eds.starter.web.dto;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonInclude;

import ch.rasc.eds.starter.config.security.JpaUserDetails;
import ch.rasc.eds.starter.entity.Authority;
import ch.rasc.eds.starter.entity.User;
import org.springframework.util.StringUtils;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MeResponse(
		Long id,
		String loginName,
		String firstName,
		String lastName,
		String email,
		boolean enabled,
		boolean twoFactorAuth,
		List<String> authorities,
		String locale,
		long lastAccess,
		String autoOpenView,
		boolean preAuth) {

	public static MeResponse from(JpaUserDetails userDetails, User user) {
		String autoOpenView;
		if (userDetails.hasAuthority(Authority.ADMIN.name())) {
			autoOpenView = "users";
		}
		else if (userDetails.hasAuthority(Authority.USER.name())) {
			autoOpenView = "blank";
		}
		else {
			autoOpenView = null;
		}

		List<String> auths;
		if (StringUtils.hasText(user.getAuthorities())) {
			auths = Arrays.stream(user.getAuthorities().split(","))
					.map(String::trim)
					.filter(s -> !s.isEmpty())
					.collect(Collectors.toList());
		}
		else {
			auths = Collections.emptyList();
		}

		long lastAccessEpoch = user.getLastAccess() != null
				? user.getLastAccess().toInstant().toEpochMilli()
				: 0L;

		return new MeResponse(
				user.getId(),
				user.getLoginName(),
				user.getFirstName(),
				user.getLastName(),
				user.getEmail(),
				user.isEnabled(),
				user.isTwoFactorAuth(),
				auths,
				user.getLocale(),
				lastAccessEpoch,
				autoOpenView,
				userDetails.isPreAuth());
	}

}
