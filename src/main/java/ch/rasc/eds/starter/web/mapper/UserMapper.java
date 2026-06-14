package ch.rasc.eds.starter.web.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import ch.rasc.eds.starter.entity.User;
import ch.rasc.eds.starter.web.dto.UserResponse;

@Mapper(componentModel = "spring")
public interface UserMapper {

	@Mapping(target = "twoFactorAuth", expression = "java(user.isTwoFactorAuth())")
	UserResponse toResponse(User user);

}
