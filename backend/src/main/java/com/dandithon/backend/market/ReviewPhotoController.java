package com.dandithon.backend.market;
import com.dandithon.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/api/v1/review-photos")
public class ReviewPhotoController {
    private final ReviewPhotoService photos;
    public ReviewPhotoController(ReviewPhotoService photos){this.photos=photos;}
    @Operation(summary="리뷰 사진 업로드 (주문별, JPEG/PNG, 8MB 이하)")
    @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<?> upload(@RequestParam String orderId,@RequestParam MultipartFile file){return ApiResponse.ok(photos.upload(orderId,file));}
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> image(@PathVariable String id){return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).header("X-Content-Type-Options","nosniff").header("Cache-Control","private, max-age=300").body(photos.read(id));}
}
