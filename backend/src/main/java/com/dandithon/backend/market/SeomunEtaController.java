package com.dandithon.backend.market;

import com.dandithon.backend.common.ApiException;
import com.dandithon.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/stores/{storeId}/eta")
public class SeomunEtaController {
    private final SeomunEtaService service;
    public SeomunEtaController(SeomunEtaService service){this.service=service;}
    public record Request(List<MarketService.ItemRequest> items) {}
    @Operation(summary="서문분식 현재 대기열 (합성 데이터 기반 시연, 실제 매장 정보 아님)")
    @GetMapping public ApiResponse<?> queue(@PathVariable String storeId){return ApiResponse.ok(service.queue(storeId));}
    @Operation(summary="서문분식 메뉴별 AI 준비시간 견적 (조회 전용, 주문/코인 차감 없음)")
    @PostMapping public ApiResponse<?> quote(@PathVariable String storeId,@RequestBody(required=false) Request request){
        if(request==null)throw ApiException.invalid("주문 메뉴를 입력해 주세요.");
        return ApiResponse.ok(service.quote(storeId,request.items()));
    }
}
