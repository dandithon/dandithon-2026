package com.dandithon.backend.common;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiResponse<Void>> handle(ApiException ex) {
        return ResponseEntity.status(ex.status()).body(ApiResponse.fail(ex.code(), ex.getMessage()));
    }
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class})
    ResponseEntity<ApiResponse<Void>> invalid(Exception ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("INVALID_INPUT_VALUE", "요청 값을 확인해 주세요."));
    }
    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiResponse<Void>> notFound(Exception ex) {
        return ResponseEntity.status(404).body(ApiResponse.fail("INVALID_INPUT_VALUE", "요청 경로를 확인해 주세요."));
    }
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiResponse<Void>> method(Exception ex) {
        return ResponseEntity.status(405).body(ApiResponse.fail("INVALID_INPUT_VALUE", "요청 방식을 확인해 주세요."));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> unexpected(Exception ex) {
        log.error("API request failed", ex);
        return ResponseEntity.internalServerError().body(ApiResponse.fail("INTERNAL_SERVER_ERROR", "요청을 처리하지 못했어요."));
    }
}
