package com.dandithon.backend.map;
import com.dandithon.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/map")
public class MapController {
    public record Zone(String id,String name,String desc) {}
    public record Zones(List<Zone> zones) {}
    @Operation(summary="서문시장 전체 지도 구역 조회") @GetMapping("/zones")
    public ApiResponse<Zones> zones() { return ApiResponse.ok(new Zones(List.of(
        new Zone("zone-1","1지구","섬유 한복"),new Zone("zone-2","2지구","먹거리 타운"),
        new Zone("zone-dongsan","동산상가","패션 의류"),new Zone("zone-night","야시장","야간 먹거리")))); }
}
