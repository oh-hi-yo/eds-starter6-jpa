package ch.rasc.eds.starter.web;

import java.util.List;
import java.util.Locale;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ch.rasc.eds.starter.config.security.JpaUserDetails;
import ch.rasc.eds.starter.config.security.RequireAnyAuthority;
import ch.rasc.eds.starter.dto.UserSettings;
import ch.rasc.eds.starter.entity.PersistentLogin;
import ch.rasc.eds.starter.service.UserConfigService;
import ch.rasc.eds.starter.util.ServiceResult;

@RestController
@RequestMapping("/api/v1/me")
@RequireAnyAuthority
public class UserConfigController {

	private final UserConfigService userConfigService;

	public UserConfigController(UserConfigService userConfigService) {
		this.userConfigService = userConfigService;
	}

	@GetMapping("/settings")
	public UserSettings readSettings(
			@AuthenticationPrincipal JpaUserDetails userDetails) {
		return this.userConfigService.readSettings(userDetails);
	}

	@PutMapping("/settings")
	public ResponseEntity<?> updateSettings(@RequestBody @Valid UserSettings settings,
			@AuthenticationPrincipal JpaUserDetails userDetails, Locale locale) {

		ServiceResult<UserSettings> result = this.userConfigService.updateSettings(settings,
				userDetails, locale);

		if (result.isSuccess()) {
			return ResponseEntity.ok(result.data());
		}
		return ResponseEntity.unprocessableEntity().body(result.violations());
	}

	@GetMapping("/persistent-logins")
	public List<PersistentLogin> persistentLogins(
			@AuthenticationPrincipal JpaUserDetails userDetails) {
		return this.userConfigService.readPersistentLogins(userDetails);
	}

	@DeleteMapping("/persistent-logins/{series}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deletePersistentLogin(@PathVariable String series,
			@AuthenticationPrincipal JpaUserDetails userDetails) {
		this.userConfigService.destroyPersistentLogin(series, userDetails);
	}

	@PostMapping("/2fa/enable")
	public ResponseEntity<String> enable2fa(
			@AuthenticationPrincipal JpaUserDetails userDetails) {
		String secret = this.userConfigService.enable2f(userDetails);
		return ResponseEntity.ok(secret);
	}

	@DeleteMapping("/2fa")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void disable2fa(@AuthenticationPrincipal JpaUserDetails userDetails) {
		this.userConfigService.disable2f(userDetails);
	}

}
