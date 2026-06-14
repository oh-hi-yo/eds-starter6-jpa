package ch.rasc.eds.starter.web;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ch.rasc.eds.starter.config.security.RequireAdminAuthority;
import ch.rasc.eds.starter.entity.User;
import ch.rasc.eds.starter.service.UserService;
import ch.rasc.eds.starter.util.ServiceResult;
import ch.rasc.eds.starter.web.dto.PageResult;
import ch.rasc.eds.starter.web.dto.UserResponse;

@RestController
@RequestMapping("/api/v1/users")
@RequireAdminAuthority
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	public PageResult<UserResponse> list(
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "25") int size,
			@RequestParam(required = false) String q) {

		Page<User> result = this.userService.read(page, size, q);
		Page<UserResponse> mapped = result.map(UserResponse::from);
		return PageResult.from(mapped);
	}

	@PutMapping
	public ResponseEntity<?> createOrUpdate(@RequestBody @Valid User user, Locale locale) {
		ServiceResult<User> result = this.userService.update(user, locale);
		if (result.isSuccess()) {
			return ResponseEntity.ok(UserResponse.from(result.data()));
		}
		return ResponseEntity.unprocessableEntity().body(result.violations());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		boolean deleted = this.userService.destroy(id);
		return deleted ? ResponseEntity.noContent().build()
				: ResponseEntity.status(HttpStatus.CONFLICT).build();
	}

	@GetMapping("/authorities")
	public List<Map<String, String>> authorities() {
		return this.userService.readAuthorities();
	}

	@PostMapping("/{id}/unlock")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void unlock(@PathVariable Long id) {
		this.userService.unlock(id);
	}

	@DeleteMapping("/{id}/2fa")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void disable2fa(@PathVariable Long id) {
		this.userService.disableTwoFactorAuth(id);
	}

	@PostMapping("/{id}/password-reset-email")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void sendPasswordResetEmail(@PathVariable Long id) {
		this.userService.sendPassordResetEmail(id);
	}

}
