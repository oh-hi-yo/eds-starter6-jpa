package ch.rasc.eds.starter.config.security;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class TwoFactorFilter extends OncePerRequestFilter {

	private static final String TWO_FA_PATH = "/api/v1/auth/2fa";

	@Override
	protected void doFilterInternal(HttpServletRequest request,
			HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		Authentication auth = SecurityContextHolder.getContext().getAuthentication();

		if (auth != null && auth.isAuthenticated()
				&& auth.getPrincipal() instanceof JpaUserDetails userDetails
				&& userDetails.isPreAuth()) {

			if (!TWO_FA_PATH.equals(request.getRequestURI())) {
				response.setStatus(HttpStatus.FORBIDDEN.value());
				response.setContentType(MediaType.APPLICATION_JSON_VALUE);
				response.getWriter().print(
						"{\"status\":403,\"title\":\"2FA Required\",\"detail\":\"Complete two-factor authentication first\"}");
				return;
			}
		}

		filterChain.doFilter(request, response);
	}

}
