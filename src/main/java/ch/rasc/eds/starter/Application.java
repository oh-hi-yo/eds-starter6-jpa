package ch.rasc.eds.starter;

import java.lang.invoke.MethodHandles;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.web.SpringDataWebAutoConfiguration;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.mustache.MustacheAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import ch.rasc.eds.starter.entity.AbstractPersistable;

@SpringBootApplication(exclude = { MustacheAutoConfiguration.class,
		SpringDataWebAutoConfiguration.class })
@EntityScan(basePackageClasses = AbstractPersistable.class)
@EnableAsync
@EnableScheduling
public class Application {

	public static final Logger logger = LoggerFactory
			.getLogger(MethodHandles.lookup().lookupClass());

	public static void main(String[] args) {
		// -Dspring.profiles.active=development
		SpringApplication.run(Application.class, args);
	}

}
