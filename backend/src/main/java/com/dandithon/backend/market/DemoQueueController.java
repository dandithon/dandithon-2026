package com.dandithon.backend.market;

import com.dandithon.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/demo/seomun/queue")
public class DemoQueueController {
    private final SeomunEtaService service;
    public DemoQueueController(SeomunEtaService service){this.service=service;}
    @Operation(summary="가상 일반 주문 7건으로 NPC 약 7명 대기열 재구성 (코인/영수증 변화 없음)")
    @PostMapping("/seed") public ApiResponse<?> seed(){return ApiResponse.ok(service.seed());}
    @Operation(summary="서문분식 가상 대기열만 비우기 (사용자 주문 유지)")
    @DeleteMapping public ApiResponse<?> clear(){return ApiResponse.ok(service.clear());}
}
