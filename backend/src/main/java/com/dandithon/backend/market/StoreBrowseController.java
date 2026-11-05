package com.dandithon.backend.market;
import com.dandithon.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/stores")
public class StoreBrowseController {
    private final QuestService quests;
    public StoreBrowseController(QuestService quests) {this.quests=quests;}
    @Operation(summary="가게 둘러보기 기록 (GPS 방문 인증 아님)")
    @PostMapping("/{storeId}/browse")
    public ApiResponse<?> browse(@PathVariable String storeId) {return ApiResponse.ok(quests.browse(storeId));}
}
