package ch.rasc.eds.starter.e2e;

import static io.restassured.RestAssured.given;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import ch.rasc.eds.starter.AbstractIT;
import ch.rasc.eds.starter.entity.QUser;
import ch.rasc.eds.starter.util.JPAQueryFactory;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

class LockoutIT extends AbstractIT {

	@Autowired
	JPAQueryFactory jpaQueryFactory;

	@BeforeEach
	void setUp() {
		RestAssured.port = this.port;
		// Reset failed logins for user account before each test
		this.jpaQueryFactory.update(QUser.user).set(QUser.user.failedLogins, 0)
				.setNull(QUser.user.lockedOutUntil)
				.where(QUser.user.loginName.eq("user")).execute();
	}

	@Test
	void tenFailedLogins_locksAccount_eleventhReturns423() {
		// 10 failed login attempts
		for (int i = 0; i < 10; i++) {
			given().contentType(ContentType.JSON).body(
					"{\"loginName\":\"user\",\"password\":\"WRONG\",\"rememberMe\":false}")
					.when().post("/api/v1/auth/login").then().statusCode(401);
		}

		// Verify lockedOutUntil was set
		var lockedUser = this.jpaQueryFactory.selectFrom(QUser.user)
				.where(QUser.user.loginName.eq("user")).fetchFirst();
		org.assertj.core.api.Assertions.assertThat(lockedUser.getLockedOutUntil()).isNotNull();

		// 11th attempt → 423
		given().contentType(ContentType.JSON)
				.body("{\"loginName\":\"user\",\"password\":\"WRONG\",\"rememberMe\":false}")
				.when().post("/api/v1/auth/login").then().statusCode(423);
	}

}
