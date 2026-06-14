package ch.rasc.eds.starter.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	@Bean
	public OpenAPI openAPI() {
		return new OpenAPI()
				.info(new Info().title("EDS Starter API").version("2.0")
						.description("Spring Boot 3 REST API — revamped from ExtJS 6 legacy"))
				.addSecurityItem(new SecurityRequirement().addList("cookieAuth"))
				.components(new Components().addSecuritySchemes("cookieAuth",
						new SecurityScheme().type(SecurityScheme.Type.APIKEY)
								.in(SecurityScheme.In.COOKIE).name("JSESSIONID")));
	}

}
