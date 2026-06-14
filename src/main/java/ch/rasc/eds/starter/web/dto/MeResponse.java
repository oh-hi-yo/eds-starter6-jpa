package ch.rasc.eds.starter.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import ch.rasc.eds.starter.config.security.JpaUserDetails;
import ch.rasc.eds.starter.entity.Authority;
import ch.rasc.eds.starter.entity.User;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MeResponse(
		String loginName,
		String firstName,
		String lastName,
		String locale,
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
		return new MeResponse(user.getLoginName(), user.getFirstName(), user.getLastName(),
				user.getLocale(), autoOpenView, userDetails.isPreAuth());
	}

}
