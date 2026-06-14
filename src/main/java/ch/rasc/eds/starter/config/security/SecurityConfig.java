package ch.rasc.eds.starter.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.RememberMeServices;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

import ch.rasc.eds.starter.config.AppProperties;

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
@EnableWebSecurity
class SecurityConfig {

	private final RememberMeServices rememberMeServices;

	private final AppProperties appProperties;

	private final AuthenticationSuccessHandler authenticationSuccessHandler;

	private final Environment environment;

	SecurityConfig(RememberMeServices rememberMeServices, AppProperties appProperties,
			AuthenticationSuccessHandler authenticationSuccessHandler,
			Environment environment) {
		this.rememberMeServices = rememberMeServices;
		this.appProperties = appProperties;
		this.authenticationSuccessHandler = authenticationSuccessHandler;
		this.environment = environment;
	}

	@Bean
	public DaoAuthenticationProvider authenticationProvider(
			UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
		provider.setUserDetailsService(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return provider;
	}

	@Bean
	public AuthenticationManager authenticationManager(
			AuthenticationConfiguration authConfig) throws Exception {
		return authConfig.getAuthenticationManager();
	}

	@Bean
	public CookieSerializer cookieSerializer() {
		DefaultCookieSerializer serializer = new DefaultCookieSerializer();
		serializer.setCookieName("JSESSIONID");
		serializer.setUseHttpOnlyCookie(true);
		serializer.setSameSite("Lax");
		return serializer;
	}

	@Bean
	public WebSecurityCustomizer webSecurityCustomizer() {
		return web -> {
			if (this.environment.acceptsProfiles(Profiles.of("development"))) {
				web.ignoring().requestMatchers("/resources/**", "/build/**", "/ext/**",
						"/bootstrap.json", "/robots.txt");
			}
			else {
				web.ignoring().requestMatchers("/resources/**", "/app.js", "/app.json",
						"/locale-de.js", "/i18n-de.js", "/i18n-en.js", "/robots.txt");
			}
		};
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		// @formatter:off
		http
		  .authorizeHttpRequests(authz -> authz
		    .requestMatchers("/index.html", "/csrf", "/", "/api/v1/auth/**").permitAll()
		    .requestMatchers("/actuator/info", "/actuator/health").permitAll()
		    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
		    .anyRequest().authenticated()
		  )
		  .addFilterBefore(new TwoFactorFilter(),
		      UsernamePasswordAuthenticationFilter.class)
		  .rememberMe(rm -> rm
		    .rememberMeServices(this.rememberMeServices)
		    .key(this.appProperties.getRemembermeCookieKey())
		  )
		  .formLogin(form -> form.disable())
		  .logout(logout -> logout
		    .logoutUrl("/api/v1/auth/logout")
		    .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler())
		    .deleteCookies("JSESSIONID")
		    .permitAll()
		  )
		  .exceptionHandling(ex -> ex
		    .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
		  )
		  .csrf(csrf -> csrf.disable());
		// @formatter:on
		return http.build();
	}

}
