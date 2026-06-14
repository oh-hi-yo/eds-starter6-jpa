package ch.rasc.eds.starter.util;

import java.util.Collections;
import java.util.List;

public record ServiceResult<T>(T data, List<ValidationMessages> violations) {

	public static <T> ServiceResult<T> success(T data) {
		return new ServiceResult<>(data, Collections.emptyList());
	}

	public static <T> ServiceResult<T> failure(T data, List<ValidationMessages> violations) {
		return new ServiceResult<>(data, violations);
	}

	public boolean isSuccess() {
		return violations == null || violations.isEmpty();
	}

}
