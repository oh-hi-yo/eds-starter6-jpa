package ch.rasc.eds.starter.service;

import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.validation.Validator;

import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.impl.JPAQuery;

import ch.rasc.eds.starter.config.security.RequireAdminAuthority;
import ch.rasc.eds.starter.entity.Authority;
import ch.rasc.eds.starter.entity.QUser;
import ch.rasc.eds.starter.entity.User;
import ch.rasc.eds.starter.util.JPAQueryFactory;
import ch.rasc.eds.starter.util.ServiceResult;
import ch.rasc.eds.starter.util.ValidationMessages;
import ch.rasc.eds.starter.util.ValidationUtil;
import de.danielbechler.diff.ObjectDiffer;
import de.danielbechler.diff.ObjectDifferBuilder;
import de.danielbechler.diff.node.DiffNode;
import de.danielbechler.diff.node.DiffNode.State;

@Service
@RequireAdminAuthority
public class UserService {

	private final MessageSource messageSource;

	private final Validator validator;

	private final JPAQueryFactory jpaQueryFactory;

	private final MailService mailService;

	public UserService(JPAQueryFactory jpaQueryFactory, Validator validator,
			MessageSource messageSource, MailService mailService) {
		this.jpaQueryFactory = jpaQueryFactory;
		this.messageSource = messageSource;
		this.validator = validator;
		this.mailService = mailService;
	}

	@Transactional(readOnly = true)
	public Page<User> read(int page, int size, String q) {
		JPQLQuery<User> query = this.jpaQueryFactory.selectFrom(QUser.user);
		if (StringUtils.hasText(q)) {
			BooleanBuilder bb = new BooleanBuilder();
			bb.or(QUser.user.loginName.containsIgnoreCase(q));
			bb.or(QUser.user.lastName.containsIgnoreCase(q));
			bb.or(QUser.user.firstName.containsIgnoreCase(q));
			bb.or(QUser.user.email.containsIgnoreCase(q));
			query.where(bb);
		}
		query.where(QUser.user.deleted.isFalse());

		long total = query.fetchCount();
		query.offset((long) page * size).limit(size);
		List<User> content = query.fetch();

		return new PageImpl<>(content, PageRequest.of(page, size), total);
	}

	@Transactional
	public boolean destroy(Long userId) {
		if (!isLastAdmin(userId)) {
			User user = this.jpaQueryFactory.getEntityManager().find(User.class, userId);
			this.jpaQueryFactory.getEntityManager().remove(user);
			return true;
		}
		return false;
	}

	@Transactional
	public ServiceResult<User> update(User updatedEntity, Locale locale) {
		List<ValidationMessages> violations = new ArrayList<>();
		if (updatedEntity.getId() != null && updatedEntity.getId() > 0) {
			User dbUser = this.jpaQueryFactory.selectFrom(QUser.user)
					.where(QUser.user.id.eq(updatedEntity.getId())).fetchFirst();
			updatedEntity.setPasswordHash(dbUser.getPasswordHash());
			updatedEntity.setSecret(dbUser.getSecret());
			updatedEntity.setPasswordResetToken(dbUser.getPasswordResetToken());
			updatedEntity.setPasswordResetTokenValidUntil(
					dbUser.getPasswordResetTokenValidUntil());
			updatedEntity.setLastAccess(dbUser.getLastAccess());
			updatedEntity.setLockedOutUntil(dbUser.getLockedOutUntil());
			updatedEntity.setFailedLogins(dbUser.getFailedLogins());
			updatedEntity.setPersistentLogins(dbUser.getPersistentLogins());

			violations.addAll(checkIfLastAdmin(updatedEntity, locale, dbUser));
		}

		violations.addAll(validateEntity(updatedEntity, locale));
		if (violations.isEmpty()) {
			if (!updatedEntity.isEnabled()
					&& updatedEntity.getPersistentLogins() != null) {
				updatedEntity.getPersistentLogins().clear();
			}

			User merged = this.jpaQueryFactory.getEntityManager().merge(updatedEntity);
			return ServiceResult.success(merged);
		}

		return ServiceResult.failure(updatedEntity, violations);
	}

