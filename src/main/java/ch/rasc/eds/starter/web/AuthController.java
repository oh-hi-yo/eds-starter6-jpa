package ch.rasc.eds.starter.web;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.RememberMeServices;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ch.rasc.eds.starter.config.security.JpaUserDetails;
import ch.rasc.eds.starter.config.security.RequireAdminAuthority;
import ch.rasc.eds.starter.config.security.RequireAnyAuthority;
import ch.rasc.eds.starter.dto.UserDetailDto;
import ch.rasc.eds.starter.entity.User;
import ch.rasc.eds.starter.service.SecurityService;
import ch.rasc.eds.starter.util.JPAQueryFactory;
import ch.rasc.eds.starter.web.dto.LoginRequest;
import ch.rasc.eds.starter.web.dto.LoginResponse;
import ch.rasc.eds.starter.web.dto.MeResponse;
import ch.rasc.eds.starter.web.dto.PasswordResetConfirm;
import ch.rasc.eds.starter.web.dto.PasswordResetRequest;
import ch.rasc.eds.starter.web.dto.TwoFactorRequest;
import ch.rasc.eds.starter.web.dto.UserResponse;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final SecurityService securityService;

	private final AuthenticationManager authenticationManager;

	private final RememberMeServices rememberMeServices;

	private final JPAQueryFactory jpaQueryFactory;

	private final HttpSessionSecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

	public AuthController(SecurityService securityService,
			AuthenticationManager authenticationManager,
			RememberMeServices rememberMeServices, JPAQueryFactory jpaQueryFactory) {
		this.securityService = securityService;
		this.authenticationManager = authenticationManager;
		this.rememberMeServices = rememberMeServices;
		this.jpaQueryFactory = jpaQueryFactory;
	}

	@PostMapping("/login")
	@Transactional
	public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest req,
			HttpServletRequest request, HttpServletResponse response) {

		Authentication auth = this.authenticationManager.authenticate(
				UsernamePasswordAuthenticationToken.unauthenticated(req.loginName(),
						req.password()));

		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(auth);
		SecurityContextHolder.setContext(context);
		this.securityContextRepository.saveContext(context, request, response);

		if (req.rememberMe()) {
			this.rememberMeServices.loginSuccess(request, response, auth);
		}

		JpaUserDetails userDetails = (JpaUserDetails) auth.getPrincipal();

		if (userDetails.isPreAuth()) {
			return ResponseEntity.ok(new LoginResponse(true, null));
		}

		User user = userDetails.getUser(this.jpaQueryFactory);
		user.setLastAccess(ZonedDateTime.now(ZoneOffset.UTC));

		return ResponseEntity.ok(new LoginResponse(false, MeResponse.from(userDetails, user)));
	}

	@PostMapping("/2fa")
	@PreAuthorize("hasAuthority('PRE_AUTH')")
	@Transactional
	public ResponseEntity<MeResponse> verify2fa(@RequestBody TwoFactorRequest req,
			@AuthenticationPrincipal JpaUserDetails userDetails,
			HttpServletRequest request) {

		UserDetailDto result = this.securityService.signin2fa(request, userDetails,
				req.code());

		if (result == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		User user = userDetails.getUser(this.jpaQueryFactory);
		return ResponseEntity.ok(MeResponse.from(userDetails, user));
	}

	@GetMapping("/me")
	@RequireAnyAuthority
	@Transactional(readOnly = true)
	public ResponseEntity<MeResponse> me(
			@AuthenticationPrincipal JpaUserDetails userDetails) {

		if (userDetails == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		User user = userDetails.getUser(this.jpaQueryFactory);
		if (user == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		return ResponseEntity.ok(MeResponse.from(userDetails, user));
	}

	@PostMapping("/impersonate/{userId}")
	@RequireAdminAuthority
	@Transactional(readOnly = true)
	public ResponseEntity<UserResponse> impersonate(@PathVariable Long userId) {
		UserDetailDto result = this.securityService.switchUser(userId);
		if (result == null) {
			return ResponseEntity.notFound().build();
		}

		JpaUserDetails switched = (JpaUserDetails) SecurityContextHolder.getContext()
				.getAuthentication().getPrincipal();
		User user = switched.getUser(this.jpaQueryFactory);
		return ResponseEntity.ok(UserResponse.from(user));
	}

	@PostMapping("/password-reset/request")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void passwordResetRequest(
			@RequestBody @Valid PasswordResetRequest req) {
		this.securityService.resetRequest(req.email());
	}

	@PostMapping("/password-reset")
	public ResponseEntity<MeResponse> passwordReset(
			@RequestBody @Valid PasswordResetConfirm req) {

		UserDetailDto result = this.securityService.reset(req.newPassword(),
				req.newPasswordRetype(), req.token());

		if (result == null) {
			return ResponseEntity.badRequest().build();
		}

		JpaUserDetails principal = (JpaUserDetails) SecurityContextHolder.getContext()
				.getAuthentication().getPrincipal();
		User user = principal.getUser(this.jpaQueryFactory);
		return ResponseEntity.ok(MeResponse.from(principal, user));
	}

}
