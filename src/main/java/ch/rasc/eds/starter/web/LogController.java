package ch.rasc.eds.starter.web;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import ch.rasc.eds.starter.config.security.RequireAnyAuthority;
import ch.rasc.eds.starter.service.LogService;

@RestController
@RequestMapping("/api/v1/logs")
@RequireAnyAuthority
public class LogController {

	private final LogService logService;

	public LogController(LogService logService) {
		this.logService = logService;
	}

	@PostMapping("/crash")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logCrash(
			@RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent,
			@RequestBody Map<String, Object> crashData) {
		this.logService.logClientCrash(userAgent, crashData);
	}

}
