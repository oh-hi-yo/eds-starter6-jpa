package ch.rasc.eds.starter.e2e;

import static io.restassured.RestAssured.given;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;


import ch.rasc.eds.starter.AbstractIT;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

class LockoutIT extends AbstractIT {

	@Autowired
	JdbcTemplate jdbcTemplate;

	@BeforeEach
	void resetFailedLogins() {
		RestAssured.port = this.port;
		this.jdbcTemplate.update(
				"UPDATE app_user SET failed_logins = NULL, locked_out_until = NULL WHERE login_name = 'user'");
	}

	@Test
	void threeFailedLogins_locksAccount_fourthReturns423() {
		// 3 failed login attempts triggers lockout (login-lock-attempts=3 in test profile)
		for (int i = 0; i < 3; i++) {
			given().contentType(ContentType.JSON).body(
					"{\"loginName\":\"user\",\"password\":\"WRONG\",\"rememberMe\":false}")
					.when().post("/api/v1/auth/login").then().statusCode(401);
		}

		// Verify lockedOutUntil was written to DB — use JdbcTemplate to bypass JPA L1 cache
		var lockedOutUntil = this.jdbcTemplate.queryForObject(
				"SELECT locked_out_until FROM app_user WHERE login_name = 'user'",
				java.sql.Timestamp.class);
		Assertions.assertThat(lockedOutUntil).isNotNull();

		// Next attempt → 423 Locked
		given().contentType(ContentType.JSON)
				.body("{\"loginName\":\"user\",\"password\":\"WRONG\",\"rememberMe\":false}")
				.when().post("/api/v1/auth/login").then().statusCode(423);
	}

}
