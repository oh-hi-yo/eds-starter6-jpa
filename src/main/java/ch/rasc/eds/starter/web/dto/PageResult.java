package ch.rasc.eds.starter.web.dto;

import java.util.List;

import org.springframework.data.domain.Page;

public record PageResult<T>(
		List<T> content,
		long totalElements,
		int totalPages,
		int page,
		int size) {

	public static <T> PageResult<T> from(Page<T> page) {
		return new PageResult<>(page.getContent(), page.getTotalElements(),
				page.getTotalPages(), page.getNumber(), page.getSize());
	}

}