	private List<ValidationMessages> checkIfLastAdmin(User updatedEntity, Locale locale,
			User dbUser) {

		List<ValidationMessages> validationErrors = new ArrayList<>();

		if (dbUser != null && (!updatedEntity.isEnabled()
				|| !updatedEntity.getAuthorities().contains(Authority.ADMIN.name()))) {
			if (isLastAdmin(updatedEntity.getId())) {

				ObjectDiffer objectDiffer = ObjectDifferBuilder.startBuilding()
						.filtering().returnNodesWithState(State.UNTOUCHED).and().build();
				DiffNode diff = objectDiffer.compare(updatedEntity, dbUser);

				DiffNode diffNode = diff.getChild("enabled");
				if (!diffNode.isUntouched()) {
					updatedEntity.setEnabled(dbUser.isEnabled());

					ValidationMessages validationError = new ValidationMessages();
					validationError.setField("enabled");
					validationError.setMessage(this.messageSource
							.getMessage("user_lastadmin_error", null, locale));
					validationErrors.add(validationError);
				}

				diffNode = diff.getChild("authorities");
				if (!diffNode.isUntouched()) {
					updatedEntity.setAuthorities(dbUser.getAuthorities());

					ValidationMessages validationError = new ValidationMessages();
					validationError.setField("authorities");
					validationError.setMessage(this.messageSource
							.getMessage("user_lastadmin_error", null, locale));
					validationErrors.add(validationError);
				}

			}
		}

		return validationErrors;
	}

	private List<ValidationMessages> validateEntity(User user, Locale locale) {
		List<ValidationMessages> validations = ValidationUtil
				.validateEntity(this.validator, user);

		if (!isEmailUnique(this.jpaQueryFactory, user.getId(), user.getEmail())) {
			ValidationMessages validationError = new ValidationMessages();
			validationError.setField("email");
			validationError.setMessage(
					this.messageSource.getMessage("user_emailtaken", null, locale));
			validations.add(validationError);
		}

		if (!isLoginNameUnique(this.jpaQueryFactory, user.getId(), user.getLoginName())) {
			ValidationMessages validationError = new ValidationMessages();
			validationError.setField("loginName");
			validationError.setMessage(
					this.messageSource.getMessage("user_loginnametaken", null, locale));
			validations.add(validationError);
		}

		return validations;
	}

	private boolean isLastAdmin(Long id) {
		JPAQuery<Integer> query = this.jpaQueryFactory.select(Expressions.ONE)
				.from(QUser.user);
		BooleanBuilder bb = new BooleanBuilder();
		bb.or(QUser.user.authorities.eq(Authority.ADMIN.name()));
		bb.or(QUser.user.authorities.endsWith("," + Authority.ADMIN.name()));
		bb.or(QUser.user.authorities.contains("," + Authority.ADMIN.name() + ","));
		bb.or(QUser.user.authorities.startsWith(Authority.ADMIN.name() + ","));

		query.where(QUser.user.id.ne(id).and(QUser.user.deleted.isFalse())
				.and(QUser.user.enabled.isTrue()).and(bb));
		return query.fetchFirst() == null;
	}

	public static boolean isEmailUnique(JPAQueryFactory jpaQueryFactory, Long userId,
			String email) {
		if (StringUtils.hasText(email)) {
			BooleanBuilder bb = new BooleanBuilder(
					QUser.user.email.equalsIgnoreCase(email));
			if (userId != null) {
				bb.and(QUser.user.id.ne(userId));
			}
			return jpaQueryFactory.select(Expressions.ONE).from(QUser.user).where(bb)
					.fetchFirst() == null;
		}

		return true;
	}

	public static boolean isLoginNameUnique(JPAQueryFactory jpaQueryFactory, Long userId,
			String loginName) {
		if (StringUtils.hasText(loginName)) {
			BooleanBuilder bb = new BooleanBuilder(
					QUser.user.loginName.equalsIgnoreCase(loginName));
			if (userId != null) {
				bb.and(QUser.user.id.ne(userId));
			}
			return jpaQueryFactory.select(Expressions.ONE).from(QUser.user).where(bb)
					.fetchFirst() == null;
		}

		return true;
	}

	public List<Map<String, String>> readAuthorities() {
		return Arrays.stream(Authority.values())
				.map(r -> Collections.singletonMap("name", r.name()))
				.collect(Collectors.toList());
	}

	@Transactional
	public void unlock(Long userId) {
		this.jpaQueryFactory.update(QUser.user).setNull(QUser.user.lockedOutUntil)
				.setNull(QUser.user.failedLogins).where(QUser.user.id.eq(userId))
				.execute();
	}

	@Transactional
	public void disableTwoFactorAuth(Long userId) {
		this.jpaQueryFactory.update(QUser.user).setNull(QUser.user.secret)
				.where(QUser.user.id.eq(userId)).execute();
	}

	@Transactional
	public void sendPassordResetEmail(Long userId) {
		User user = this.jpaQueryFactory.getEntityManager().find(User.class, userId);
		String token = UUID.randomUUID().toString();
		this.mailService.sendPasswortResetEmail(user, token);

		user.setPasswordResetTokenValidUntil(
				ZonedDateTime.now(ZoneOffset.UTC).plusHours(4));
		user.setPasswordResetToken(token);
	}

}
