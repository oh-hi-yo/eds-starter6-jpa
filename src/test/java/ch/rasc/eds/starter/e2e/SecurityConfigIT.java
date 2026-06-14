package ch.rasc.eds.starter.e2e;

import static io.restassured.RestAssured.given;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import ch.rasc.eds.starter.AbstractIT;
import io.restassured.RestAssured;

class SecurityConfigIT extends AbstractIT {

	@BeforeEach
	void setUp() {
		RestAssured.port = this.port;
	}

	@Test
	void unauthenticated_protectedEndpoint_returns401() {
		given().when().get("/api/v1/users").then().statusCode(401);
	}

	@Test
	void unauthenticated_meEndpoint_returns401() {
		given().when().get("/api/v1/auth/me").then().statusCode(401);
	}

	@Test
	void healthEndpoint_isPublic() {
		given().when().get("/actuator/health").then().statusCode(200);
	}

}
