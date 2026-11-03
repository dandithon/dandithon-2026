package com.dandithon.backend.common;
import org.springframework.http.HttpStatus;
public class ApiException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    public ApiException(String code, String message, HttpStatus status) {
        super(message); this.code=code; this.status=status;
    }
    public String code() { return code; }
    public HttpStatus status() { return status; }
    public static ApiException invalid(String message) {
        return new ApiException("INVALID_INPUT_VALUE", message, HttpStatus.BAD_REQUEST);
    }
}
