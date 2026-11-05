package com.dandithon.backend.profile;
import com.dandithon.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1")
public class ProfileController {
    private final ProfileService service;
    public ProfileController(ProfileService service) { this.service=service; }
    public record NicknameRequest(@NotBlank String nickname) {}
    public record ChargeRequest(Long amount) {}
    @Operation(summary="게스트 사용자 정보 조회") @GetMapping("/users/me")
    public ApiResponse<ProfileService.UserView> me() { return ApiResponse.ok(service.me()); }
    @Operation(summary="코인 충전 (기본 100,000, 최대 10,000,000)")
    @PostMapping("/users/me/charge")
    public ApiResponse<ProfileService.UserView> charge(@RequestBody(required=false) ChargeRequest request) {
        Long amount = request != null ? request.amount() : null;
        return ApiResponse.ok(service.charge(amount));
    }
    @Operation(summary="시연용 데모 데이터 초기화 (코인 1,000 복구, 주문/리뷰/배지 초기화)")
    @PostMapping("/demo/reset")
    public ApiResponse<ProfileService.UserView> reset() {
        return ApiResponse.ok(service.resetDemo());
    }
    @Operation(summary="닉네임 변경 (1~8자)") @PatchMapping("/users/me/nickname")
    public ApiResponse<ProfileService.NicknameView> rename(@Valid @RequestBody NicknameRequest request) { return ApiResponse.ok(service.rename(request.nickname())); }
    @Operation(summary="장비 목록과 획득 상태 조회") @GetMapping("/profile/equipments")
    public ApiResponse<ProfileService.EquipmentsView> equipment() { return ApiResponse.ok(service.equipment()); }
    @Operation(summary="획득한 장비 착용·해제") @PatchMapping("/profile/equipments/{id}/toggle")
    public ApiResponse<ProfileService.EquippedView> toggle(@PathVariable String id) { return ApiResponse.ok(service.toggle(id)); }
    @Operation(summary="음식별 구매 횟수와 배지 조회") @GetMapping("/profile/badges")
    public ApiResponse<ProfileService.BadgesView> badges() { return ApiResponse.ok(service.badges()); }
}
