package com.dandithon.backend.market;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ReviewPhotoRepository extends JpaRepository<ReviewPhoto,String> {
    long countByOrderIdAndReviewIdIsNull(String orderId);
    void deleteByReviewIdIsNullAndCreatedAtBefore(LocalDateTime cutoff);
    void deleteByReviewId(String reviewId);
}
