package com.dandithon.backend.market;
import com.dandithon.backend.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/quests")
public class QuestController {
    private final QuestService service;
    public QuestController(QuestService service) {this.service=service;}
    @GetMapping public ApiResponse<?> list() {return ApiResponse.ok(service.list());}
    @PostMapping("/{questId}/claim") public ApiResponse<?> claim(@PathVariable String questId) {return ApiResponse.ok(service.claim(questId));}
}
