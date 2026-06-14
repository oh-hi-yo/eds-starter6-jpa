package ch.rasc.eds.starter.e2e;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.notNullValue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import ch.rasc.eds.starter.AbstractIT;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

class UserCrudIT extends AbstractIT {

	private String sessionCookie;

	@BeforeEach
	void login() {
		RestAssured.port = this.port;
		Response resp = given().contentType(ContentType.JSON)
				.body("{\"loginName\":\"admin\",\"password\":\"admin\",\"rememberMe\":false}")
				.when().post("/api/v1/auth/login").then().statusCode(200).extract()
				.response();
		this.sessionCookie = resp.getCookie("JSESSIONID");
	}

	@Test
	void listUsers_asAdmin_returns200() {
		given().cookie("JSESSIONID", this.sessionCookie).when().get("/api/v1/users")
				.then().statusCode(200).body("totalElements", greaterThan(0))
				.body("content", notNullValue());
	}

	@Test
	void listAuthorities_asAdmin_returns200() {
		given().cookie("JSESSIONID", this.sessionCookie).when()
				.get("/api/v1/users/authorities").then().statusCode(200);
	}

	@Test
	void listUsers_asUser_returns403() {
		Response userResp = given().contentType(ContentType.JSON)
				.body("{\"loginName\":\"user\",\"password\":\"user\",\"rememberMe\":false}")
				.when().post("/api/v1/auth/login").then().statusCode(200).extract()
				.response();
		String userCookie = userResp.getCookie("JSESSIONID");

		given().cookie("JSESSIONID", userCookie).when().get("/api/v1/users").then()
				.statusCode(403);
	}

	@Test
	void createAndDeleteUser_asAdmin() {
		String newUserJson = """
				{"loginName":"testcrud","firstName":"Test","lastName":"Crud",
				"email":"testcrud@example.com","locale":"en","enabled":true,
				"authorities":"USER","passwordHash":"$2a$10$placeholder"}
				""";

		Integer newId = given().cookie("JSESSIONID", this.sessionCookie)
				.contentType(ContentType.JSON).body(newUserJson).when()
				.put("/api/v1/users").then().statusCode(200)
				.body("loginName", equalTo("testcrud")).extract()
				.path("id");

		given().cookie("JSESSIONID", this.sessionCookie).when()
				.delete("/api/v1/users/" + newId).then().statusCode(204);
	}

}
