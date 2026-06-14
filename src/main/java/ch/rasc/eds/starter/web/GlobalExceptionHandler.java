package ch.rasc.eds.starter.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	@ExceptionHandler(LockedException.class)
	ResponseEntity<ProblemDetail> handleLocked(LockedException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.LOCKED,
				"Account is locked. Please try again later.");
		pd.setTitle("Account Locked");
		return ResponseEntity.status(HttpStatus.LOCKED).body(pd);
	}

	@ExceptionHandler(DisabledException.class)
	ResponseEntity<ProblemDetail> handleDisabled(DisabledException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN,
				"Account is disabled.");
		pd.setTitle("Account Disabled");
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(pd);
	}

	@ExceptionHandler(BadCredentialsException.class)
	ResponseEntity<ProblemDetail> handleBadCredentials(BadCredentialsException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED,
				"Invalid username or password.");
		pd.setTitle("Authentication Failed");
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(pd);
	}

	@ExceptionHandler(IllegalArgumentException.class)
	ResponseEntity<ProblemDetail> handleIllegalArgument(IllegalArgumentException ex) {
		ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
				ex.getMessage());
		pd.setTitle("Bad Request");
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(pd);
	}

}
