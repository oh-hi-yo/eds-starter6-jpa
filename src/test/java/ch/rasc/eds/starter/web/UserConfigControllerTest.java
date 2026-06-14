package ch.rasc.eds.starter.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import ch.rasc.eds.starter.dto.UserSettings;
import ch.rasc.eds.starter.service.UserConfigService;

@WebMvcTest(UserConfigController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserConfigControllerTest {

	@Autowired
	MockMvc mockMvc;

	@MockBean
	UserConfigService userConfigService;

	@Test
	@WithMockUser
	void readSettings_authenticated_returns200() throws Exception {
		UserSettings settings = new UserSettings();
		settings.setLoginName("admin");
		settings.setFirstName("Admin");
		settings.setLastName("User");
		settings.setEmail("admin@example.com");
		settings.setLocale("en");

		when(this.userConfigService.readSettings(any())).thenReturn(settings);

		this.mockMvc.perform(get("/api/v1/me/settings")).andExpect(status().isOk())
				.andExpect(jsonPath("$.loginName").value("admin"));
	}

}
