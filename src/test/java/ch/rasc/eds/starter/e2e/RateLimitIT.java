package ch.rasc.eds.starter.e2e;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.not;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import ch.rasc.eds.starter.AbstractIT;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

@TestPropertySource(properties = "app.rate-limit-capacity=2")
class RateLimitIT extends AbstractIT {

	@BeforeEach
	void setUp() {
		RestAssured.port = this.port;
	}

	@Test
	void loginEndpoint_rateLimit_returns429OnExcess() {
		// Use a unique RFC 5737 documentation IP so this test doesn't share
		// bucket state with other IT tests running in the same context.
		String testIp = "192.0.2.1";
		String body = "{\"loginName\":\"nobody\",\"password\":\"wrong\",\"rememberMe\":false}";

		// First 2 requests: bucket has 2 tokens → should NOT be rate limited
		for (int i = 0; i < 2; i++) {
			given().contentType(ContentType.JSON)
					.header("X-Forwarded-For", testIp)
					.body(body)
					.when().post("/api/v1/auth/login")
					.then().statusCode(not(429));
		}

		// 3rd request: bucket exhausted → 429
		given().contentType(ContentType.JSON)
				.header("X-Forwarded-For", testIp)
				.body(body)
				.when().post("/api/v1/auth/login")
				.then().statusCode(429);
	}

}
