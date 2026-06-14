package ch.rasc.eds.starter.e2e;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import ch.rasc.eds.starter.AbstractIT;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

class AuthFlowIT extends AbstractIT {

	@BeforeEach
	void setUp() {
		RestAssured.port = this.port;
	}

	@Test
	void fullLoginLogoutFlow() {
		// Login
		Response loginResp = given().contentType(ContentType.JSON)
				.body("{\"loginName\":\"admin\",\"password\":\"admin\",\"rememberMe\":false}")
				.when().post("/api/v1/auth/login").then().statusCode(200)
				.body("mfaRequired", equalTo(false)).body("user", notNullValue())
				.body("user.loginName", equalTo("admin")).extract().response();

		String sessionCookie = loginResp.getCookie("JSESSIONID");
		assertThat(sessionCookie).isNotNull();

		// GET /me with session
		given().cookie("JSESSIONID", sessionCookie).when().get("/api/v1/auth/me").then()
				.statusCode(200).body("loginName", equalTo("admin"));

		// Logout
		given().cookie("JSESSIONID", sessionCookie).when()
				.post("/api/v1/auth/logout").then().statusCode(200);

		// GET /me after logout → 401
		given().cookie("JSESSIONID", sessionCookie).when().get("/api/v1/auth/me").then()
				.statusCode(401);
	}

	@Test
	void login_wrongPassword_returns401() {
		given().contentType(ContentType.JSON)
				.body("{\"loginName\":\"admin\",\"password\":\"WRONG\",\"rememberMe\":false}")
				.when().post("/api/v1/auth/login").then().statusCode(401)
				.contentType("application/problem+json")
				.body("title", equalTo("Authentication Failed"));
	}

	@Test
	void protectedEndpoint_withValidSession_returns200() {
		Response loginResp = given().contentType(ContentType.JSON)
				.body("{\"loginName\":\"admin\",\"password\":\"admin\",\"rememberMe\":false}")
				.when().post("/api/v1/auth/login").then().statusCode(200).extract()
				.response();

		String sessionCookie = loginResp.getCookie("JSESSIONID");

		given().cookie("JSESSIONID", sessionCookie).when().get("/api/v1/users").then()
				.statusCode(200).body("totalElements", notNullValue());
	}

}
