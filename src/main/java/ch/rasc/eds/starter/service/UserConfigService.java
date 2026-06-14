package ch.rasc.eds.starter.service;

import java.util.List;
import java.util.Locale;

import jakarta.validation.Validator;

import org.springframework.context.MessageSource;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import ch.rasc.eds.starter.config.security.JpaUserDetails;
import ch.rasc.eds.starter.config.security.RequireAnyAuthority;
import ch.rasc.eds.starter.dto.UserSettings;
import ch.rasc.eds.starter.entity.PersistentLogin;
import ch.rasc.eds.starter.entity.QPersistentLogin;
import ch.rasc.eds.starter.entity.User;
import ch.rasc.eds.starter.util.JPAQueryFactory;
import ch.rasc.eds.starter.util.ServiceResult;
import ch.rasc.eds.starter.util.TotpAuthUtil;
import ch.rasc.eds.starter.util.ValidationMessages;
import ch.rasc.eds.starter.util.ValidationUtil;
import eu.bitwalker.useragentutils.UserAgent;

@Service
@RequireAnyAuthority
public class UserConfigService {

	private final PasswordEncoder passwordEncoder;

	private final JPAQueryFactory jpaQueryFactory;

	private final Validator validator;

	private final MessageSource messageSource;

	public UserConfigService(JPAQueryFactory jpaQueryFactory, Validator validator,
			PasswordEncoder passwordEncoder, MessageSource messageSource) {
		this.jpaQueryFactory = jpaQueryFactory;
		this.messageSource = messageSource;
		this.validator = validator;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public UserSettings readSettings(
			@AuthenticationPrincipal JpaUserDetails jpaUserDetails) {
		return new UserSettings(jpaUserDetails.getUser(this.jpaQueryFactory));
	}

	@Transactional
	public String enable2f(@AuthenticationPrincipal JpaUserDetails jpaUserDetails) {
		User user = jpaUserDetails.getUser(this.jpaQueryFactory);
		user.setSecret(TotpAuthUtil.randomSecret());
		return user.getSecret();
	}

	@Transactional
	public void disable2f(@AuthenticationPrincipal JpaUserDetails jpaUserDetails) {
		User user = jpaUserDetails.getUser(this.jpaQueryFactory);
		user.setSecret(null);
	}

	@Transactional
	public ServiceResult<UserSettings> updateSettings(
			UserSettings modifiedUserSettings,
			@AuthenticationPrincipal JpaUserDetails jpaUserDetails, Locale locale) {

		List<ValidationMessages> validations = ValidationUtil
				.validateEntity(this.validator, modifiedUserSettings);
		User user = jpaUserDetails.getUser(this.jpaQueryFactory);

		if (StringUtils.hasText(modifiedUserSettings.getNewPassword())
				&& validations.isEmpty()) {
			if (this.passwordEncoder.matches(modifiedUserSettings.getCurrentPassword(),
					user.getPasswordHash())) {
				if (modifiedUserSettings.getNewPassword()
						.equals(modifiedUserSettings.getNewPasswordRetype())) {
					user.setPasswordHash(this.passwordEncoder
							.encode(modifiedUserSettings.getNewPassword()));
				}
				else {
					for (String field : new String[] { "newPassword",
							"newPasswordRetype" }) {
						ValidationMessages error = new ValidationMessages();
						error.setField(field);
						error.setMessage(this.messageSource
								.getMessage("userconfig_pwdonotmatch", null, locale));
						validations.add(error);
					}
				}
			}
			else {
				ValidationMessages error = new ValidationMessages();
				error.setField("currentPassword");
				error.setMessage(this.messageSource.getMessage("userconfig_wrongpassword",
						null, locale));
				validations.add(error);
			}
		}

		if (!UserService.isEmailUnique(this.jpaQueryFactory, user.getId(),
				modifiedUserSettings.getEmail())) {
			ValidationMessages validationError = new ValidationMessages();
			validationError.setField("email");
			validationError.setMessage(
					this.messageSource.getMessage("user_emailtaken", null, locale));
			validations.add(validationError);
		}

		if (!UserService.isLoginNameUnique(this.jpaQueryFactory, user.getId(),
				modifiedUserSettings.getLoginName())) {
			ValidationMessages validationError = new ValidationMessages();
			validationError.setField("loginName");
			validationError.setMessage(
					this.messageSource.getMessage("user_loginnametaken", null, locale));
			validations.add(validationError);
		}

		if (validations.isEmpty()) {
			user.setLoginName(modifiedUserSettings.getLoginName());
			user.setLastName(modifiedUserSettings.getLastName());
			user.setFirstName(modifiedUserSettings.getFirstName());
			user.setEmail(modifiedUserSettings.getEmail());
			user.setLocale(modifiedUserSettings.getLocale());
		}

		return new ServiceResult<>(modifiedUserSettings, validations);
	}

	@Transactional(readOnly = true)
	public List<PersistentLogin> readPersistentLogins(
			@AuthenticationPrincipal JpaUserDetails jpaUserDetails) {
		List<PersistentLogin> persistentLogins = this.jpaQueryFactory
				.selectFrom(QPersistentLogin.persistentLogin)
				.where(QPersistentLogin.persistentLogin.user.id
						.eq(jpaUserDetails.getUserDbId()))
				.fetch();

		persistentLogins.forEach(p -> {
			String ua = p.getUserAgent();
			if (StringUtils.hasText(ua)) {
				UserAgent userAgent = UserAgent.parseUserAgentString(ua);
				p.setUserAgentName(userAgent.getBrowser().getGroup().getName());
				p.setUserAgentVersion(userAgent.getBrowserVersion().getMajorVersion());
				p.setOperatingSystem(userAgent.getOperatingSystem().getName());
			}
		});

		return persistentLogins;
	}

	@Transactional
	public void destroyPersistentLogin(String series,
			@AuthenticationPrincipal JpaUserDetails jpaUserDetails) {
		this.jpaQueryFactory.delete(QPersistentLogin.persistentLogin)
				.where(QPersistentLogin.persistentLogin.series.eq(series)
						.and(QPersistentLogin.persistentLogin.user.id
								.eq(jpaUserDetails.getUserDbId())))
				.execute();
	}

}
