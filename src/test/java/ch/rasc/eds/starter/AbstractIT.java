package ch.rasc.eds.starter;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base class for integration tests. Uses embedded H2 (application-test.yml).
 * MySQL Testcontainers variant kept as AbstractMySQLIT for when Docker is available.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class AbstractIT {

	@LocalServerPort
	protected int port;

}
