package ch.rasc.eds.starter.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import ch.rasc.eds.starter.entity.User;
import ch.rasc.eds.starter.service.UserService;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

	@Autowired
	MockMvc mockMvc;

	@MockBean
	UserService userService;

	@Test
	@WithMockUser(roles = "ADMIN")
	void list_admin_returns200() throws Exception {
		User user = new User();
		user.setId(1L);
		user.setLoginName("admin");
		user.setAuthorities("ADMIN");
		user.setEnabled(true);

		when(this.userService.read(anyInt(), anyInt(), any()))
				.thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 25), 1));

		this.mockMvc.perform(get("/api/v1/users")).andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1))
				.andExpect(jsonPath("$.content[0].loginName").value("admin"));
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void authorities_returns_list() throws Exception {
		when(this.userService.readAuthorities()).thenReturn(Collections.emptyList());

		this.mockMvc.perform(get("/api/v1/users/authorities")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(roles = "ADMIN")
	void list_emptySearch_returns200() throws Exception {
		when(this.userService.read(anyInt(), anyInt(), anyString()))
				.thenReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 25), 0));

		this.mockMvc.perform(get("/api/v1/users").param("q", "nonexistent"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(0));
	}

}
