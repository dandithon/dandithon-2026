package com.dandithon.backend.market;
import com.dandithon.backend.common.ApiResponse;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1")
public class MarketController {
    private final MarketService service;
    public MarketController(MarketService service) {this.service=service;}
    @GetMapping("/stores") public ApiResponse<?> stores() {return ApiResponse.ok(Map.of("stores",service.stores()));}
    @GetMapping("/stores/{storeId}") public ApiResponse<?> store(@PathVariable String storeId) {return ApiResponse.ok(service.store(storeId));}
    @PostMapping("/orders") public ApiResponse<?> order(@RequestBody(required=false) MarketService.OrderRequest request,@RequestHeader(value="Idempotency-Key",required=false) String key) {return ApiResponse.ok(service.order(request,key));}
    @GetMapping("/orders/receipts") public ApiResponse<?> receipts() {return ApiResponse.ok(Map.of("receipts",service.receipts()));}
    @GetMapping("/stores/{storeId}/reviews") public ApiResponse<?> reviews(@PathVariable String storeId) {return ApiResponse.ok(Map.of("reviews",service.reviews(storeId)));}
    @PostMapping("/reviews") @ResponseStatus(HttpStatus.CREATED) public ApiResponse<?> review(@RequestBody(required=false) MarketService.ReviewRequest request) {return ApiResponse.ok(service.review(request));}
}
