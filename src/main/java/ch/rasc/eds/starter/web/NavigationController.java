package ch.rasc.eds.starter.web;

import java.util.List;
import java.util.Locale;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ch.rasc.eds.starter.config.security.JpaUserDetails;
import ch.rasc.eds.starter.config.security.RequireAnyAuthority;
import ch.rasc.eds.starter.dto.NavigationNode;
import ch.rasc.eds.starter.service.NavigationService;

@RestController
@RequestMapping("/api/v1/navigation")
@RequireAnyAuthority
public class NavigationController {

	private final NavigationService navigationService;

	public NavigationController(NavigationService navigationService) {
		this.navigationService = navigationService;
	}

	@GetMapping
	public List<NavigationNode> getNavigation(Locale locale,
			@AuthenticationPrincipal JpaUserDetails userDetails) {
		return this.navigationService.getNavigation(locale, userDetails);
	}

}
