package com.dandithon.backend.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class UserContextInterceptor implements HandlerInterceptor {

    private final UserRepository users;

    public UserContextInterceptor(UserRepository users) {
        this.users = users;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String header = request.getHeader("X-User-Id");
        if (header == null || header.isBlank()) {
            header = request.getHeader("X-Guest-Id");
        }

        long userId = 1L;
        if (header != null && !header.isBlank()) {
            try {
                long parsed = Long.parseLong(header.trim());
                if (parsed > 0 && parsed <= 1_000_000_000_000L) {
                    userId = parsed;
                    if (!users.existsById(userId)) {
                        users.save(new GuestUser(userId));
                    }
                }
            } catch (Exception ignored) {}
        }

        UserContext.setUserId(userId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
