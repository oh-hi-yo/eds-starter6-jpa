package ch.rasc.eds.starter.config;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

	private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

	private final long capacity;

	public RateLimitInterceptor(@Value("${app.rate-limit-capacity:5}") long capacity) {
		this.capacity = capacity;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
			Object handler) throws Exception {
		String ip = resolveClientIp(request);
		Bucket bucket = this.buckets.computeIfAbsent(ip, k -> newBucket());
		if (bucket.tryConsume(1)) {
			return true;
		}
		response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
		response.setContentType("application/problem+json");
		response.getWriter().write(
				"{\"status\":429,\"title\":\"Too Many Requests\",\"detail\":\"Rate limit exceeded. Try again in 1 minute.\"}");
		return false;
	}

	private String resolveClientIp(HttpServletRequest request) {
		String xff = request.getHeader("X-Forwarded-For");
		if (xff != null && !xff.isBlank()) {
			return xff.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}

	private Bucket newBucket() {
		Bandwidth limit = Bandwidth.classic(this.capacity,
				Refill.greedy(this.capacity, Duration.ofMinutes(1)));
		return Bucket.builder().addLimit(limit).build();
	}

}
