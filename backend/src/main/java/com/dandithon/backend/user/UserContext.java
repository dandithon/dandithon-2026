package com.dandithon.backend.user;

public final class UserContext {
    private static final ThreadLocal<Long> CURRENT_USER = new ThreadLocal<>();

    private UserContext() {}

    public static void setUserId(Long userId) {
        CURRENT_USER.set(userId);
    }

    public static long getUserId() {
        Long id = CURRENT_USER.get();
        return id != null ? id : 1L;
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
