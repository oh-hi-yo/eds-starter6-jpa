package ch.rasc.eds.starter.config;

import java.util.Locale;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;

import com.samskivert.mustache.Mustache;

@Configuration
public class WebConfig {

	@Bean
	public LocaleResolver localeResolver() {
		AppLocaleResolver resolver = new AppLocaleResolver();
		resolver.setDefaultLocale(Locale.ENGLISH);
		return resolver;
	}

	@Bean
	public Mustache.Compiler mustacheCompiler() {
		return Mustache.compiler();
	}
}
